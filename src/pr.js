import { CONFIG } from './config.js';

/**
 * Genera título y descripción de PR basado en cambios
 */
export async function generatePRContent(diff, puter, model = null) {
  try {
    const selectedModel = model || CONFIG.DEFAULT_MODEL;

    const prompt = `Analiza los siguientes cambios de Git y genera un título y descripción profesional para un Pull Request en GitHub.

Cambios:
${diff}

Genera una respuesta en este formato exacto:
TÍTULO: [título conciso del PR, máximo 60 caracteres]
DESCRIPCIÓN: [descripción detallada del PR, máximo 500 caracteres, puede incluir puntos con -]

El título debe ser descriptivo pero conciso.
La descripción debe explicar qué cambios se hacen y por qué.`;

    const response = await puter.ai.chat(prompt, {
      model: selectedModel,
      max_tokens: 300,
      temperature: 0.7
    });

    const content = response.message.content.toString().trim();

    // Parsear la respuesta
    const titleMatch = content.match(/TÍTULO:\s*(.+?)(?:\n|$)/);
    const descriptionMatch = content.match(/DESCRIPCIÓN:\s*(.+?)(?:\n|$)/s);

    const title = titleMatch ? titleMatch[1].trim() : 'New PR';
    const description = descriptionMatch ? descriptionMatch[1].trim() : 'PR description';

    return {
      title: title.substring(0, 60),
      description: description.substring(0, 500),
      fullContent: content
    };
  } catch (error) {
    throw new Error(`Error al generar contenido de PR: ${error.message}`);
  }
}

/**
 * Obtiene información del repositorio remoto
 */
export async function getRepositoryInfo(git) {
  try {
    const remotes = await git.getRemotes(true);
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

    if (!remotes || remotes.length === 0) {
      throw new Error('No hay repositorio remoto configurado');
    }

    const remote = remotes[0];
    const fetchUrl = remote.refs.fetch;

    // Parsear URL de GitHub
    const githubMatch = fetchUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    if (!githubMatch) {
      throw new Error('No es un repositorio de GitHub válido');
    }

    const owner = githubMatch[1];
    const repo = githubMatch[2];

    return {
      owner,
      repo,
      branch: branch.trim(),
      url: `https://github.com/${owner}/${repo}`,
      fetchUrl
    };
  } catch (error) {
    throw new Error(`Error al obtener información del repositorio: ${error.message}`);
  }
}

/**
 * Construye la URL del PR en GitHub
 */
export function buildPRUrl(repoInfo, title, description) {
  const baseUrl = `${repoInfo.url}/compare/main...${repoInfo.branch}`;

  const params = new URLSearchParams();
  params.append('title', title);
  params.append('body', description);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Formatea el contenido del PR para mostrar
 */
export function formatPRContent(prContent) {
  return `
╔════════════════════════════════════════════════════════════╗
║                    CONTENIDO DEL PR                        ║
╚════════════════════════════════════════════════════════════╝

TÍTULO:
${prContent.title}

DESCRIPCIÓN:
${prContent.description}

═══════════════════════════════════════════════════════════════
`;
}

/**
 * Obtiene información de cambios para el PR
 */
export async function getPRStats(git) {
  try {
    const status = await git.status();

    const stats = {
      filesChanged: status.files ? status.files.length : 0,
      staged: status.staged ? status.staged.length : 0,
      modified: status.modified ? status.modified.length : 0,
      created: status.created ? status.created.length : 0,
      deleted: status.deleted ? status.deleted.length : 0
    };

    return stats;
  } catch (error) {
    return {
      filesChanged: 0,
      staged: 0,
      modified: 0,
      created: 0,
      deleted: 0
    };
  }
}

/**
 * Valida que sea posible crear un PR
 */
export async function validatePRRequirements(git) {
  try {
    const status = await git.status();

    // Verificar que hay cambios
    if (!status.files || status.files.length === 0) {
      throw new Error('No hay cambios para crear un PR');
    }

    // Verificar que estamos en una rama diferente a main/master
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    const currentBranch = branch.trim();

    if (currentBranch === 'main' || currentBranch === 'master') {
      throw new Error(`No puedes crear un PR desde la rama ${currentBranch}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Validación de PR falló: ${error.message}`);
  }
}
