import { simpleGit } from 'simple-git';

const git = simpleGit();

/**
 * Obtiene el estado actual del repositorio Git
 */
export async function getGitStatus() {
  try {
    const status = await git.status();
    return status;
  } catch (error) {
    throw new Error(`Error al obtener estado de Git: ${error.message}`);
  }
}

/**
 * Obtiene el diff de los cambios staged
 */
export async function getStagedDiff() {
  try {
    const diff = await git.diff(['--staged']);
    if (!diff || diff.trim().length === 0) {
      throw new Error('No hay cambios staged. Usa "git add" primero.');
    }
    return diff;
  } catch (error) {
    throw new Error(`Error al obtener diff staged: ${error.message}`);
  }
}

/**
 * Obtiene un resumen de los cambios staged
 */
export async function getStagedSummary() {
  try {
    const status = await getGitStatus();
    
    if (!status.staged || status.staged.length === 0) {
      throw new Error('No hay cambios staged.');
    }
    
    const summary = {
      files: status.staged.length,
      staged: status.staged,
      modified: status.modified || [],
      created: status.created || [],
      deleted: status.deleted || [],
      renamed: status.renamed || []
    };
    
    return summary;
  } catch (error) {
    throw new Error(`Error al obtener resumen: ${error.message}`);
  }
}

/**
 * Ejecuta un commit con el mensaje proporcionado
 */
export async function executeCommit(message) {
  try {
    // Validar que el mensaje no esté vacío
    let commitMessage = '';
    
    // Si es un objeto con título y cuerpo
    if (typeof message === 'object' && message.fullMessage) {
      commitMessage = message.fullMessage;
    } else if (typeof message === 'string') {
      commitMessage = message;
    } else {
      throw new Error('El mensaje de commit debe ser una cadena o un objeto con fullMessage.');
    }
    
    if (!commitMessage || commitMessage.trim().length === 0) {
      throw new Error('El mensaje de commit no puede estar vacío.');
    }
    
    // Ejecutar el commit
    const result = await git.commit(commitMessage);
    return result;
  } catch (error) {
    throw new Error(`Error al ejecutar commit: ${error.message}`);
  }
}

/**
 * Obtiene los últimos N commits
 */
export async function getLastCommits(count = 5) {
  try {
    const log = await git.log([`-${count}`]);
    return log.all;
  } catch (error) {
    throw new Error(`Error al obtener commits: ${error.message}`);
  }
}

/**
 * Verifica si hay un repositorio Git inicializado
 */
export async function isGitRepository() {
  try {
    await git.status();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene información del repositorio
 */
export async function getRepositoryInfo() {
  try {
    const remotes = await git.getRemotes(true);
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    
    return {
      branch: branch.trim(),
      remotes: remotes
    };
  } catch (error) {
    return {
      branch: 'unknown',
      remotes: []
    };
  }
}

/**
 * Obtiene estadísticas del repositorio
 */
export async function getRepositoryStats() {
  try {
    const log = await git.log(['-1']);
    const status = await getGitStatus();
    
    return {
      totalFiles: status.files ? status.files.length : 0,
      staged: status.staged ? status.staged.length : 0,
      modified: status.modified ? status.modified.length : 0,
      untracked: status.untracked ? status.untracked.length : 0,
      lastCommit: log.latest ? log.latest.hash.substring(0, 7) : 'N/A'
    };
  } catch (error) {
    return null;
  }
}
