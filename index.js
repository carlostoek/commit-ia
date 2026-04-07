#!/usr/bin/env node

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

/**
 * Función principal - Modo no interactivo COMMIT (por defecto)
 */
async function nonInteractiveCommitMode(cliArgs) {
  try {
    // Verificar si es un repositorio Git
    const isRepo = await git.isGitRepository();
    if (!isRepo) {
      interactive.showError('No estás en un repositorio Git válido.');
      process.exit(1);
    }

    // Inicializar Puter
    const spinner = interactive.createSpinner('Conectando con Puter...');
    spinner.start();

    try {
      const puter = await ai.initPuter();
      storage.initStorage(puter);
      spinner.succeed('Conectado con Puter ✓');
    } catch (error) {
      spinner.fail('Error al conectar con Puter');
      interactive.showError(error.message);
      process.exit(1);
    }

    // Obtener configuración guardada
    const savedConfig = await storage.getConfig();

    // Determinar estilo y modelo a usar
    const style = cliArgs.getStyle() || savedConfig.defaultStyle || CONFIG.DEFAULT_STYLE;
    const model = cliArgs.getModel() || savedConfig.defaultModel || CONFIG.DEFAULT_MODEL;

    // Validar estilo
    if (!COMMIT_STYLES[style]) {
      interactive.showError(`Estilo de commit no válido: ${style}`);
      process.exit(1);
    }

    // Obtener diff
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

    // Generar mensaje
    const spinner3 = interactive.createSpinner('Generando mensaje con IA...');
    spinner3.start();

    let message;
    try {
      message = await ai.generateCommitMessage(diff, style, model);
      spinner3.succeed('Mensaje generado ✓');
    } catch (error) {
      spinner3.fail('Error al generar mensaje');
      interactive.showError(error.message);
      process.exit(1);
    }

    // Mostrar mensaje
    console.log('\n' + chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold('Mensaje de commit:'));
    if (typeof message === 'object' && message.fullMessage) {
      console.log(chalk.green(message.title));
      if (message.body) {
        console.log(chalk.gray('---'));
        console.log(chalk.green(message.body));
      }
    } else {
      console.log(chalk.green(message));
    }
    console.log(chalk.cyan('═'.repeat(60)) + '\n');

    // Ejecutar commit
    const spinner4 = interactive.createSpinner('Ejecutando commit...');
    spinner4.start();

    try {
      await git.executeCommit(message);
      spinner4.succeed('Commit ejecutado ✓');

      // Guardar en historial y actualizar estadísticas
      await storage.saveCommit(message, diff, style, model);
      await storage.updateStats(style, model);

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
    // Verificar si es un repositorio Git
    const isRepo = await git.isGitRepository();
    if (!isRepo) {
      interactive.showError('No estás en un repositorio Git válido.');
      process.exit(1);
    }

    // Validar requisitos de PR
    try {
      await pr.validatePRRequirements(git);
    } catch (error) {
      interactive.showError(error.message);
      process.exit(1);
    }

    // Inicializar Puter
    const spinner = interactive.createSpinner('Conectando con Puter...');
    spinner.start();

    let puter;
    try {
      puter = await ai.initPuter();
      storage.initStorage(puter);
      spinner.succeed('Conectado con Puter ✓');
    } catch (error) {
      spinner.fail('Error al conectar con Puter');
      interactive.showError(error.message);
      process.exit(1);
    }

    // Obtener configuración guardada
    const savedConfig = await storage.getConfig();
    const model = cliArgs.getModel() || savedConfig.defaultModel || CONFIG.DEFAULT_MODEL;

    // Obtener diff
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

    // Generar contenido de PR
    const spinner3 = interactive.createSpinner('Generando contenido de PR con IA...');
    spinner3.start();

    let prContent;
    try {
      prContent = await pr.generatePRContent(diff, puter, model);
      spinner3.succeed('Contenido de PR generado ✓');
    } catch (error) {
      spinner3.fail('Error al generar contenido de PR');
      interactive.showError(error.message);
      process.exit(1);
    }

    // Mostrar contenido
    console.log(pr.formatPRContent(prContent));

    // Obtener información del repositorio
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

    // Construir URL del PR
    const prUrl = pr.buildPRUrl(repoInfo, prContent.title, prContent.description);

    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.bold.cyan('📋 URL del PR:'));
    console.log(chalk.blue(prUrl));
    console.log(chalk.cyan('═'.repeat(60)) + '\n');

    // Abrir en navegador si es posible
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
    // Mostrar banner
    interactive.showWelcomeBanner();

    // Verificar si es un repositorio Git
    const isRepo = await git.isGitRepository();
    if (!isRepo) {
      interactive.showError('No estás en un repositorio Git válido.');
      process.exit(1);
    }

    // Obtener información del repositorio
    const repoInfo = await git.getRepositoryInfo();
    interactive.showRepositoryInfo(repoInfo);

    // Inicializar Puter
    const spinner = interactive.createSpinner('Conectando con Puter...');
    spinner.start();

    try {
      const puter = await ai.initPuter();
      storage.initStorage(puter);
      spinner.succeed('Conectado con Puter ✓');
    } catch (error) {
      spinner.fail('Error al conectar con Puter');
      interactive.showError(error.message);
      process.exit(1);
    }

    // Obtener configuración guardada
    const savedConfig = await storage.getConfig();

    // Menú principal: Commit o PR
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

    // Loop principal para commits o PRs
    let running = true;
    while (running) {
      try {
        if (mainAction.action === 'commit') {
          // Flujo de commit interactivo
          await interactiveCommitFlow(savedConfig, storage);
        } else if (mainAction.action === 'pr') {
          // Flujo de PR interactivo
          await interactivePRFlow(savedConfig, storage);
        }

        // Preguntar si continuar
        const continueLoop = await interactive.askContinue();
        if (!continueLoop) {
          running = false;
        }
      } catch (error) {
        interactive.showError(error.message);
        running = false;
      }
    }

    // Banner de despedida
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
async function interactiveCommitFlow(savedConfig, storage) {
  // Verificar si hay cambios staged
  const summary = await git.getStagedSummary();

  // Seleccionar estilo
  const style = await interactive.selectStyle(savedConfig.defaultStyle);

  // Preguntar si cambiar modelo
  const changeModel = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'change',
      message: '¿Deseas seleccionar un modelo diferente?',
      default: false
    }
  ]);

  let model = savedConfig.defaultModel;
  if (changeModel.change) {
    model = await interactive.selectModel(savedConfig.defaultModel);
  }

  // Obtener diff
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

  // Generar mensaje
  const spinner3 = interactive.createSpinner('Generando mensaje con IA...');
  spinner3.start();

  let message;
  try {
    message = await ai.generateCommitMessage(diff, style, model);
    spinner3.succeed('Mensaje generado ✓');
  } catch (error) {
    spinner3.fail('Error al generar mensaje');
    throw error;
  }

  // Loop de confirmación
  let confirmed = false;
  while (!confirmed) {
    const action = await interactive.confirmCommit(message, summary);

    if (action === 'commit') {
      // Ejecutar commit
      const spinner4 = interactive.createSpinner('Ejecutando commit...');
      spinner4.start();

      try {
        await git.executeCommit(message);
        spinner4.succeed('Commit ejecutado ✓');

        // Guardar en historial y actualizar estadísticas
        await storage.saveCommit(message, diff, style, model);
        await storage.updateStats(style, model);

        // Guardar configuración
        await storage.saveConfig({
          defaultStyle: style,
          defaultModel: model
        });

        interactive.showSuccess('¡Commit realizado exitosamente!');
        confirmed = true;
      } catch (error) {
        spinner4.fail('Error al ejecutar commit');
        interactive.showError(error.message);
        confirmed = true;
      }
    } else if (action === 'edit') {
      // Editar mensaje
      message = await interactive.editMessage(message);
    } else if (action === 'regenerate') {
      // Regenerar
      const spinner5 = interactive.createSpinner('Regenerando mensaje...');
      spinner5.start();

      try {
        message = await ai.generateCommitMessage(diff, style, model);
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
async function interactivePRFlow(savedConfig, storage) {
  // Validar requisitos de PR
  try {
    await pr.validatePRRequirements(git);
  } catch (error) {
    throw error;
  }

  // Obtener puter
  const puter = await ai.initPuter();

  // Seleccionar modelo
  const changeModel = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'change',
      message: '¿Deseas seleccionar un modelo diferente?',
      default: false
    }
  ]);

  let model = savedConfig.defaultModel;
  if (changeModel.change) {
    model = await interactive.selectModel(savedConfig.defaultModel);
  }

  // Obtener diff
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

  // Generar contenido de PR
  const spinner3 = interactive.createSpinner('Generando contenido de PR con IA...');
  spinner3.start();

  let prContent;
  try {
    prContent = await pr.generatePRContent(diff, puter, model);
    spinner3.succeed('Contenido de PR generado ✓');
  } catch (error) {
    spinner3.fail('Error al generar contenido de PR');
    throw error;
  }

  // Mostrar contenido
  console.log(pr.formatPRContent(prContent));

  // Preguntar si editar
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

  // Obtener información del repositorio
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

  // Construir URL del PR
  const prUrl = pr.buildPRUrl(repoInfo, prContent.title, prContent.description);

  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('📋 URL del PR:'));
  console.log(chalk.blue(prUrl));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');

  // Preguntar si abrir en navegador
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

/**
 * Función para mostrar historial
 */
async function showHistoryMode() {
  try {
    const puter = await ai.initPuter();
    storage.initStorage(puter);

    const history = await storage.getHistory(20);
    interactive.showHistory(history);
  } catch (error) {
    interactive.showError(error.message);
    process.exit(1);
  }
}

/**
 * Función para mostrar estadísticas
 */
async function showStatsMode() {
  try {
    const puter = await ai.initPuter();
    storage.initStorage(puter);

    const stats = await storage.getStats();
    interactive.showStats(stats);
  } catch (error) {
    interactive.showError(error.message);
    process.exit(1);
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    // Parsear argumentos
    const cliArgs = new CLIArgs();

    // Manejo de flags especiales
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

    // Determinar modo
    if (cliArgs.isInteractive()) {
      // Modo interactivo
      await interactiveMode(cliArgs);
    } else if (cliArgs.isPR()) {
      // Modo no interactivo PR
      await nonInteractivePRMode(cliArgs);
    } else {
      // Modo no interactivo COMMIT (por defecto)
      await nonInteractiveCommitMode(cliArgs);
    }
  } catch (error) {
    interactive.showError(`Error no capturado: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar
main().catch(error => {
  interactive.showError(`Error fatal: ${error.message}`);
  process.exit(1);
}).finally(() => {
  // Forzar cierre de todos los procesos después de 500ms
  setTimeout(() => {
    process.exit(0);
  }, 500);
});
