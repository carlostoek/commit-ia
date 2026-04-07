/**
 * Módulo para parsear argumentos de línea de comandos
 */

export class CLIArgs {
  constructor() {
    this.args = process.argv.slice(2);
    this.flags = {};
    this.parseArgs();
  }

  /**
   * Parsea los argumentos y flags
   */
  parseArgs() {
    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];

      // Flags booleanos
      if (arg === '--interactive' || arg === '-i') {
        this.flags.interactive = true;
      } else if (arg === '--help' || arg === '-h') {
        this.flags.help = true;
      } else if (arg === '--version' || arg === '-v') {
        this.flags.version = true;
      } else if (arg === '--history') {
        this.flags.history = true;
      } else if (arg === '--stats') {
        this.flags.stats = true;
      } else if (arg === '--style' || arg === '-s') {
        // Flags con valor
        if (i + 1 < this.args.length) {
          this.flags.style = this.args[i + 1];
          i++;
        }
      } else if (arg === '--model' || arg === '-m') {
        if (i + 1 < this.args.length) {
          this.flags.model = this.args[i + 1];
          i++;
        }
      } else if (arg === '--message' || arg === '-msg') {
        if (i + 1 < this.args.length) {
          this.flags.message = this.args[i + 1];
          i++;
        }
      } else if (arg === '--auto-commit' || arg === '-a') {
        this.flags.autoCommit = true;
      } else if (arg === '--no-confirm') {
        this.flags.noConfirm = true;
      } else if (arg === '--debug') {
        this.flags.debug = true;
      } else if (arg === '--pr') {
        this.flags.pr = true;
      } else if (arg === '--no-browser') {
        this.flags.noBrowser = true;
      }
    }
  }

  /**
   * Obtiene si está en modo interactivo
   */
  isInteractive() {
    return this.flags.interactive === true;
  }

  /**
   * Obtiene si debe mostrar ayuda
   */
  showHelp() {
    return this.flags.help === true;
  }

  /**
   * Obtiene si debe mostrar versión
   */
  showVersion() {
    return this.flags.version === true;
  }

  /**
   * Obtiene si debe mostrar historial
   */
  showHistory() {
    return this.flags.history === true;
  }

  /**
   * Obtiene si debe mostrar estadísticas
   */
  showStats() {
    return this.flags.stats === true;
  }

  /**
   * Obtiene el estilo especificado
   */
  getStyle() {
    return this.flags.style || null;
  }

  /**
   * Obtiene el modelo especificado
   */
  getModel() {
    return this.flags.model || null;
  }

  /**
   * Obtiene el mensaje personalizado
   */
  getMessage() {
    return this.flags.message || null;
  }

  /**
   * Obtiene si debe hacer auto-commit
   */
  isAutoCommit() {
    return this.flags.autoCommit === true;
  }

  /**
   * Obtiene si debe confirmar antes de commit
   */
  needsConfirm() {
    return this.flags.noConfirm !== true;
  }

  /**
   * Obtiene si está en modo debug
   */
  isDebug() {
    return this.flags.debug === true;
  }

  /**
   * Obtiene si debe generar PR
   */
  isPR() {
    return this.flags.pr === true;
  }

  /**
   * Obtiene si debe abrir en navegador
   */
  shouldOpenBrowser() {
    return this.flags.noBrowser !== true;
  }

  /**
   * Obtiene todos los flags
   */
  getAll() {
    return this.flags;
  }
}

/**
 * Muestra el mensaje de ayuda
 */
export function showHelpMessage() {
  const help = `
╔════════════════════════════════════════════════════════════╗
║                    Commit AI CLI - Ayuda                  ║
╚════════════════════════════════════════════════════════════╝

USO:
  commit-ai [opciones]

MODOS:
  (sin flags)              Modo no interactivo (por defecto)
                           Usa configuración guardada
  
  -i, --interactive        Modo interactivo
                           Muestra menús para seleccionar opciones

OPCIONES:
  -s, --style <estilo>     Especificar estilo de commit
                           Valores: conventional, emoji, descriptive
  
  -m, --model <modelo>     Especificar modelo de IA
                           Ej: gpt-5.4-nano, claude-3.5-sonnet
  
  -msg, --message <msg>    Usar mensaje personalizado
                           (no genera con IA, usa el mensaje directo)
  
  -a, --auto-commit        Ejecutar commit automáticamente
                           (sin confirmación)
  
  --pr                     Generar PR en lugar de commit
  
  --no-browser             No abrir el navegador para el PR
  
  --no-confirm             No pedir confirmación antes de commit
  
  --history                Mostrar historial de commits generados
  
  --stats                  Mostrar estadísticas de uso
  
  -h, --help               Mostrar este mensaje de ayuda
  
  -v, --version            Mostrar versión
  
  --debug                  Modo debug (más información)

EJEMPLOS:

  # Modo no interactivo (por defecto)
  commit-ai

  # Modo interactivo
  commit-ai -i

  # Especificar estilo y ejecutar
  commit-ai -s emoji -a

  # Usar modelo específico
  commit-ai -m gpt-5.4 -a

  # Usar mensaje personalizado
  commit-ai -msg "feat: add new feature" -a

  # Generar PR automáticamente
  commit-ai --pr

  # Generar PR sin abrir navegador
  commit-ai --pr --no-browser

  # Ver historial
  commit-ai --history

  # Ver estadísticas
  commit-ai --stats

  # Combinar opciones
  commit-ai -s conventional -m claude-3.5-sonnet --no-confirm

CONFIGURACIÓN:

  La configuración se guarda automáticamente cuando usas modo interactivo.
  Las opciones guardadas se usan como defaults en modo no interactivo.

  Archivo de configuración: ~/.puter/commit-ai-config.json (en la nube)

MODO NO INTERACTIVO (por defecto):
  
  1. Lee la configuración guardada
  2. Obtiene cambios staged
  3. Genera commit con IA
  4. Ejecuta: git commit -m "mensaje"
  5. Guarda en historial

MODO INTERACTIVO (-i):
  
  1. Muestra menú para seleccionar estilo
  2. Pregunta si cambiar modelo
  3. Genera commit con IA
  4. Muestra opciones: ejecutar, editar, regenerar, cancelar
  5. Guarda configuración y historial

PARA MÁS INFORMACIÓN:
  
  Consulta README.md o QUICKSTART.md en el directorio del proyecto.

═══════════════════════════════════════════════════════════════
`;
  console.log(help);
}

/**
 * Muestra la versión
 */
export function showVersion() {
  const version = '1.0.0';
  console.log(`Commit AI CLI v${version}`);
  console.log('Generador de commits inteligentes con IA');
}
