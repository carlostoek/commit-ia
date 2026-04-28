import { CONFIG } from './config.js';

let puter = null;

/**
 * Inicializa el módulo de almacenamiento
 */
export function initStorage(puterInstance) {
  puter = puterInstance;
}

/**
 * Guarda un commit en el historial
 */
export async function saveCommit(message, diff, style, model) {
  try {
    if (!puter) {
      return null;
    }

    // Obtener historial actual
    let history = [];
    try {
      const stored = await puter.kv.get(CONFIG.STORAGE_KEYS.HISTORY);
      if (stored) {
        history = JSON.parse(stored);
      }
    } catch (e) {
      // Si no existe, crear nuevo
      history = [];
    }

    // Crear entrada
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message: message,
      diff: diff.substring(0, 500), // Guardar solo primeros 500 chars del diff
      style: style,
      model: model
    };

    // Agregar al inicio
    history.unshift(entry);

    // Limitar tamaño
    if (history.length > CONFIG.MAX_HISTORY_SIZE) {
      history = history.slice(0, CONFIG.MAX_HISTORY_SIZE);
    }

    // Guardar
    await puter.kv.set(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));

    return entry;
  } catch (error) {
    // Silenciar error - storage no es crítico
    return null;
  }
}

/**
 * Obtiene el historial de commits
 */
export async function getHistory(limit = 10) {
  try {
    if (!puter) {
      return [];
    }

    const stored = await puter.kv.get(CONFIG.STORAGE_KEYS.HISTORY);
    if (!stored) {
      return [];
    }

    const history = JSON.parse(stored);
    return history.slice(0, limit);
  } catch (error) {
    return [];
  }
}

/**
 * Obtiene un commit específico del historial
 */
export async function getCommit(id) {
  try {
    if (!puter) {
      return null;
    }

    const stored = await puter.kv.get(CONFIG.STORAGE_KEYS.HISTORY);
    if (!stored) {
      return null;
    }

    const history = JSON.parse(stored);
    return history.find(entry => entry.id === id) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Limpia el historial
 */
export async function clearHistory() {
  try {
    if (!puter) {
      return false;
    }

    await puter.kv.set(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify([]));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene estadísticas de uso
 */
export async function getStats() {
  try {
    if (!puter) {
      return {
        totalCommits: 0,
        byStyle: {},
        byModel: {},
        lastUsed: null
      };
    }

    let stats = {
      totalCommits: 0,
      byStyle: {},
      byModel: {},
      lastUsed: null
    };

    try {
      const stored = await puter.kv.get(CONFIG.STORAGE_KEYS.STATS);
      if (stored) {
        stats = JSON.parse(stored);
      }
    } catch (e) {
      // Si no existe, usar valores por defecto
    }

    return stats;
  } catch (error) {
    return {
      totalCommits: 0,
      byStyle: {},
      byModel: {},
      lastUsed: null
    };
  }
}

/**
 * Actualiza estadísticas
 */
export async function updateStats(style, model) {
  try {
    if (!puter) {
      return null;
    }

    const stats = await getStats();

    stats.totalCommits = (stats.totalCommits || 0) + 1;
    stats.byStyle = stats.byStyle || {};
    stats.byStyle[style] = (stats.byStyle[style] || 0) + 1;
    stats.byModel = stats.byModel || {};
    stats.byModel[model] = (stats.byModel[model] || 0) + 1;
    stats.lastUsed = new Date().toISOString();

    await puter.kv.set(CONFIG.STORAGE_KEYS.STATS, JSON.stringify(stats));

    return stats;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene configuración guardada
 */
export async function getConfig() {
  try {
    if (!puter) {
      return {
        defaultStyle: CONFIG.DEFAULT_STYLE,
        defaultModel: CONFIG.DEFAULT_MODEL
      };
    }

    const stored = await puter.kv.get(CONFIG.STORAGE_KEYS.CONFIG);
    if (!stored) {
      return {
        defaultStyle: CONFIG.DEFAULT_STYLE,
        defaultModel: CONFIG.DEFAULT_MODEL
      };
    }

    return JSON.parse(stored);
  } catch (error) {
    return {
      defaultStyle: CONFIG.DEFAULT_STYLE,
      defaultModel: CONFIG.DEFAULT_MODEL
    };
  }
}

/**
 * Guarda configuración
 */
export async function saveConfig(config) {
  try {
    if (!puter) {
      return false;
    }

    await puter.kv.set(CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify(config));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Elimina un commit del historial
 */
export async function deleteCommit(id) {
  try {
    if (!puter) {
      return false;
    }

    let history = [];
    try {
      const stored = await puter.kv.get(CONFIG.STORAGE_KEYS.HISTORY);
      if (stored) {
        history = JSON.parse(stored);
      }
    } catch (e) {
      return false;
    }

    history = history.filter(entry => entry.id !== id);
    await puter.kv.set(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));

    return true;
  } catch (error) {
    return false;
  }
}
