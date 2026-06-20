import {
  CONFIG,
  COMMIT_STYLES,
  PROVIDERS,
  getDefaultModelForProvider,
  resolveModel,
  normalizeProvider,
  isValidProvider
} from './config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const providerState = {
  openrouter: { apiKey: null },
  deepseek: { apiKey: null }
};

const keyFileOverrides = {};

function getProviderConfig(provider) {
  const normalized = normalizeProvider(provider);
  if (!isValidProvider(normalized)) {
    throw new Error(`Proveedor no válido: ${provider}. Valores: openrouter, deepseek`);
  }
  return PROVIDERS[normalized];
}

export function getApiKeyFile(provider) {
  const normalized = normalizeProvider(provider);
  if (keyFileOverrides[normalized]) {
    return keyFileOverrides[normalized];
  }
  return path.join(os.homedir(), getProviderConfig(normalized).keyFile);
}

export function setApiKeyFileForTesting(provider, filePath) {
  keyFileOverrides[normalizeProvider(provider)] = filePath;
}

export function resetApiKeyFileForTesting() {
  for (const key of Object.keys(keyFileOverrides)) {
    delete keyFileOverrides[key];
  }
}

function saveApiKeyLocally(provider, key) {
  const keyFile = getApiKeyFile(provider);
  fs.writeFileSync(keyFile, key, { mode: 0o600 });
  fs.chmodSync(keyFile, 0o600);

  const mode = fs.statSync(keyFile).mode & 0o777;
  if (mode !== 0o600) {
    throw new Error(`No se pudieron establecer permisos seguros (600) en ${keyFile}`);
  }
}

function loadApiKeyLocally(provider) {
  try {
    const keyFile = getApiKeyFile(provider);
    if (!fs.existsSync(keyFile)) {
      return null;
    }

    const stats = fs.statSync(keyFile);
    const mode = stats.mode & 0o777;
    if ((mode & 0o077) !== 0) {
      throw new Error(
        `El archivo de API key ${keyFile} tiene permisos inseguros (${mode.toString(8)}).\n` +
        `Ejecuta: chmod 600 ${keyFile}`
      );
    }

    return fs.readFileSync(keyFile, 'utf-8').trim();
  } catch (error) {
    if (error.message.includes('permisos inseguros')) {
      throw error;
    }
    console.warn(`No se pudo cargar la API key de ${provider} localmente:`, error.message);
  }
  return null;
}

function isDebugEnabled() {
  return process.env.DEBUG === '1' || process.env.DEBUG === 'true';
}

function formatApiError(status, statusText, errorData, provider) {
  const providerConfig = getProviderConfig(provider);
  let message = errorData.error?.message || `Error HTTP ${status}: ${statusText}`;

  if (status === 401 || status === 403) {
    const keyFile = getApiKeyFile(provider);
    message +=
      `\nVerifica tu API key de ${providerConfig.name}:\n` +
      `  export ${providerConfig.envVar}="sk-..."\n` +
      `  O guarda la key en: ${keyFile}\n` +
      `  Obtén una en: ${providerConfig.keyHelpUrl}`;
  }

  return message;
}

/**
 * Parsea campos estructurados TÍTULO/CUERPO/DESCRIPCIÓN de respuestas de IA
 */
export function parseStructuredField(content, fieldName) {
  if (fieldName === 'TÍTULO') {
    const match = content.match(/TÍTULO:\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : '';
  }

  const pattern = new RegExp(`${fieldName}:\\s*([\\s\\S]+)`, 'i');
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Obtiene la API key de un proveedor (env var > archivo local)
 */
export async function getProviderApiKey(provider) {
  const providerConfig = getProviderConfig(provider);

  if (process.env[providerConfig.envVar]) {
    return process.env[providerConfig.envVar];
  }

  const savedKey = loadApiKeyLocally(provider);
  if (savedKey) {
    return savedKey;
  }

  return null;
}

/**
 * Configura la API key de un proveedor
 */
export async function setProviderApiKey(provider, key) {
  getProviderConfig(provider);
  const normalized = normalizeProvider(provider);
  providerState[normalized].apiKey = key;
  saveApiKeyLocally(normalized, key);
}

/**
 * Obtiene la API key de OpenRouter (compatibilidad)
 */
export async function getOpenRouterApiKey() {
  return getProviderApiKey('openrouter');
}

/**
 * Configura la API key de OpenRouter (compatibilidad)
 */
export async function setOpenRouterApiKey(key) {
  return setProviderApiKey('openrouter', key);
}

/**
 * Obtiene la API key de DeepSeek
 */
export async function getDeepSeekApiKey() {
  return getProviderApiKey('deepseek');
}

/**
 * Configura la API key de DeepSeek
 */
export async function setDeepSeekApiKey(key) {
  return setProviderApiKey('deepseek', key);
}

/**
 * Inicializa un proveedor de IA.
 * Nota: no modifica un proveedor activo global; pasa provider explícitamente a callAI.
 */
export async function initAI(provider = CONFIG.DEFAULT_PROVIDER) {
  const debug = isDebugEnabled();
  const normalized = normalizeProvider(provider);
  const providerConfig = getProviderConfig(normalized);

  try {
    const key = await getProviderApiKey(normalized);

    if (!key) {
      const keyFile = getApiKeyFile(normalized);
      throw new Error(
        `No se encontró API key de ${providerConfig.name}.\n` +
        `Configúrala con: export ${providerConfig.envVar}="sk-..."\n` +
        `O guarda la key en: ${keyFile}\n` +
        `Obtén una en: ${providerConfig.keyHelpUrl}`
      );
    }

    if (debug) {
      console.log(`[DEBUG] API key de ${normalized} cargada correctamente`);
    }

    providerState[normalized].apiKey = key;

    if (debug) {
      console.log(`[DEBUG] ${providerConfig.name} inicializado`);
    }

    return true;
  } catch (error) {
    const prefix = `Error al inicializar ${providerConfig.name}`;
    if (error.message.startsWith(prefix) || error.message.includes('No se encontró API key') || error.message.includes('permisos inseguros')) {
      throw error;
    }
    throw new Error(`${prefix}: ${error.message}`);
  }
}

/**
 * Inicializa la conexión con OpenRouter (compatibilidad)
 */
export async function initOpenRouter() {
  return initAI('openrouter');
}

/**
 * Inicializa la conexión con DeepSeek
 */
export async function initDeepSeek() {
  return initAI('deepseek');
}

/**
 * Verifica si un proveedor está inicializado
 */
export function isProviderInitialized(provider) {
  const normalized = normalizeProvider(provider);
  return providerState[normalized]?.apiKey !== null;
}

/**
 * Verifica si OpenRouter está inicializado (compatibilidad)
 */
export function isOpenRouterInitialized() {
  return isProviderInitialized('openrouter');
}

/**
 * Verifica si DeepSeek está inicializado
 */
export function isDeepSeekInitialized() {
  return isProviderInitialized('deepseek');
}

export function buildRequestHeaders(provider, apiKey) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  if (normalizeProvider(provider) === 'openrouter') {
    headers['HTTP-Referer'] = 'https://commit-ai-cli.local';
    headers['X-Title'] = 'Commit AI CLI';
  }

  return headers;
}

/**
 * Realiza una llamada a la API del proveedor seleccionado.
 * Siempre pasa provider explícitamente en options para evitar ambigüedad.
 */
export async function callAI(messages, options = {}) {
  const provider = normalizeProvider(options.provider || CONFIG.DEFAULT_PROVIDER);
  const providerConfig = getProviderConfig(provider);
  const modelResolution = resolveModel(options.model, provider);
  const selectedModel = modelResolution.model;
  const selectedMaxTokens = options.maxTokens ?? CONFIG.MAX_TOKENS;
  const selectedTemperature = options.temperature ?? CONFIG.TEMPERATURE;
  const debug = isDebugEnabled();

  if (!isProviderInitialized(provider)) {
    await initAI(provider);
  }

  const apiKey = providerState[provider].apiKey;

  if (debug) {
    console.log(`[DEBUG] Enviando petición a ${providerConfig.name}...`);
    console.log(`[DEBUG] Modelo: ${selectedModel}`);
    console.log(`[DEBUG] Mensajes: ${messages.length}`);
  }

  let response;
  try {
    response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: buildRequestHeaders(provider, apiKey),
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: selectedMaxTokens,
        temperature: selectedTemperature
      }),
      signal: AbortSignal.timeout(CONFIG.TIMEOUT_MS)
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error(`La petición a ${providerConfig.name} excedió el tiempo límite (${CONFIG.TIMEOUT_MS}ms)`);
    }
    throw error;
  }

  if (debug) {
    console.log(`[DEBUG] Respuesta recibida: HTTP ${response.status}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatApiError(response.status, response.statusText, errorData, provider));
  }

  const data = await response.json();

  if (debug) {
    console.log(`[DEBUG] Datos parseados. Choices: ${data.choices?.length || 0}`);
  }

  if (!data.choices || data.choices.length === 0) {
    throw new Error('La API no devolvió respuesta válida');
  }

  if (debug) {
    console.log('[DEBUG] Respuesta procesada correctamente');
  }

  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: data.usage,
    provider
  };
}

/**
 * Realiza una llamada a la API de OpenRouter (compatibilidad)
 */
export async function callOpenRouter(messages, model = null, maxTokens = null, temperature = null) {
  return callAI(messages, {
    provider: 'openrouter',
    model: model || CONFIG.DEFAULT_MODEL,
    maxTokens,
    temperature
  });
}

/**
 * Realiza una llamada a la API de DeepSeek
 */
export async function callDeepSeek(messages, model = null, maxTokens = null, temperature = null) {
  return callAI(messages, {
    provider: 'deepseek',
    model: model || getDefaultModelForProvider('deepseek'),
    maxTokens,
    temperature
  });
}

/**
 * Genera un mensaje de commit usando IA (título + cuerpo)
 */
export async function generateCommitMessage(diff, style = 'conventional', model = null, provider = null) {
  try {
    const selectedProvider = normalizeProvider(provider || CONFIG.DEFAULT_PROVIDER);

    if (!isProviderInitialized(selectedProvider)) {
      await initAI(selectedProvider);
    }

    const styleConfig = COMMIT_STYLES[style];
    if (!styleConfig) {
      throw new Error(`Estilo de commit no válido: ${style}`);
    }

    const prompt = styleConfig.prompt.replace('{DIFF}', diff);
    const modelResolution = resolveModel(model, selectedProvider);

    const messages = [
      {
        role: 'system',
        content: 'Eres un asistente especializado en generar mensajes de commit para Git. Analiza los cambios de código y genera mensajes claros, concisos y descriptivos.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await callAI(messages, {
      provider: selectedProvider,
      model: modelResolution.model
    });

    const content = (response.content || '').trim();

    if (!content) {
      throw new Error('La IA no generó un mensaje válido.');
    }

    const title = parseStructuredField(content, 'TÍTULO') || (content.split('\n')[0] || 'Update');
    let body = parseStructuredField(content, 'CUERPO');

    if (body.toLowerCase().includes('sin cambios adicionales')) {
      body = '';
    }

    return {
      title,
      body,
      fullMessage: body ? `${title}\n\n${body}` : title,
      model: response.model,
      provider: selectedProvider,
      modelWarning: modelResolution.warning
    };
  } catch (error) {
    const prefix = 'Error al generar mensaje de commit';
    if (error.message.startsWith(prefix) || error.message.includes('Estilo de commit no válido') || error.message.includes('no generó')) {
      throw error;
    }
    throw new Error(`${prefix}: ${error.message}`);
  }
}

/**
 * Genera múltiples variaciones de un mensaje de commit
 */
export async function generateCommitVariations(diff, style = 'conventional', count = 3, provider = null) {
  try {
    const variations = [];

    for (let i = 0; i < count; i++) {
      const message = await generateCommitMessage(diff, style, null, provider);
      variations.push(message);
    }

    return variations;
  } catch (error) {
    throw new Error(`Error al generar variaciones: ${error.message}`);
  }
}

/**
 * Obtiene lista de modelos disponibles (OpenRouter)
 */
export async function listAvailableModels(provider = 'openrouter') {
  const normalized = normalizeProvider(provider);
  if (normalized !== 'openrouter') {
    return getPredefinedModels(normalized);
  }

  try {
    if (!isProviderInitialized('openrouter')) {
      await initAI('openrouter');
    }

    const response = await fetch(`${PROVIDERS.openrouter.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${providerState.openrouter.apiKey}`
      },
      signal: AbortSignal.timeout(CONFIG.TIMEOUT_MS)
    });

    if (!response.ok) {
      return getPredefinedModels(normalized);
    }

    const data = await response.json();

    const freeModels = data.data
      .filter(model => {
        const pricing = model.pricing;
        return pricing &&
               parseFloat(pricing.prompt) === 0 &&
               parseFloat(pricing.completion) === 0;
      })
      .map(model => ({
        name: `🆓 ${model.name}`,
        value: model.id,
        description: model.description || 'Modelo gratuito'
      }));

    if (freeModels.length === 0) {
      return getPredefinedModels(normalized);
    }

    return freeModels;
  } catch (error) {
    return getPredefinedModels(normalized);
  }
}

function getPredefinedModels(provider = 'openrouter') {
  if (normalizeProvider(provider) === 'deepseek') {
    return [
      {
        name: '⚡ DeepSeek V4 Flash (Recomendado)',
        value: 'deepseek-v4-flash',
        description: 'Modelo rápido y eficiente de DeepSeek'
      }
    ];
  }

  return [
    {
      name: '🆓 Auto (Router gratuito - Recomendado)',
      value: 'openrouter/free',
      description: 'Elige automáticamente el mejor modelo gratuito disponible'
    }
  ];
}

/**
 * Valida si un modelo está disponible
 */
export async function validateModel(model, provider = CONFIG.DEFAULT_PROVIDER) {
  try {
    const normalized = normalizeProvider(provider);
    if (!isProviderInitialized(normalized)) {
      await initAI(normalized);
    }

    const messages = [
      { role: 'user', content: 'test' }
    ];

    await callAI(messages, { provider: normalized, model, maxTokens: 10 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene información sobre el uso de la API
 */
export async function getUsageInfo(provider = CONFIG.DEFAULT_PROVIDER) {
  const normalized = normalizeProvider(provider);
  try {
    if (!isProviderInitialized(normalized)) {
      await initAI(normalized);
    }

    return {
      authenticated: true,
      provider: normalized,
      apiKeyConfigured: !!providerState[normalized].apiKey,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      authenticated: false,
      provider: normalized,
      error: error.message
    };
  }
}

/**
 * Cierra la conexión con un proveedor
 */
export function closeProvider(provider) {
  const normalized = normalizeProvider(provider);
  if (providerState[normalized]) {
    providerState[normalized].apiKey = null;
  }
}

/**
 * Cierra la conexión con OpenRouter (compatibilidad)
 */
export function closeOpenRouter() {
  closeProvider('openrouter');
}

/**
 * Cierra la conexión con DeepSeek
 */
export function closeDeepSeek() {
  closeProvider('deepseek');
}

/**
 * Limpia la API key guardada de un proveedor
 */
export function clearSavedApiKey(provider = 'openrouter') {
  try {
    const normalized = normalizeProvider(provider);
    const keyFile = getApiKeyFile(normalized);
    if (fs.existsSync(keyFile)) {
      fs.unlinkSync(keyFile);
    }
    if (providerState[normalized]) {
      providerState[normalized].apiKey = null;
    }
  } catch (error) {
    console.warn(`No se pudo limpiar la API key de ${provider}:`, error.message);
  }
}

// Alias para mantener compatibilidad con código existente
export const initPuter = initOpenRouter;
export const isPuterInitialized = isOpenRouterInitialized;
export const closePuter = closeOpenRouter;
export const clearSavedToken = () => clearSavedApiKey('openrouter');