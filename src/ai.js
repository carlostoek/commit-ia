import { CONFIG, COMMIT_STYLES } from './config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Ruta del archivo de API key
const API_KEY_FILE = path.join(os.homedir(), '.commit-ai-openrouter-key');

let apiKey = null;

/**
 * Guarda la API key en archivo local
 */
function saveApiKeyLocally(key) {
  try {
    fs.writeFileSync(API_KEY_FILE, key, { mode: 0o600 });
  } catch (error) {
    console.warn('No se pudo guardar la API key localmente:', error.message);
  }
}

/**
 * Carga la API key desde archivo local
 */
function loadApiKeyLocally() {
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      return fs.readFileSync(API_KEY_FILE, 'utf-8').trim();
    }
  } catch (error) {
    console.warn('No se pudo cargar la API key localmente:', error.message);
  }
  return null;
}

/**
 * Obtiene la API key de OpenRouter
 */
export async function getOpenRouterApiKey() {
  // Primero revisar variable de entorno
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }

  // Luego revisar archivo local
  const savedKey = loadApiKeyLocally();
  if (savedKey) {
    return savedKey;
  }

  return null;
}

/**
 * Configura la API key de OpenRouter
 */
export async function setOpenRouterApiKey(key) {
  apiKey = key;
  saveApiKeyLocally(key);
}

/**
 * Inicializa la conexión con OpenRouter
 */
export async function initOpenRouter() {
  const debug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

  try {
    const key = await getOpenRouterApiKey();

    if (!key) {
      throw new Error(
        'No se encontró API key de OpenRouter.\n' +
        'Configúrala con: export OPENROUTER_API_KEY="sk-or-v1-..."\n' +
        'Obtén una gratis en: https://openrouter.ai/keys'
      );
    }

    if (debug) {
      console.log('[DEBUG] API key cargada correctamente');
    }

    apiKey = key;

    if (debug) {
      console.log('[DEBUG] OpenRouter inicializado');
    }

    return true;
  } catch (error) {
    throw new Error(`Error al inicializar OpenRouter: ${error.message}`);
  }
}

/**
 * Verifica si OpenRouter está inicializado
 */
export function isOpenRouterInitialized() {
  return apiKey !== null;
}

/**
 * Realiza una llamada a la API de OpenRouter
 */
async function callOpenRouter(messages, model = null, maxTokens = null, temperature = null) {
  const selectedModel = model || CONFIG.DEFAULT_MODEL;
  const selectedMaxTokens = maxTokens || CONFIG.MAX_TOKENS;
  const selectedTemperature = temperature !== null ? temperature : CONFIG.TEMPERATURE;

  const debug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

  if (debug) {
    console.log('[DEBUG] Enviando petición a OpenRouter...');
    console.log(`[DEBUG] Modelo: ${selectedModel}`);
    console.log(`[DEBUG] Mensajes: ${messages.length}`);
  }

  const response = await fetch(`${CONFIG.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://commit-ai-cli.local',
      'X-Title': 'Commit AI CLI'
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      max_tokens: selectedMaxTokens,
      temperature: selectedTemperature
    })
  });

  if (debug) {
    console.log(`[DEBUG] Respuesta recibida: HTTP ${response.status}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
      `Error HTTP ${response.status}: ${response.statusText}`
    );
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
    usage: data.usage
  };
}

/**
 * Genera un mensaje de commit usando IA (título + cuerpo)
 */
export async function generateCommitMessage(diff, style = 'conventional', model = null) {
  try {
    // Inicializar OpenRouter si no está inicializado
    if (!isOpenRouterInitialized()) {
      await initOpenRouter();
    }

    // Obtener configuración del estilo
    const styleConfig = COMMIT_STYLES[style];
    if (!styleConfig) {
      throw new Error(`Estilo de commit no válido: ${style}`);
    }

    // Preparar el prompt
    const prompt = styleConfig.prompt.replace('{DIFF}', diff);

    // Llamar a la API de OpenRouter
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

    const response = await callOpenRouter(messages, model);

    // Extraer el contenido
    const content = (response.content || '').trim();

    if (!content) {
      throw new Error('La IA no generó un mensaje válido.');
    }

    // Parsear título y cuerpo
    const titleMatch = content.match(/TÍTULO:\s*(.+?)(?:\n|$)/i);
    const bodyMatch = content.match(/CUERPO:\s*(.+?)(?:\n|$)/is);

    const title = titleMatch ? titleMatch[1].trim() : (content.split('\n')[0] || 'Update');
    let body = bodyMatch ? bodyMatch[1].trim() : '';

    // Limpiar el cuerpo si dice "Sin cambios adicionales"
    if (body.toLowerCase().includes('sin cambios adicionales')) {
      body = '';
    }

    return {
      title: title,
      body: body,
      fullMessage: body ? `${title}\n\n${body}` : title,
      model: response.model
    };
  } catch (error) {
    throw new Error(`Error al generar mensaje de commit: ${error.message}`);
  }
}

/**
 * Genera múltiples variaciones de un mensaje de commit
 */
export async function generateCommitVariations(diff, style = 'conventional', count = 3) {
  try {
    const variations = [];

    for (let i = 0; i < count; i++) {
      const message = await generateCommitMessage(
        diff,
        style,
        null
      );
      variations.push(message);
    }

    return variations;
  } catch (error) {
    throw new Error(`Error al generar variaciones: ${error.message}`);
  }
}

/**
 * Obtiene lista de modelos disponibles
 */
export async function listAvailableModels() {
  try {
    if (!isOpenRouterInitialized()) {
      await initOpenRouter();
    }

    // Obtener modelos desde OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      // Si falla, retornar lista predefinida
      return getPredefinedModels();
    }

    const data = await response.json();

    // Filtrar modelos gratuitos
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
      return getPredefinedModels();
    }

    return freeModels;
  } catch (error) {
    // Si falla, retornar lista predefinida
    return getPredefinedModels();
  }
}

/**
 * Retorna lista predefinida de modelos
 */
function getPredefinedModels() {
  return [
    { name: '🆓 Auto (Router gratuito - Recomendado)', value: 'openrouter/free', description: 'Elige automáticamente el mejor modelo gratuito disponible' }
  ];
}

/**
 * Valida si un modelo está disponible
 */
export async function validateModel(model) {
  try {
    if (!isOpenRouterInitialized()) {
      await initOpenRouter();
    }

    // Intentar hacer una llamada de prueba con el modelo
    const messages = [
      { role: 'user', content: 'test' }
    ];

    await callOpenRouter(messages, model, 10);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene información sobre el uso de la API
 */
export async function getUsageInfo() {
  try {
    if (!isOpenRouterInitialized()) {
      await initOpenRouter();
    }

    return {
      authenticated: true,
      apiKeyConfigured: !!apiKey,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error.message
    };
  }
}

/**
 * Cierra la conexión con OpenRouter
 */
export function closeOpenRouter() {
  apiKey = null;
}

/**
 * Limpia la API key guardada
 */
export function clearSavedApiKey() {
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      fs.unlinkSync(API_KEY_FILE);
    }
  } catch (error) {
    console.warn('No se pudo limpiar la API key:', error.message);
  }
}

// Alias para mantener compatibilidad con código existente
export const initPuter = initOpenRouter;
export const isPuterInitialized = isOpenRouterInitialized;
export const closePuter = closeOpenRouter;
export const clearSavedToken = clearSavedApiKey;
