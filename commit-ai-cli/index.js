#!/usr/bin/env node

import './src/load-env.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import * as git from './src/git.js';
import * as ai from './src/ai.js';
import * as storage from './src/storage.js';
import * as interactive from './src/interactive.js';
import * as pr from './src/pr.js';
import { CLIArgs, showHelpMessage, showVersion } from './src/args.js';
import { CONFIG, COMMIT_STYLES } from './src/config.js';
import {
  resolveProvider,
  resolveProviderModel,
  getProviderDisplayName,
  resolveInteractiveProviderAndModel
} from './src/provider.js';

function showModelWarning(warning) {
  if (warning) {
    interactive.showWarning(warning);
  }
}

async function ensureProviderReady(provider) {
  const spinner = interactive.createSpinner(`Conectando con ${getProviderDisplayName(provider)}...`);
  spinner.start();

  try {
    await ai.initAI(provider);
    spinner.succeed(`Conectado con ${getProviderDisplayName(provider)} ✓`);
  } catch (error) {
    spinner.fail(`Error al conectar con ${getProviderDisplayName(provider)}`);
    throw error;
  }
}

function getInteractiveDeps() {
  return {
    prompt: (questions) => inquirer.prompt(questions),
    selectProvider: interactive.selectProvider,
    selectModel: interactive.selectModel,
    ensureProviderReady,
    showWarning: showModelWarning,
    showError: interactive.showError
  };
}

/**
 * Función principal - Modo no interactivo COMMIT (por defecto)
 */
async function nonInteractiveCommitMode(cliArgs) {
  try {
    const isRepo = await git.isGitRepository();
    if (!isRepo) {
      interactive.showError('No estás en un repositorio Git válido.');
      process.exit(1);
    }

    const savedConfig = await storage.getConfig();
    const provider = resolveProvider(cliArgs.getProvider(), savedConfig);
    const style = cliArgs.getStyle() || savedConfig.defaultStyle || CONFIG.DEFAULT_STYLE;
    const modelResult = resolveProviderModel(cliArgs.getModel(), savedConfig, provider);
    const model = modelResult.model;

    showModelWarning(modelResult.warning);
    await ensureProviderReady(provider);

    if (!COMMIT_STYLES[style]) {
      interactive.showError(`Estilo de commit no válido: ${style}`);
      process.exit(1);
    }

    const spinner2 = interactive.createSpinner('Obteniendo cambios...');
    spinner2.start();

    let diff;
    try {
      diff = await git.getStagedDiff();
      spinner2.succeed('Cambios obtenidos ✓');
    } catch (error) {
      spinner2.fail('Error al obtener cambios');
      interactive.showError(error.message);
      process.exit(1);
    }

    const spinner3 = interactive.createSpinner('Generando mensaje con IA...');
    spinner3.start();

    let message;
    try {
      message = await ai.generateCommitMessage(diff, style, model, provider);
      showModelWarning(message.modelWarning);
      spinner3.succeed('Mensaje generado ✓');
    } catch (error) {
      spinner3.fail('Error al generar mensaje');
      interactive.showError(error.message);
      process.exit(1);
    }

    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold('Mensaje de commit:'));
    interactive.showCommitPreview(message);
    console.log(chalk.cyan('═'.repeat(60)) + '\n');

    const spinner4 = interactive.createSpinner('Ejecutando commit...');
    spinner4.start();

    try {
      await git.executeCommit(message);
      spinner4.succeed('Commit ejecutado ✓');

      await storage.saveCommit(message, diff, style, model, provider);
      await storage.updateStats(style, model, provider);

      interactive.showSuccess('¡Commit realizado exitosamente!');
    } catch (error) {
      spinner4.fail('Error al ejecutar commit');
      interactive.showError(error.message);
      process.exit(1);
    }
  } catch (error) {
    interactive.showError(`Error fatal: ${error.message}`);
    if (cliArgs.isDebug()) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Función principal - Modo no interactivo PR
 */
async function nonInteractivePRMode(cliArgs) {
  try {
    const isRepo = await git.isGitRepository();
    if (!isRepo) {
      interactive.showError('No estás en un repositorio Git válido.');
      process.exit(1);
    }

    try {
      await pr.validatePRRequirements(git);
    } catch (error) {
      interactive.showError(error.message);
      process.exit(1);
    }

    const savedConfig = await storage.getConfig();
    const provider = resolveProvider(cliArgs.getProvider(), savedConfig);
    const modelResult = resolveProviderModel(cliArgs.getModel(), savedConfig, provider);
    const model = modelResult.model;

    showModelWarning(modelResult.warning);
    await ensureProviderReady(provider);

    const spinner2 = interactive.createSpinner('Obteniendo cambios...');
    spinner2.start();

    let diff;
    try {
      diff = await git.getStagedDiff();
      spinner2.succeed('Cambios obtenidos ✓');
    } catch (error) {
      spinner2.fail('Error al obtener cambios');
      interactive.showError(error.message);
      process.exit(1);
    }

    const spinner3 = interactive.createSpinner('Generando contenido de PR con IA...');
    spinner3.start();

    let prContent;
    try {
      prContent = await pr.generatePRContent(diff, null, model, provider);
      spinner3.succeed('Contenido de PR generado ✓');
    } catch (error) {
      spinner3.fail('Error al generar contenido de PR');
      interactive.showError(error.message);
      process.exit(1);
    }

    console.log(pr.formatPRContent(prContent));

    const spinner4 = interactive.createSpinner('Obteniendo información del repositorio...');
    spinner4.start();

    let repoInfo;
    try {
      repoInfo = await pr.getRepositoryInfo(git);
      spinner4.succeed('Información obtenida ✓');
    } catch (error) {
      spinner4.fail('Error al obtener información');
      interactive.showError(error.message);
      process.exit(1);
    }

    const prUrl = pr.buildPRUrl(repoInfo, prContent.title, prContent.description);

    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold.cyan('📋 URL del PR:'));
    console.log(chalk.blue(prUrl));
    console.log(chalk.cyan('═'.repeat(60)) + '\n');

    if (cliArgs.shouldOpenBrowser()) {
      const spinner5 = interactive.createSpinner('Abriendo en navegador...');
      spinner5.start();

      try {
        exec(`open "${prUrl}" || xdg-open "${prUrl}" || start "${prUrl}"`, (error) => {
          if (error) {
            spinner5.warn('No se pudo abrir el navegador automáticamente');
            console.log(chalk.yellow('Copia la URL anterior en tu navegador'));
          } else {
            spinner5.succeed('Navegador abierto ✓');
          }
        });
      } catch (error) {
        spinner5.warn('No se pudo abrir el navegador');
      }
    } else {
      interactive.showInfo('URL del PR copiada al portapapeles');
    }

    interactive.showSuccess('¡PR listo para crear!');
  } catch (error) {
    interactive.showError(`Error fatal: ${error.message}`);
    if (cliArgs.isDebug()) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Función principal - Modo interactivo
 */
async function interactiveMode(cliArgs) {
  try {
    interactive.showWelcomeBanner();

    const isRepo = await git.isGitRepository();
    if (!isRepo) {
      interactive.showError('No estás en un repositorio Git válido.');
      process.exit(1);
    }

    const repoInfo = await git.getRepositoryInfo();
    interactive.showRepositoryInfo(repoInfo);

    const savedConfig = await storage.getConfig();

    const mainAction = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '🎯 ¿Qué deseas hacer?',
        choices: [
          { name: '📝 Generar Commit', value: 'commit' },
          { name: '🔀 Generar PR', value: 'pr' },
          { name: '📚 Ver Historial', value: 'history' },
          { name: '📊 Ver Estadísticas', value: 'stats' },
          { name: '❌ Salir', value: 'exit' }
        ]
      }
    ]);

    if (mainAction.action === 'exit') {
      interactive.showGoodbyeBanner();
      process.exit(0);
    }

    if (mainAction.action === 'history') {
      const history = await storage.getHistory(10);
      interactive.showHistory(history);
      process.exit(0);
    }

    if (mainAction.action === 'stats') {
      const stats = await storage.getStats();
      interactive.showStats(stats);
      process.exit(0);
    }

    let running = true;
    while (running) {
      try {
        const currentConfig = await storage.getConfig();

        if (mainAction.action === 'commit') {
          await interactiveCommitFlow(cliArgs, currentConfig, storage);
        } else if (mainAction.action === 'pr') {
          await interactivePRFlow(cliArgs, currentConfig, storage);
        }

        const continueLoop = await interactive.askContinue();
        if (!continueLoop) {
          running = false;
        }
      } catch (error) {
        interactive.showError(error.message);
        running = false;
      }
    }

    interactive.showGoodbyeBanner();
  } catch (error) {
    interactive.showError(`Error fatal: ${error.message}`);
    if (cliArgs.isDebug()) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Flujo interactivo de commit
 */
async function interactiveCommitFlow(cliArgs, savedConfig, storage) {
  const summary = await git.getStagedSummary();
  const style = await interactive.selectStyle(savedConfig.defaultStyle);
  const { provider, model } = await resolveInteractiveProviderAndModel(cliArgs, savedConfig, getInteractiveDeps());

  const spinner2 = interactive.createSpinner('Obteniendo cambios...');
  spinner2.start();

  let diff;
  try {
    diff = await git.getStagedDiff();
    spinner2.succeed('Cambios obtenidos ✓');
  } catch (error) {
    spinner2.fail('Error al obtener cambios');
    throw error;
  }

  const spinner3 = interactive.createSpinner('Generando mensaje con IA...');
  spinner3.start();

  let message;
  try {
    message = await ai.generateCommitMessage(diff, style, model, provider);
    spinner3.succeed('Mensaje generado ✓');
  } catch (error) {
    spinner3.fail('Error al generar mensaje');
    throw error;
  }

  let confirmed = false;
  while (!confirmed) {
    const action = await interactive.confirmCommit(message, summary);

    if (action === 'commit') {
      const spinner4 = interactive.createSpinner('Ejecutando commit...');
      spinner4.start();

      try {
        await git.executeCommit(message);
        spinner4.succeed('Commit ejecutado ✓');

        await storage.saveCommit(message, diff, style, model, provider);
        await storage.updateStats(style, model, provider);

        await storage.saveConfig({
          defaultStyle: style,
          defaultModel: model,
          defaultProvider: provider
        });

        interactive.showSuccess('¡Commit realizado exitosamente!');
        confirmed = true;
      } catch (error) {
        spinner4.fail('Error al ejecutar commit');
        interactive.showError(error.message);
        confirmed = true;
      }
    } else if (action === 'edit') {
      message = await interactive.editMessage(message);
    } else if (action === 'regenerate') {
      const spinner5 = interactive.createSpinner('Regenerando mensaje...');
      spinner5.start();

      try {
        message = await ai.generateCommitMessage(diff, style, model, provider);
        spinner5.succeed('Mensaje regenerado ✓');
      } catch (error) {
        spinner5.fail('Error al regenerar');
        interactive.showError(error.message);
        confirmed = true;
      }
    } else if (action === 'cancel') {
      interactive.showWarning('Commit cancelado');
      confirmed = true;
    }
  }
}

/**
 * Flujo interactivo de PR
 */
async function interactivePRFlow(cliArgs, savedConfig, storage) {
  try {
    await pr.validatePRRequirements(git);
  } catch (error) {
    throw error;
  }

  const { provider, model } = await resolveInteractiveProviderAndModel(cliArgs, savedConfig, getInteractiveDeps());

  const spinner2 = interactive.createSpinner('Obteniendo cambios...');
  spinner2.start();

  let diff;
  try {
    diff = await git.getStagedDiff();
    spinner2.succeed('Cambios obtenidos ✓');
  } catch (error) {
    spinner2.fail('Error al obtener cambios');
    throw error;
  }

  const spinner3 = interactive.createSpinner('Generando contenido de PR con IA...');
  spinner3.start();

  let prContent;
  try {
    prContent = await pr.generatePRContent(diff, null, model, provider);
    spinner3.succeed('Contenido de PR generado ✓');
  } catch (error) {
    spinner3.fail('Error al generar contenido de PR');
    throw error;
  }

  console.log(pr.formatPRContent(prContent));

  await storage.saveConfig({
    defaultModel: model,
    defaultProvider: provider
  });

  const editPR = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'edit',
      message: '¿Deseas editar el contenido del PR?',
      default: false
    }
  ]);

  if (editPR.edit) {
    const editedTitle = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Título del PR:',
        default: prContent.title
      }
    ]);

    const editedDescription = await inquirer.prompt([
      {
        type: 'editor',
        name: 'description',
        message: 'Descripción del PR:',
        default: prContent.description
      }
    ]);

    prContent.title = editedTitle.title;
    prContent.description = editedDescription.description;
  }

  const spinner4 = interactive.createSpinner('Obteniendo información del repositorio...');
  spinner4.start();

  let repoInfo;
  try {
    repoInfo = await pr.getRepositoryInfo(git);
    spinner4.succeed('Información obtenida ✓');
  } catch (error) {
    spinner4.fail('Error al obtener información');
    throw error;
  }

  const prUrl = pr.buildPRUrl(repoInfo, prContent.title, prContent.description);

  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('📋 URL del PR:'));
  console.log(chalk.blue(prUrl));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  const openBrowser = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'open',
      message: '¿Deseas abrir el PR en el navegador?',
      default: true
    }
  ]);

  if (openBrowser.open) {
    try {
      exec(`open "${prUrl}" || xdg-open "${prUrl}" || start "${prUrl}"`);
      interactive.showSuccess('Navegador abierto ✓');
    } catch (error) {
      interactive.showWarning('No se pudo abrir el navegador automáticamente');
      console.log(chalk.yellow('Copia la URL anterior en tu navegador'));
    }
  }

  interactive.showSuccess('¡PR listo para crear!');
}

async function showHistoryMode() {
  try {
    const history = await storage.getHistory(20);
    interactive.showHistory(history);
  } catch (error) {
    interactive.showError(error.message);
    process.exit(1);
  }
}

async function showStatsMode() {
  try {
    const stats = await storage.getStats();
    interactive.showStats(stats);
  } catch (error) {
    interactive.showError(error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    const cliArgs = new CLIArgs();

    if (cliArgs.isDebug()) {
      process.env.DEBUG = '1';
    }

    if (cliArgs.showHelp()) {
      showHelpMessage();
      process.exit(0);
    }

    if (cliArgs.showVersion()) {
      showVersion();
      process.exit(0);
    }

    if (cliArgs.showHistory()) {
      await showHistoryMode();
      process.exit(0);
    }

    if (cliArgs.showStats()) {
      await showStatsMode();
      process.exit(0);
    }

    if (cliArgs.isInteractive()) {
      await interactiveMode(cliArgs);
    } else if (cliArgs.isPR()) {
      await nonInteractivePRMode(cliArgs);
    } else {
      await nonInteractiveCommitMode(cliArgs);
    }
  } catch (error) {
    interactive.showError(`Error no capturado: ${error.message}`);
    process.exit(1);
  }
}

main().catch(error => {
  interactive.showError(`Error fatal: ${error.message}`);
  process.exit(1);
}).finally(() => {
  setTimeout(() => {
    process.exit(0);
  }, 500);
});