import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { COMMIT_STYLES, MODELS } from './config.js';

/**
 * Selecciona un estilo de commit
 */
export async function selectStyle(defaultStyle = 'conventional') {
  const choices = Object.entries(COMMIT_STYLES).map(([key, config]) => ({
    name: `${config.name} - ${config.description}`,
    value: key
  }));
  
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'style',
      message: '📝 Selecciona el estilo de commit:',
      choices: choices,
      default: defaultStyle
    }
  ]);
  
  return answer.style;
}

/**
 * Selecciona un modelo de IA
 */
export async function selectModel(defaultModel = 'openrouter/free') {
  const allModels = [
    new inquirer.Separator(chalk.green('🆓 MODELOS GRATUITOS (Recomendados)')),
    ...MODELS.free,
    new inquirer.Separator('─────────────────'),
    new inquirer.Separator(chalk.yellow('💰 Modelos de Pago')),
    ...MODELS.fast,
    new inquirer.Separator('─────────────────'),
    ...MODELS.balanced,
    new inquirer.Separator('─────────────────'),
    ...MODELS.powerful
  ];
  
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'model',
      message: '🤖 Selecciona el modelo de IA:',
      choices: allModels,
      default: defaultModel
    }
  ]);
  
  return answer.model;
}

/**
 * Edita un mensaje de commit
 */
export async function editMessage(currentMessage) {
  const answer = await inquirer.prompt([
    {
      type: 'editor',
      name: 'message',
      message: '✏️  Edita el mensaje de commit:',
      default: currentMessage,
      postfix: '.md'
    }
  ]);
  
  return answer.message.trim();
}

/**
 * Confirma antes de ejecutar commit
 */
export async function confirmCommit(message, summary) {
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('📋 Resumen del Commit'));
  console.log(chalk.cyan('═'.repeat(60)));
  
  if (summary) {
    console.log(chalk.gray(`Archivos: ${summary.files}`));
    if (summary.staged && summary.staged.length > 0) {
      console.log(chalk.gray(`Cambios: ${summary.staged.join(', ')}`));
    }
  }
  
  console.log('\n' + chalk.bold('Mensaje de commit:'));
  console.log(chalk.green(message));
  console.log('\n' + chalk.cyan('═'.repeat(60)) + '\n');
  
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '¿Qué deseas hacer?',
      choices: [
        { name: '✅ Ejecutar commit', value: 'commit' },
        { name: '✏️  Editar mensaje', value: 'edit' },
        { name: '🔄 Regenerar mensaje', value: 'regenerate' },
        { name: '❌ Cancelar', value: 'cancel' }
      ]
    }
  ]);
  
  return answer.action;
}

/**
 * Muestra el historial de commits
 */
export async function showHistory(history) {
  if (history.length === 0) {
    console.log(chalk.yellow('📭 No hay historial de commits generados'));
    return;
  }
  
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('📚 Historial de Commits'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
  
  history.forEach((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleString();
    console.log(chalk.bold(`${index + 1}. ${entry.message}`));
    console.log(chalk.gray(`   Estilo: ${entry.style} | Modelo: ${entry.model}`));
    console.log(chalk.gray(`   Fecha: ${date}\n`));
  });
  
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
}

/**
 * Muestra estadísticas de uso
 */
export async function showStats(stats) {
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('📊 Estadísticas de Uso'));
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
  
  console.log(chalk.bold(`Total de commits generados: ${stats.totalCommits || 0}`));
  
  if (stats.byStyle && Object.keys(stats.byStyle).length > 0) {
    console.log(chalk.bold('\nPor estilo:'));
    Object.entries(stats.byStyle).forEach(([style, count]) => {
      console.log(chalk.gray(`  • ${style}: ${count}`));
    });
  }
  
  if (stats.byModel && Object.keys(stats.byModel).length > 0) {
    console.log(chalk.bold('\nPor modelo:'));
    Object.entries(stats.byModel).forEach(([model, count]) => {
      console.log(chalk.gray(`  • ${model}: ${count}`));
    });
  }
  
  if (stats.lastUsed) {
    const lastDate = new Date(stats.lastUsed).toLocaleString();
    console.log(chalk.gray(`\nÚltimo uso: ${lastDate}`));
  }
  
  console.log('\n' + chalk.cyan('═'.repeat(60)) + '\n');
}

/**
 * Muestra un spinner de carga
 */
export function createSpinner(text) {
  return ora({
    text: chalk.blue(text),
    spinner: 'dots'
  });
}

/**
 * Muestra un mensaje de éxito
 */
export function showSuccess(message) {
  console.log(chalk.green(`✅ ${message}`));
}

/**
 * Muestra un mensaje de error
 */
export function showError(message) {
  console.log(chalk.red(`❌ ${message}`));
}

/**
 * Muestra un mensaje de advertencia
 */
export function showWarning(message) {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

/**
 * Muestra un mensaje de información
 */
export function showInfo(message) {
  console.log(chalk.blue(`ℹ️  ${message}`));
}

/**
 * Pregunta si desea ver el historial
 */
export async function askViewHistory() {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'view',
      message: '¿Deseas ver el historial de commits?',
      default: false
    }
  ]);
  
  return answer.view;
}

/**
 * Pregunta si desea ver estadísticas
 */
export async function askViewStats() {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'view',
      message: '¿Deseas ver las estadísticas de uso?',
      default: false
    }
  ]);
  
  return answer.view;
}

/**
 * Menú principal
 */
export async function mainMenu() {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '🎯 ¿Qué deseas hacer?',
      choices: [
        { name: '🚀 Generar nuevo commit', value: 'new' },
        { name: '📚 Ver historial', value: 'history' },
        { name: '📊 Ver estadísticas', value: 'stats' },
        { name: '❌ Salir', value: 'exit' }
      ]
    }
  ]);
  
  return answer.action;
}

/**
 * Pregunta si desea continuar
 */
export async function askContinue() {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: '¿Deseas generar otro commit?',
      default: true
    }
  ]);
  
  return answer.continue;
}

/**
 * Muestra información del repositorio
 */
export function showRepositoryInfo(info) {
  console.log('\n' + chalk.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan('📦 Información del Repositorio'));
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.gray(`Rama: ${info.branch}`));
  if (info.remotes && info.remotes.length > 0) {
    console.log(chalk.gray(`Remoto: ${info.remotes[0].refs.fetch}`));
  }
  console.log(chalk.cyan('═'.repeat(60)) + '\n');
}

/**
 * Muestra un banner de bienvenida
 */
export function showWelcomeBanner() {
  console.clear();
  console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🤖 Commit AI CLI - Generador de Commits IA         ║
║                                                            ║
║  Genera automáticamente mensajes de commit usando IA      ║
║  Potenciado por OpenRouter (Modelos Gratuitos)            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `));
}

/**
 * Muestra un banner de despedida
 */
export function showGoodbyeBanner() {
  console.log(chalk.cyan(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ¡Gracias por usar Commit AI CLI! 👋                      ║
║                                                            ║
║  Tus commits fueron generados exitosamente.               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `));
}
