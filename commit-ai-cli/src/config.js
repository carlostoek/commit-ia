// Configuración global de la CLI

export const CONFIG = {
  // Configuración de OpenRouter
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',

  // Configuración de DeepSeek
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',

  // Proveedor por defecto
  DEFAULT_PROVIDER: 'deepseek',

  // Modelos gratuitos disponibles (OpenRouter)
  FREE_MODELS: {
    AUTO: 'openrouter/free'  // Router automático (elige el mejor modelo gratuito disponible)
  },

  // Modelo por defecto (DeepSeek v4 Flash)
  DEFAULT_MODEL: 'deepseek-v4-flash',

  // Estilo por defecto
  DEFAULT_STYLE: 'conventional',

  // Límite de historial
  MAX_HISTORY_SIZE: 100,

  // Claves de almacenamiento
  STORAGE_KEYS: {
    HISTORY: 'commit_ai_history',
    STATS: 'commit_ai_stats',
    CONFIG: 'commit_ai_config'
  },

  // Timeout para operaciones
  TIMEOUT_MS: 30000,

  // Máximo de tokens para respuesta
  MAX_TOKENS: 500,

  // Temperatura de generación
  TEMPERATURE: 0.7
};

export const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: CONFIG.OPENROUTER_BASE_URL,
    keyFile: '.commit-ai-openrouter-key',
    envVar: 'OPENROUTER_API_KEY',
    defaultModel: 'openrouter/free',
    keyHelpUrl: 'https://openrouter.ai/keys'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: CONFIG.DEEPSEEK_BASE_URL,
    keyFile: '.commit-ai-deepseek-key',
    envVar: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-v4-flash',
    keyHelpUrl: 'https://platform.deepseek.com/api_keys'
  }
};

export const COMMIT_STYLES = {
  conventional: {
    name: 'Conventional Commits',
    description: 'feat(scope): description',
    prompt: `Analiza los siguientes cambios de Git y genera un mensaje de commit en formato Conventional Commits.
Los tipos válidos son: feat, fix, docs, style, refactor, perf, test, chore.
El formato es: type(scope): description

Cambios:
{DIFF}

Genera la respuesta en este formato exacto:
TÍTULO: [mensaje de una línea, máximo 50 caracteres]
CUERPO: [descripción detallada de los cambios, máximo 200 caracteres]

El título debe ser conciso y seguir el formato Conventional Commits.
El cuerpo debe explicar QUÉ cambió y POR QUÉ.
Si no hay cambios significativos para el cuerpo, escribe "Sin cambios adicionales".`
  },

  emoji: {
    name: 'Emoji Commits',
    description: '✨ add feature description',
    prompt: `Analiza los siguientes cambios de Git y genera un mensaje de commit con emojis relevantes.

Cambios:
{DIFF}

Usa emojis como:
- ✨ para features nuevas
- 🐛 para bug fixes
- 📚 para documentación
- 🎨 para cambios de estilo
- ♻️ para refactoring
- ⚡ para mejoras de performance
- ✅ para tests
- 🔧 para configuración

Genera la respuesta en este formato exacto:
TÍTULO: [emoji descripción concisa, máximo 50 caracteres]
CUERPO: [descripción detallada de los cambios, máximo 200 caracteres]

El título debe incluir el emoji y ser conciso.
El cuerpo debe explicar QUÉ cambió y POR QUÉ.
Si no hay cambios significativos para el cuerpo, escribe "Sin cambios adicionales".`
  },

  descriptive: {
    name: 'Descriptive Commits',
    description: '[FEATURE] Add user authentication',
    prompt: `Analiza los siguientes cambios de Git y genera un mensaje de commit descriptivo y claro.

Cambios:
{DIFF}

Usa tipos en formato [TIPO]:
- [FEATURE] para nuevas características
- [BUGFIX] para correcciones de errores
- [DOCS] para cambios de documentación
- [REFACTOR] para refactorización de código
- [PERFORMANCE] para mejoras de rendimiento
- [TEST] para cambios en tests
- [CHORE] para tareas de mantenimiento

Genera la respuesta en este formato exacto:
TÍTULO: [[TIPO] descripción concisa, máximo 50 caracteres]
CUERPO: [descripción detallada de los cambios, máximo 200 caracteres]

El título debe incluir el tipo y ser conciso.
El cuerpo debe explicar QUÉ cambió y POR QUÉ.
Si no hay cambios significativos para el cuerpo, escribe "Sin cambios adicionales".`
  }
};

export const MODELS_BY_PROVIDER = {
  openrouter: {
    free: [
      { name: '🆓 Auto (Router gratuito - Recomendado)', value: 'openrouter/free', description: 'Elige automáticamente el mejor modelo gratuito disponible' }
    ],
    fast: [
      { name: 'GPT-5.4 Nano (Rápido)', value: 'gpt-5.4-nano' },
      { name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
      { name: 'Claude 3.5 Haiku', value: 'claude-3.5-haiku' }
    ],
    balanced: [
      { name: 'GPT-5.4 (Balanceado)', value: 'gpt-5.4' },
      { name: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
      { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' }
    ],
    powerful: [
      { name: 'GPT-5.2 Chat (Potente)', value: 'gpt-5.2-chat' },
      { name: 'Claude 3 Opus', value: 'claude-3-opus' }
    ]
  },
  deepseek: {
    recommended: [
      {
        name: '⚡ DeepSeek V4 Flash (Recomendado)',
        value: 'deepseek-v4-flash',
        description: 'Modelo rápido y eficiente de DeepSeek'
      }
    ]
  }
};

// Alias de compatibilidad (modelos OpenRouter)
export const MODELS = MODELS_BY_PROVIDER.openrouter;

/**
 * Normaliza un identificador de proveedor
 */
export function normalizeProvider(provider) {
  if (provider == null || typeof provider !== 'string') {
    return '';
  }
  return provider.trim().toLowerCase();
}

/**
 * Verifica si un proveedor es válido
 */
export function isValidProvider(provider) {
  const normalized = normalizeProvider(provider);
  return normalized !== '' && Object.hasOwn(PROVIDERS, normalized);
}

/**
 * Obtiene el modelo por defecto para un proveedor
 */
export function getDefaultModelForProvider(provider = CONFIG.DEFAULT_PROVIDER) {
  const normalized = normalizeProvider(provider);
  const providerConfig = Object.hasOwn(PROVIDERS, normalized) ? PROVIDERS[normalized] : null;
  if (providerConfig) {
    return providerConfig.defaultModel;
  }
  return CONFIG.DEFAULT_MODEL;
}

/**
 * Verifica si un modelo pertenece a un proveedor (lista curada)
 */
export function isModelValidForProvider(model, provider) {
  const normalized = normalizeProvider(provider);
  const providerModels = MODELS_BY_PROVIDER[normalized];
  if (!providerModels) {
    return false;
  }

  const allModels = Object.values(providerModels).flat();
  return allModels.some(entry => entry.value === model);
}

/**
 * Retorna el proveedor exclusivo de un modelo en la lista curada, o null
 */
export function getExclusiveProviderForModel(model) {
  if (!model) {
    return null;
  }

  let exclusiveProvider = null;
  for (const providerId of Object.keys(MODELS_BY_PROVIDER)) {
    if (isModelValidForProvider(model, providerId)) {
      if (exclusiveProvider) {
        return null;
      }
      exclusiveProvider = providerId;
    }
  }
  return exclusiveProvider;
}

/**
 * Resuelve el modelo a usar según proveedor y configuración guardada.
 * Retorna { model, warning } donde warning indica un fallback con mensaje.
 */
export function resolveModel(model, provider, savedModel = null) {
  const normalizedProvider = normalizeProvider(provider);
  const explicitModel = model;
  const candidate = model || savedModel;
  const defaultModel = getDefaultModelForProvider(normalizedProvider);

  if (normalizedProvider === 'openrouter') {
    if (explicitModel) {
      return { model: explicitModel, warning: null };
    }
    if (savedModel) {
      const exclusiveProvider = getExclusiveProviderForModel(savedModel);
      if (exclusiveProvider && exclusiveProvider !== 'openrouter') {
        return {
          model: defaultModel,
          warning: `El modelo guardado "${savedModel}" no es compatible con el proveedor openrouter. Usando "${defaultModel}".`
        };
      }
      return { model: savedModel, warning: null };
    }
    return { model: defaultModel, warning: null };
  }

  if (normalizedProvider === 'deepseek') {
    if (candidate && isModelValidForProvider(candidate, normalizedProvider)) {
      return { model: candidate, warning: null };
    }

    let warning = null;
    if (explicitModel) {
      warning = `El modelo "${explicitModel}" no es compatible con el proveedor deepseek. Usando "${defaultModel}".`;
    } else if (savedModel && savedModel !== defaultModel) {
      warning = `El modelo guardado "${savedModel}" no es compatible con el proveedor deepseek. Usando "${defaultModel}".`;
    }
    return { model: defaultModel, warning };
  }

  return { model: defaultModel, warning: null };
}

export const COLORS = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  muted: 'gray'
};