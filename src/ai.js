import { init, getAuthToken } from '@heyputer/puter.js/src/init.cjs';
import { CONFIG, COMMIT_STYLES } from './config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

let puter = null;
let authToken = null;

// Ruta del archivo de token
const TOKEN_FILE = path.join(os.homedir(), '.commit-ai-token');

/**
 * Extrae un mensaje de error legible de diferentes estructuras de error
 */
function extractErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.error?.message) {
    return error.error.message;
  }
  if (error?.error?.code) {
    return error.error.code;
  }
  if (error?.code) {
    return error.code;
  }
  return 'Error desconocido';
}

/**
 * Guarda el token en archivo local
 */
function saveTokenLocally(token) {
  try {
    fs.writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
  } catch (error) {
    console.warn('No se pudo guardar el token localmente:', error.message);
  }
}

/**
 * Carga el token desde archivo local
 */
function loadTokenLocally() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    }
  } catch (error) {
    console.warn('No se pudo cargar el token localmente:', error.message);
  }
  return null;
}

/**
 * Inicializa la conexión con Puter
 */
export async function initPuter() {
  try {
    if (puter) {
      return puter;
    }
    
    // Intentar cargar token guardado
    let savedToken = loadTokenLocally();
    
    // Obtener token de autenticación
    if (!authToken) {
      try {
        // Si hay token guardado, intentar usarlo
        if (savedToken) {
          authToken = savedToken;
        } else {
          // Si no, pedir autenticación (abre navegador)
          authToken = await getAuthToken();
          // Guardar el nuevo token
          if (authToken) {
            saveTokenLocally(authToken);
          }
        }
      } catch (error) {
        // Si falla, pedir autenticación nuevamente
        authToken = await getAuthToken();
        if (authToken) {
          saveTokenLocally(authToken);
        }
      }
    }
    
    // Inicializar Puter
    puter = init(authToken);
    
    return puter;
  } catch (error) {
    throw new Error(`Error al inicializar Puter: ${extractErrorMessage(error)}`);
  }
}

/**
 * Verifica si Puter está inicializado
 */
export function isPuterInitialized() {
  return puter !== null;
}

/**
 * Genera un mensaje de commit usando IA (título + cuerpo)
 */
export async function generateCommitMessage(diff, style = 'conventional', model = null) {
  try {
    // Inicializar Puter si no está inicializado
    if (!isPuterInitialized()) {
      await initPuter();
    }
    
    // Obtener configuración del estilo
    const styleConfig = COMMIT_STYLES[style];
    if (!styleConfig) {
      throw new Error(`Estilo de commit no válido: ${style}`);
    }
    
    // Preparar el prompt
    const prompt = styleConfig.prompt.replace('{DIFF}', diff);
    
    // Usar modelo por defecto si no se especifica
    const selectedModel = model || CONFIG.DEFAULT_MODEL;
    
    // Llamar a la API de IA
    const response = await puter.ai.chat(prompt, {
      model: selectedModel,
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    });
    
    // Extraer el contenido
    const content = response.message.content.toString().trim();
    
    if (!content) {
      throw new Error('La IA no generó un mensaje válido.');
    }
    
    // Parsear título y cuerpo
    const titleMatch = content.match(/TÍTULO:\s*(.+?)(?:\n|$)/);
    const bodyMatch = content.match(/CUERPO:\s*(.+?)(?:\n|$)/s);
    
    const title = titleMatch ? titleMatch[1].trim() : content.split('\n')[0];
    let body = bodyMatch ? bodyMatch[1].trim() : '';
    
    // Limpiar el cuerpo si dice "Sin cambios adicionales"
    if (body.toLowerCase().includes('sin cambios adicionales')) {
      body = '';
    }
    
    return {
      title: title,
      body: body,
      fullMessage: body ? `${title}\n\n${body}` : title
    };
  } catch (error) {
    throw new Error(`Error al generar mensaje de commit: ${extractErrorMessage(error)}`);
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
    throw new Error(`Error al generar variaciones: ${extractErrorMessage(error)}`);
  }
}

/**
 * Obtiene lista de modelos disponibles
 */
export async function listAvailableModels() {
  try {
    if (!isPuterInitialized()) {
      await initPuter();
    }
    
    // Puter.js no tiene un método directo para listar modelos,
    // pero podemos retornar una lista predefinida de modelos populares
    const models = [
      { name: 'GPT-5.4 Nano (Rápido)', value: 'gpt-5.4-nano' },
      { name: 'GPT-5.4 (Balanceado)', value: 'gpt-5.4' },
      { name: 'GPT-5.2 Chat (Potente)', value: 'gpt-5.2-chat' },
      { name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
      { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
      { name: 'Claude 3.5 Haiku', value: 'claude-3.5-haiku' },
      { name: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
      { name: 'Claude 3 Opus', value: 'claude-3-opus' },
      { name: 'Mistral Large', value: 'mistral-large' },
      { name: 'DeepSeek Chat', value: 'deepseek-chat' }
    ];
    
    return models;
  } catch (error) {
    throw new Error(`Error al obtener modelos: ${extractErrorMessage(error)}`);
  }
}

/**
 * Valida si un modelo está disponible
 */
export async function validateModel(model) {
  try {
    if (!isPuterInitialized()) {
      await initPuter();
    }
    
    // Intentar hacer una llamada de prueba con el modelo
    const testResponse = await puter.ai.chat('test', {
      model: model,
      max_tokens: 10
    });
    
    return testResponse !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene información sobre el uso de la API
 */
export async function getUsageInfo() {
  try {
    if (!isPuterInitialized()) {
      await initPuter();
    }
    
    // Puter.js puede proporcionar información de uso
    // Esta es una función placeholder que puede expandirse
    return {
      authenticated: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      authenticated: false,
      error: extractErrorMessage(error)
    };
  }
}

/**
 * Cierra la conexión con Puter
 */
export function closePuter() {
  puter = null;
  authToken = null;
}

/**
 * Limpia el token guardado
 */
export function clearSavedToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
  } catch (error) {
    console.warn('No se pudo limpiar el token:', error.message);
  }
}
