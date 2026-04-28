// Configuración global de la CLI

export const CONFIG = {
  // Configuración de OpenRouter
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',

  // Modelos gratuitos disponibles
  FREE_MODELS: {
    AUTO: 'openrouter/free'  // Router automático (elige el mejor modelo gratuito disponible)
  },

  // Modelo por defecto (gratuito)
  DEFAULT_MODEL: 'openrouter/free',
  
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

export const MODELS = {
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
};

export const COLORS = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  muted: 'gray'
};
