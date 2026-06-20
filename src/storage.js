import {
  CONFIG,
  isValidProvider,
  normalizeProvider,
  resolveModel,
  getDefaultModelForProvider
} from './config.js';
import { getDefaultProvider } from './provider.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Archivo local para persistencia de historial, stats y config
const DEFAULT_STORE_FILE = path.join(os.homedir(), '.commit-ai-store.json');

let storeFileOverride = null;
let storeCache = null;

function getStoreFile() {
  return storeFileOverride || DEFAULT_STORE_FILE;
}

function loadStore() {
  if (storeCache) return storeCache;
  const storeFile = getStoreFile();
  try {
    if (fs.existsSync(storeFile)) {
      const raw = fs.readFileSync(storeFile, 'utf-8');
      storeCache = JSON.parse(raw);
    } else {
      storeCache = { history: [], stats: {}, config: {} };
    }
  } catch (e) {
    storeCache = { history: [], stats: {}, config: {} };
  }
  if (!storeCache.history) storeCache.history = [];
  if (!storeCache.stats) storeCache.stats = {};
  if (!storeCache.config) storeCache.config = {};
  return storeCache;
}

function saveStore() {
  try {
    fs.writeFileSync(getStoreFile(), JSON.stringify(storeCache, null, 2), { mode: 0o600 });
  } catch (error) {
    console.warn('No se pudo guardar el store local:', error.message);
  }
}

/**
 * Permite usar un archivo de store aislado en tests
 */
export function setStoreFileForTesting(filePath) {
  storeFileOverride = filePath;
  storeCache = null;
}

/**
 * Restaura el store por defecto después de tests
 */
export function resetStoreForTesting() {
  storeFileOverride = null;
  storeCache = null;
}

/**
 * Inicializa el módulo de almacenamiento (compatibilidad; ahora usa FS local)
 */
export function initStorage(puterInstance) {
  // noop - storage ahora es local por defecto
}

/**
 * Guarda un commit en el historial
 */
export async function saveCommit(message, diff, style, model, provider = null) {
  try {
    const s = loadStore();
    let history = s.history || [];

    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message: message,
      diff: (diff || '').substring(0, 500),
      style: style,
      model: model,
      provider: provider ? normalizeProvider(provider) : null
    };

    history.unshift(entry);

    if (history.length > CONFIG.MAX_HISTORY_SIZE) {
      history = history.slice(0, CONFIG.MAX_HISTORY_SIZE);
    }

    s.history = history;
    saveStore();

    return entry;
  } catch (error) {
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
      byProvider: {},
      lastUsed: null
    };
  } catch (error) {
    return {
      totalCommits: 0,
      byStyle: {},
      byModel: {},
      byProvider: {},
      lastUsed: null
    };
  }
}

/**
 * Actualiza estadísticas
 */
export async function updateStats(style, model, provider = null) {
  try {
    const s = loadStore();
    let stats = s.stats || {};

    stats.totalCommits = (stats.totalCommits || 0) + 1;
    stats.byStyle = stats.byStyle || {};
    stats.byStyle[style] = (stats.byStyle[style] || 0) + 1;
    stats.byModel = stats.byModel || {};
    stats.byModel[model] = (stats.byModel[model] || 0) + 1;
    stats.byProvider = stats.byProvider || {};
    if (provider) {
      const normalized = normalizeProvider(provider);
      stats.byProvider[normalized] = (stats.byProvider[normalized] || 0) + 1;
    }
    stats.lastUsed = new Date().toISOString();

    s.stats = stats;
    saveStore();

    return stats;
  } catch (error) {
    return null;
  }
}

function buildNormalizedConfig(cfg = {}) {
  const savedProvider = cfg.defaultProvider || getDefaultProvider();
  const normalizedProvider = isValidProvider(savedProvider)
    ? normalizeProvider(savedProvider)
    : getDefaultProvider();

  const modelResolution = resolveModel(null, normalizedProvider, cfg.defaultModel);
  const normalizedModel = cfg.defaultModel
    ? modelResolution.model
    : getDefaultModelForProvider(normalizedProvider);

  return {
    defaultStyle: cfg.defaultStyle || CONFIG.DEFAULT_STYLE,
    defaultModel: normalizedModel,
    defaultProvider: normalizedProvider
  };
}

/**
 * Obtiene configuración guardada
 */
export async function getConfig() {
  try {
    const s = loadStore();
    const cfg = s.config || {};
    const result = buildNormalizedConfig(cfg);

    const needsPersist =
      (cfg.defaultProvider && !isValidProvider(cfg.defaultProvider)) ||
      (cfg.defaultProvider && normalizeProvider(cfg.defaultProvider) !== result.defaultProvider) ||
      (cfg.defaultModel && cfg.defaultModel !== result.defaultModel);

    if (needsPersist) {
      s.config = { ...cfg, ...result };
      saveStore();
    }

    return result;
  } catch (error) {
    return {
      defaultStyle: CONFIG.DEFAULT_STYLE,
      defaultModel: CONFIG.DEFAULT_MODEL,
      defaultProvider: getDefaultProvider()
    };
  }
}

/**
 * Guarda configuración
 */
export async function saveConfig(config) {
  try {
    const updates = { ...config };

    if (updates.defaultProvider !== undefined) {
      const normalized = normalizeProvider(updates.defaultProvider);
      if (!isValidProvider(normalized)) {
        throw new Error(`Proveedor no válido: ${updates.defaultProvider}. Valores: openrouter, deepseek`);
      }
      updates.defaultProvider = normalized;
    }

    const s = loadStore();
    const merged = { ...(s.config || {}), ...updates };
    const normalized = buildNormalizedConfig(merged);
    s.config = { ...merged, ...normalized };
    saveStore();
    return true;
  } catch (error) {
    if (error.message.includes('Proveedor no válido')) {
      throw error;
    }
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