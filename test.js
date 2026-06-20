import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CONFIG,
  PROVIDERS,
  MODELS_BY_PROVIDER,
  getDefaultModelForProvider,
  isModelValidForProvider,
  resolveModel,
  isValidProvider,
  normalizeProvider,
  getExclusiveProviderForModel
} from './src/config.js';
import {
  getProviderApiKey,
  callAI,
  initAI,
  isProviderInitialized,
  closeProvider,
  getApiKeyFile,
  setApiKeyFileForTesting,
  resetApiKeyFileForTesting,
  buildRequestHeaders,
  parseStructuredField,
  initPuter,
  initOpenRouter,
  callOpenRouter,
  isPuterInitialized,
  isOpenRouterInitialized,
  generateCommitMessage
} from './src/ai.js';
import { generatePRContent } from './src/pr.js';
import { CLIArgs } from './src/args.js';
import {
  getConfig,
  saveConfig,
  saveCommit,
  updateStats,
  setStoreFileForTesting,
  resetStoreForTesting
} from './src/storage.js';
import {
  resolveProvider,
  resolveProviderModel,
  getProviderDisplayName,
  getDefaultProvider,
  resolveInteractiveProviderAndModel
} from './src/provider.js';

const passed = [];

async function runTest(name, fn) {
  await fn();
  passed.push(name);
  console.log(`  ✓ ${name}`);
}

function withArgv(args, fn) {
  const originalArgv = process.argv;
  process.argv = ['node', 'test.js', ...args];
  try {
    return fn();
  } finally {
    process.argv = originalArgv;
  }
}

async function withEnvVar(vars, fn) {
  const originals = {};
  for (const [key, value] of Object.entries(vars)) {
    originals[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function withMockedFetch(mockFn, fn) {
  const originalFetch = global.fetch;
  global.fetch = mockFn;
  try {
    return await fn();
  } finally {
    global.fetch = originalFetch;
  }
}

async function withTempStore(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-ai-test-'));
  const storeFile = path.join(tempDir, 'store.json');
  setStoreFileForTesting(storeFile);
  try {
    await fn(storeFile);
  } finally {
    resetStoreForTesting();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function withTempKeyFile(provider, fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commit-ai-key-'));
  const keyFile = path.join(tempDir, 'key');
  setApiKeyFileForTesting(provider, keyFile);
  try {
    await fn(keyFile);
  } finally {
    resetApiKeyFileForTesting();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function run() {
  await runTest('config providers', () => {
    assert.equal(PROVIDERS.deepseek.defaultModel, 'deepseek-v4-flash');
    assert.equal(getDefaultModelForProvider('deepseek'), 'deepseek-v4-flash');
  });

  await runTest('resolveModel openrouter passthrough', () => {
    assert.deepEqual(resolveModel('anthropic/claude-3.5-sonnet', 'openrouter'), {
      model: 'anthropic/claude-3.5-sonnet',
      warning: null
    });
  });

  await runTest('resolveModel deepseek incompatible saved', async () => {
    const incompatibleSaved = resolveModel(null, 'deepseek', 'openrouter/free');
    assert.equal(incompatibleSaved.model, 'deepseek-v4-flash');
    assert.match(incompatibleSaved.warning, /openrouter\/free/);
  });

  await runTest('resolveModel openrouter incompatible saved deepseek model', () => {
    const result = resolveModel(null, 'openrouter', 'deepseek-v4-flash');
    assert.equal(result.model, 'openrouter/free');
    assert.match(result.warning, /deepseek-v4-flash/);
    assert.equal(getExclusiveProviderForModel('deepseek-v4-flash'), 'deepseek');
  });

  await runTest('resolveProvider CLI override and env default', async () => {
    await withEnvVar({ DEFAULT_PROVIDER: 'deepseek' }, () => {
      assert.equal(resolveProvider(null, {}), 'deepseek');
      assert.equal(resolveProvider('openrouter', { defaultProvider: 'deepseek' }), 'openrouter');
      assert.equal(getDefaultProvider(), 'deepseek');
    });
  });

  await runTest('resolveProvider invalid throws', () => {
    assert.throws(() => resolveProvider('invalid', {}), /Proveedor no válido/);
  });

  await runTest('CLI --provider and -p alias', () => {
    withArgv(['--provider', 'deepseek'], () => {
      assert.equal(new CLIArgs().getProvider(), 'deepseek');
    });
    withArgv(['-p', 'deepseek'], () => {
      assert.equal(new CLIArgs().getProvider(), 'deepseek');
    });
  });

  await runTest('CLI invalid provider at parse time', () => {
    assert.throws(
      () => withArgv(['--provider', 'invalid'], () => new CLIArgs()),
      /Proveedor no válido/
    );
  });

  await runTest('CLI empty provider flag', () => {
    assert.throws(
      () => withArgv(['--provider'], () => new CLIArgs()),
      /requiere un valor/
    );
  });

  await runTest('parseStructuredField multiline', () => {
    const content = 'TÍTULO: feat: add\nCUERPO: line one\nline two';
    assert.equal(parseStructuredField(content, 'TÍTULO'), 'feat: add');
    assert.equal(parseStructuredField(content, 'CUERPO'), 'line one\nline two');
  });

  await runTest('storage provider tracking', async () => {
    await withTempStore(async () => {
      const entry = await saveCommit('feat: test', 'diff', 'conventional', 'deepseek-v4-flash', 'deepseek');
      assert.equal(entry.provider, 'deepseek');
      const stats = await updateStats('conventional', 'deepseek-v4-flash', 'deepseek');
      assert.equal(stats.byProvider.deepseek, 1);
    });
  });

  await runTest('storage rejects invalid provider on save', async () => {
    await withTempStore(async () => {
      await assert.rejects(
        () => saveConfig({ defaultProvider: 'bad' }),
        /Proveedor no válido/
      );
    });
  });

  await runTest('getConfig normalizes invalid provider and persists', async () => {
    await withTempStore(async (storeFile) => {
      fs.writeFileSync(storeFile, JSON.stringify({
        history: [],
        stats: {},
        config: { defaultProvider: 'not-a-provider', defaultModel: 'deepseek-v4-flash' }
      }));
      resetStoreForTesting();
      setStoreFileForTesting(storeFile);

      const config = await getConfig();
      assert.equal(config.defaultProvider, 'deepseek');
      assert.equal(config.defaultModel, 'deepseek-v4-flash');

      const persisted = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
      assert.equal(persisted.config.defaultProvider, 'deepseek');
      assert.equal(persisted.config.defaultModel, 'deepseek-v4-flash');
    });
  });

  await runTest('saveConfig normalizes mismatched provider-model', async () => {
    await withTempStore(async () => {
      await saveConfig({ defaultProvider: 'deepseek', defaultModel: 'gpt-5.4' });
      const config = await getConfig();
      assert.equal(config.defaultProvider, 'deepseek');
      assert.equal(config.defaultModel, 'deepseek-v4-flash');
    });
  });

  await runTest('key file load from disk', async () => {
    await withTempKeyFile('deepseek', async (keyFile) => {
      await withEnvVar({ DEEPSEEK_API_KEY: undefined }, async () => {
        fs.writeFileSync(keyFile, 'sk-from-file', { mode: 0o600 });
        closeProvider('deepseek');
        const key = await getProviderApiKey('deepseek');
        assert.equal(key, 'sk-from-file');
        closeProvider('deepseek');
      });
    });
  });

  await runTest('key file env precedence over file', async () => {
    await withTempKeyFile('deepseek', async (keyFile) => {
      fs.writeFileSync(keyFile, 'sk-from-file', { mode: 0o600 });
      await withEnvVar({ DEEPSEEK_API_KEY: 'sk-from-env' }, async () => {
        closeProvider('deepseek');
        const key = await getProviderApiKey('deepseek');
        assert.equal(key, 'sk-from-env');
        closeProvider('deepseek');
      });
    });
  });

  await runTest('key file insecure permissions rejected', async () => {
    await withTempKeyFile('deepseek', async (keyFile) => {
      await withEnvVar({ DEEPSEEK_API_KEY: undefined }, async () => {
        fs.writeFileSync(keyFile, 'sk-insecure', { mode: 0o644 });
        closeProvider('deepseek');
        await assert.rejects(
          () => getProviderApiKey('deepseek'),
          /permisos inseguros/
        );
        closeProvider('deepseek');
      });
    });
  });

  await runTest('initAI missing key includes file path', async () => {
    await withTempKeyFile('deepseek', async () => {
      await withEnvVar({ DEEPSEEK_API_KEY: undefined }, async () => {
        closeProvider('deepseek');
        await assert.rejects(
          () => initAI('deepseek'),
          (error) => {
            assert.match(error.message, /No se encontró API key/);
            assert.ok(error.message.includes(getApiKeyFile('deepseek')));
            return true;
          }
        );
        closeProvider('deepseek');
      });
    });
  });

  await runTest('callAI deepseek headers and body', async () => {
    await withEnvVar({ DEEPSEEK_API_KEY: 'sk-test' }, async () => {
      await withMockedFetch(async (url, options) => {
        assert.equal(url, 'https://api.deepseek.com/chat/completions');
        assert.equal(options.headers['HTTP-Referer'], undefined);
        const body = JSON.parse(options.body);
        assert.equal(body.model, 'deepseek-v4-flash');
        assert.equal(body.max_tokens, 500);
        assert.equal(body.temperature, 0.7);
        assert.ok(Array.isArray(body.messages));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'TÍTULO: test' } }],
            model: 'deepseek-v4-flash'
          })
        };
      }, async () => {
        closeProvider('deepseek');
        const response = await callAI(
          [{ role: 'user', content: 'hello' }],
          { provider: 'deepseek', model: 'deepseek-v4-flash' }
        );
        assert.equal(response.provider, 'deepseek');
        closeProvider('deepseek');
      });
    });
  });

  await runTest('callAI openrouter headers', async () => {
    await withEnvVar({ OPENROUTER_API_KEY: 'sk-or-test' }, async () => {
      await withMockedFetch(async (url, options) => {
        assert.equal(options.headers['HTTP-Referer'], 'https://commit-ai-cli.local');
        assert.equal(options.headers['X-Title'], 'Commit AI CLI');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'ok' } }],
            model: 'openrouter/free'
          })
        };
      }, async () => {
        closeProvider('openrouter');
        await callAI([{ role: 'user', content: 'hello' }], { provider: 'openrouter' });
        closeProvider('openrouter');
      });
    });
  });

  await runTest('callAI auth error includes key path', async () => {
    await withEnvVar({ DEEPSEEK_API_KEY: 'sk-bad' }, async () => {
      await withMockedFetch(async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      }), async () => {
        closeProvider('deepseek');
        await initAI('deepseek');
        await assert.rejects(
          () => callAI([{ role: 'user', content: 'hi' }], { provider: 'deepseek' }),
          (error) => {
            assert.match(error.message, /Invalid API key/);
            assert.match(error.message, /DEEPSEEK_API_KEY/);
            assert.ok(error.message.includes(getApiKeyFile('deepseek')));
            return true;
          }
        );
        closeProvider('deepseek');
      });
    });
  });

  await runTest('callAI empty choices', async () => {
    await withEnvVar({ DEEPSEEK_API_KEY: 'sk-test' }, async () => {
      await withMockedFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ choices: [] })
      }), async () => {
        closeProvider('deepseek');
        await initAI('deepseek');
        await assert.rejects(
          () => callAI([{ role: 'user', content: 'hi' }], { provider: 'deepseek' }),
          /no devolvió respuesta válida/
        );
        closeProvider('deepseek');
      });
    });
  });

  await runTest('callAI timeout error', async () => {
    await withEnvVar({ DEEPSEEK_API_KEY: 'sk-test' }, async () => {
      await withMockedFetch(async () => {
        const error = new Error('timeout');
        error.name = 'TimeoutError';
        throw error;
      }, async () => {
        closeProvider('deepseek');
        await initAI('deepseek');
        await assert.rejects(
          () => callAI([{ role: 'user', content: 'hi' }], { provider: 'deepseek' }),
          /excedió el tiempo límite/
        );
        closeProvider('deepseek');
      });
    });
  });

  await runTest('generateCommitMessage end-to-end', async () => {
    await withEnvVar({ DEEPSEEK_API_KEY: 'sk-test' }, async () => {
      await withMockedFetch(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{
            message: {
              content: 'TÍTULO: feat: add provider\nCUERPO: line one\nline two'
            }
          }],
          model: 'deepseek-v4-flash'
        })
      }), async () => {
        closeProvider('deepseek');
        const message = await generateCommitMessage('diff', 'conventional', 'gpt-5.4', 'deepseek');
        assert.equal(message.title, 'feat: add provider');
        assert.equal(message.body, 'line one\nline two');
        assert.equal(message.provider, 'deepseek');
        assert.match(message.modelWarning, /gpt-5.4/);
        closeProvider('deepseek');
      });
    });
  });

  await runTest('generatePRContent provider and legacy signature', async () => {
    await withEnvVar({ OPENROUTER_API_KEY: 'sk-or-test' }, async () => {
      await withMockedFetch(async (url, options) => {
        assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
        const body = JSON.parse(options.body);
        assert.equal(body.model, 'gpt-5.4');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{
              message: {
                content: 'TÍTULO: Add feature\nDESCRIPCIÓN: line one\nline two'
              }
            }],
            model: 'gpt-5.4'
          })
        };
      }, async () => {
        closeProvider('openrouter');
        const content = await generatePRContent('diff', 'gpt-5.4', null, 'openrouter');
        assert.equal(content.title, 'Add feature');
        assert.equal(content.description, 'line one\nline two');
        assert.equal(content.provider, 'openrouter');
        closeProvider('openrouter');
      });
    });
  });

  await runTest('resolveInteractiveProviderAndModel default path', async () => {
    const prompts = [];
    const deps = {
      prompt: async (questions) => {
        prompts.push(questions);
        if (questions[0].name === 'change') {
          return { change: false };
        }
        return {};
      },
      selectProvider: async () => 'deepseek',
      selectModel: async () => 'deepseek-v4-flash',
      ensureProviderReady: async () => {},
      showWarning: () => {},
      showError: () => {}
    };

    const cliArgs = { getProvider: () => null, getModel: () => null };
    const result = await resolveInteractiveProviderAndModel(
      cliArgs,
      { defaultProvider: 'openrouter', defaultModel: 'openrouter/free' },
      deps
    );
    assert.equal(result.provider, 'openrouter');
    assert.equal(result.model, 'openrouter/free');
  });

  await runTest('resolveInteractiveProviderAndModel recovery on init failure', async () => {
    let initAttempts = 0;
    let promptCount = 0;
    const deps = {
      prompt: async (questions) => {
        promptCount++;
        if (questions[0].name === 'change') {
          return { change: promptCount > 1 };
        }
        if (questions[0].name === 'retry') {
          return { retry: true };
        }
        return {};
      },
      selectProvider: async () => 'openrouter',
      selectModel: async () => 'openrouter/free',
      ensureProviderReady: async () => {
        initAttempts++;
        if (initAttempts === 1) {
          throw new Error('No se encontró API key');
        }
      },
      showWarning: () => {},
      showError: () => {}
    };

    const cliArgs = { getProvider: () => null, getModel: () => null };
    const result = await resolveInteractiveProviderAndModel(
      cliArgs,
      { defaultProvider: 'deepseek', defaultModel: 'deepseek-v4-flash' },
      deps
    );
    assert.equal(result.provider, 'openrouter');
    assert.equal(initAttempts, 2);
  });

  await runTest('backward compat aliases', () => {
    assert.equal(initPuter, initOpenRouter);
    assert.equal(isPuterInitialized, isOpenRouterInitialized);
  });

  await runTest('buildRequestHeaders', () => {
    assert.equal(buildRequestHeaders('openrouter', 'sk')['HTTP-Referer'], 'https://commit-ai-cli.local');
    assert.equal(buildRequestHeaders('deepseek', 'sk')['HTTP-Referer'], undefined);
  });

  if (process.env.RUN_INTEGRATION_TESTS === '1' && process.env.DEEPSEEK_API_KEY) {
    await runTest('integration deepseek API', async () => {
      closeProvider('deepseek');
      await initAI('deepseek');
      const response = await callAI(
        [{ role: 'user', content: 'Say hi in one word' }],
        { provider: 'deepseek', model: 'deepseek-v4-flash', maxTokens: 10 }
      );
      assert.ok(response.content);
      closeProvider('deepseek');
    });
  }

  console.log(`\nAll ${passed.length} tests passed`);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});