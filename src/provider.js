import {
  CONFIG,
  PROVIDERS,
  resolveModel,
  isValidProvider,
  normalizeProvider
} from './config.js';

/**
 * Obtiene el proveedor por defecto (env > config constant)
 */
export function getDefaultProvider() {
  const envProvider = process.env.DEFAULT_PROVIDER;
  if (envProvider && isValidProvider(envProvider)) {
    return normalizeProvider(envProvider);
  }
  return CONFIG.DEFAULT_PROVIDER;
}

/**
 * Resuelve el proveedor a usar (CLI > guardado > env/default)
 */
export function resolveProvider(cliProvider, savedConfig = {}) {
  const raw = cliProvider || savedConfig.defaultProvider || getDefaultProvider();
  const provider = normalizeProvider(raw);

  if (!isValidProvider(provider)) {
    throw new Error(`Proveedor no válido: ${raw}. Valores: openrouter, deepseek`);
  }

  return provider;
}

/**
 * Resuelve el modelo para un proveedor dado
 */
export function resolveProviderModel(cliModel, savedConfig, provider) {
  return resolveModel(cliModel, provider, savedConfig?.defaultModel);
}

/**
 * Obtiene el nombre legible de un proveedor
 */
export function getProviderDisplayName(provider) {
  const normalized = normalizeProvider(provider);
  return PROVIDERS[normalized]?.name || provider;
}

/**
 * Resuelve proveedor y modelo en modo interactivo con recuperación ante fallo de init.
 * deps permite inyectar dependencias para tests.
 */
export async function resolveInteractiveProviderAndModel(cliArgs, savedConfig, deps) {
  let forceProviderChange = false;

  while (true) {
    const changeProviderOrModel = await deps.prompt([
      {
        type: 'confirm',
        name: 'change',
        message: '¿Deseas seleccionar un proveedor o modelo diferente?',
        default: forceProviderChange
      }
    ]);

    let provider = resolveProvider(cliArgs.getProvider(), savedConfig);
    let modelResult = resolveProviderModel(cliArgs.getModel(), savedConfig, provider);

    if (forceProviderChange || changeProviderOrModel.change) {
      provider = await deps.selectProvider(provider);
      modelResult = resolveModel(null, provider, savedConfig.defaultModel);
      const selectedModel = await deps.selectModel(modelResult.model, provider);
      modelResult = { model: selectedModel, warning: modelResult.warning };
    }

    if (deps.showWarning) {
      deps.showWarning(modelResult.warning);
    }

    try {
      await deps.ensureProviderReady(provider);
      return { provider, model: modelResult.model };
    } catch (error) {
      if (deps.showError) {
        deps.showError(error.message);
      }

      const retry = await deps.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: '¿Deseas seleccionar otro proveedor?',
          default: true
        }
      ]);

      if (!retry.retry) {
        throw error;
      }

      forceProviderChange = true;
    }
  }
}