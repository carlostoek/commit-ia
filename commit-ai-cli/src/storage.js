import { CONFIG } from './config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Archivo local para persistencia de historial, stats y config
// (reemplaza el uso anterior de puter.kv para no depender de autenticación Puter)
const STORE_FILE = path.join(os.homedir(), '.commit-ai-store.json');

let storeCache = null;

function loadStore() {
  if (storeCache) return storeCache;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      storeCache = JSON.parse(raw);
    } else {
      storeCache = { history: [], stats: {}, config: {} };
    }
  } catch (e) {
    storeCache = { history: [], stats: {}, config: {} };
  }
  // Asegurar estructura
  if (!storeCache.history) storeCache.history = [];
  if (!storeCache.stats) storeCache.stats = {};
  if (!storeCache.config) storeCache.config = {};
  return storeCache;
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(storeCache, null, 2), { mode: 0o600 });
  } catch (error) {
    console.warn('No se pudo guardar el store local:', error.message);
  }
}

/**
 * Inicializa el módulo de almacenamiento (compatibilidad; ahora usa FS local)
 */
export function initStorage(puterInstance) {
  // noop - storage ahora es local por defecto
  // si se quiere resetear cache: storeCache = null;
}

/**
 * Guarda un commit en el historial
 */
export async function saveCommit(message, diff, style, model) {
  try {
    const s = loadStore();
    let history = s.history || [];

    // Crear entrada
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message: message,
      diff: (diff || '').substring(0, 500),
      style: style,
      model: model
    };

    // Agregar al inicio
    history.unshift(entry);

    // Limitar tamaño
    if (history.length > CONFIG.MAX_HISTORY_SIZE) {
      history = history.slice(0, CONFIG.MAX_HISTORY_SIZE);
    }

    s.history = history;
    saveStore();

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
    const s = loadStore();
    const history = s.history || [];
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
    const s = loadStore();
    const history = s.history || [];
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
    const s = loadStore();
    s.history = [];
    saveStore();
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
    const s = loadStore();
    return s.stats || {
      totalCommits: 0,
      byStyle: {},
      byModel: {},
      lastUsed: null
    };
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
    const s = loadStore();
    let stats = s.stats || {};

    stats.totalCommits = (stats.totalCommits || 0) + 1;
    stats.byStyle = stats.byStyle || {};
    stats.byStyle[style] = (stats.byStyle[style] || 0) + 1;
    stats.byModel = stats.byModel || {};
    stats.byModel[model] = (stats.byModel[model] || 0) + 1;
    stats.lastUsed = new Date().toISOString();

    s.stats = stats;
    saveStore();

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
    const s = loadStore();
    const cfg = s.config || {};
    return {
      defaultStyle: cfg.defaultStyle || CONFIG.DEFAULT_STYLE,
      defaultModel: cfg.defaultModel || CONFIG.DEFAULT_MODEL
    };
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
    const s = loadStore();
    s.config = { ...(s.config || {}), ...config };
    saveStore();
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
    const s = loadStore();
    let history = s.history || [];
    history = history.filter(entry => entry.id !== id);
    s.history = history;
    saveStore();
    return true;
  } catch (error) {
    return false;
  }
}
