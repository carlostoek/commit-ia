# 🤖 Commit AI CLI

Generador automático de mensajes de commit usando IA. Perfecto para trabajar en móvil con **Termux**.

## ✨ Características

- **Dos modos de operación**:
  - 🤖 **Modo no interactivo** (por defecto): Genera commits automáticamente con configuración guardada
  - 💬 **Modo interactivo** (`-i`): Menús para seleccionar Commit, PR, Historial, Estadísticas
- **Generación automática de commits** con IA (OpenRouter y DeepSeek)
- **Generación automática de PRs** para GitHub con título y descripción
- **3 estilos predefinidos de commits**:
  - Conventional Commits (`feat(scope): description`)
  - Emoji Commits (`✨ add feature`)
  - Descriptive Commits (`[FEATURE] Add feature`)
- **Múltiples modelos de IA**: GPT, Claude, Gemini, Mistral, DeepSeek, etc.
- **Configuración persistente**: Se guarda automáticamente en modo interactivo
- **Historial de commits** generados
- **Estadísticas de uso**
- **Almacenamiento local** de historial y configuración
- **Compatible con scripts** y automatización
- **Integración con GitHub**: Genera PRs con URL lista para crear
- **Soporte para Termux** en dispositivos móviles

## 📋 Requisitos

- **Node.js 22+** (o superior)
- **Git** instalado
- **API key** de OpenRouter y/o DeepSeek (ver sección Proveedores)
- **Cambios staged** en Git (`git add` antes de ejecutar)

## 🔌 Proveedores de IA

Commit AI CLI soporta dos proveedores:

| Proveedor | Modelo recomendado | Variable de entorno | Archivo local |
|-----------|-------------------|---------------------|---------------|
| **OpenRouter** (por defecto) | `openrouter/free` | `OPENROUTER_API_KEY` | `~/.commit-ai-openrouter-key` |
| **DeepSeek** | `deepseek-v4-flash` | `DEEPSEEK_API_KEY` | `~/.commit-ai-deepseek-key` |

### Configurar OpenRouter

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
# Obtén una key en: https://openrouter.ai/keys
```

### Configurar DeepSeek

```bash
export DEEPSEEK_API_KEY="sk-..."
# Obtén una key en: https://platform.deepseek.com/api_keys
```

### Seleccionar proveedor

```bash
# No interactivo
commit-ai --provider deepseek -m deepseek-v4-flash

# Interactivo (también acepta --provider como default)
commit-ai -i --provider deepseek

# Variable de entorno para proveedor por defecto
export DEFAULT_PROVIDER=deepseek
```

## 🚀 Instalación

### En Linux/Mac/Termux

```bash
# Clonar o descargar el proyecto
git clone <repository-url>
cd commit-ai-cli

# Instalar dependencias
npm install

# Hacer el comando disponible globalmente (opcional)
npm link

# O ejecutar directamente
node index.js
```

### En Termux (Móvil Android)

```bash
# Instalar Node.js si no está instalado
pkg install nodejs

# Seguir los pasos anteriores
git clone <repository-url>
cd commit-ai-cli
npm install
npm link

# Ejecutar desde cualquier repositorio Git
commit-ai
```

## 🎯 Uso

### 🤖 Modo No Interactivo (Por Defecto)

Sin flags, la CLI genera commit automáticamente usando la configuración guardada:

```bash
# En cualquier repositorio Git
commit-ai
```

Esto:
1. Lee la configuración guardada (estilo y modelo)
2. Obtiene cambios staged
3. Genera commit con IA
4. Ejecuta: `git commit`
5. ¡Listo en segundos!

**Perfecto para**: Uso rápido, automatización, scripts, CI/CD

### 💬 Modo Interactivo

Con el flag `-i` o `--interactive`, muestra menús para seleccionar opciones:

```bash
# Modo interactivo
commit-ai -i
commit-ai --interactive
```

Esto:
1. Muestra menú principal: Commit, PR, Historial, Estadísticas
2. Según selección:
   - **Commit**: Selecciona estilo, modelo, genera commit
   - **PR**: Selecciona modelo, genera contenido de PR, abre en navegador
   - **Historial**: Muestra últimos commits generados
   - **Estadísticas**: Muestra uso por estilo y modelo
3. Muestra opciones: ejecutar, editar, regenerar, cancelar
4. Guarda configuración para próximas veces

**Perfecto para**: Configuración inicial, cambiar opciones, revisar antes de commit/PR

### Ejecución Directa

```bash
# En el directorio del proyecto
node index.js
```

## 📖 Flujo de Uso Recomendado

### Primera Vez (Configuración Inicial)

```bash
# 1. Navega a tu repositorio Git
cd tu-proyecto

# 2. Realiza cambios y haz staging
git add archivo1.js archivo2.js

# 3. Ejecuta en modo interactivo para configurar
commit-ai -i

# 4. Sigue los pasos:
#    - Selecciona el estilo de commit
#    - (Opcional) Selecciona un modelo de IA
#    - Revisa el mensaje generado
#    - Elige: ejecutar, editar, regenerar, cancelar
#    - La configuración se guarda automáticamente
```

### Próximos Commits (Modo No Interactivo)

```bash
# 1. Realiza cambios
git add archivo.js

# 2. Ejecuta (sin flags)
commit-ai

# ¡Listo! Usa la configuración guardada automáticamente
```

### Cambiar Configuración

```bash
# Modo interactivo para cambiar estilo/modelo
commit-ai -i

# O especificar directamente
commit-ai -s emoji
commit-ai -m gpt-5.4
```

## 🚩 Flags y Opciones

### Modos

```bash
# Modo no interactivo COMMIT (por defecto)
commit-ai

# Modo no interactivo PR
commit-ai --pr

# Modo interactivo (menú principal)
commit-ai -i
commit-ai --interactive
```

### Opciones de Configuración

```bash
# Especificar estilo
commit-ai -s emoji
commit-ai --style conventional

# Especificar proveedor y modelo
commit-ai -p openrouter -m gpt-5.4
commit-ai --provider deepseek -m deepseek-v4-flash
commit-ai --model claude-3.5-sonnet

# Ejecutar sin confirmación
commit-ai -a
commit-ai --auto-commit

# Generar PR
commit-ai --pr

# Generar PR sin abrir navegador
commit-ai --pr --no-browser

# No pedir confirmación
commit-ai --no-confirm
```

### Información

```bash
# Ver historial
commit-ai --history

# Ver estadísticas
commit-ai --stats

# Ayuda
commit-ai -h
commit-ai --help

# Versión
commit-ai -v
commit-ai --version
```

### Desarrollo

```bash
# Modo debug (más información)
commit-ai --debug
```

## 🎨 Estilos de Commit

| Estilo | Ejemplo | Uso |
|--------|---------|-----|
| **Conventional** | `feat(auth): add login` | Proyectos profesionales |
| **Emoji** | `✨ add login feature` | Proyectos personales |
| **Descriptive** | `[FEATURE] Add login` | Documentación clara |

### Conventional Commits
```
feat(scope): description
fix(scope): description
docs: description
style: description
refactor: description
perf: description
test: description
chore: description
```

### Emoji Commits
```
✨ add feature
🐛 fix bug
📚 update docs
🎨 style changes
♻️ refactor code
⚡ improve performance
✅ add tests
🔧 chore/config
```

### Descriptive Commits
```
[FEATURE] description
[BUGFIX] description
[DOCS] description
[REFACTOR] description
[PERFORMANCE] description
[TEST] description
[CHORE] description
```

## 🤖 Modelos de IA Disponibles

### OpenRouter (por defecto)

Modelos gratuitos y de pago vía OpenRouter. También puedes usar cualquier ID de modelo soportado por OpenRouter con `-m`.

| Categoría | Ejemplos |
|-----------|----------|
| **Gratuito** | `openrouter/free` (recomendado) |
| **Rápidos** | `gpt-5.4-nano`, `gemini-2.5-flash`, `claude-3.5-haiku` |
| **Balanceados** | `gpt-5.4`, `claude-3.5-sonnet`, `gemini-2.0-flash` |
| **Potentes** | `gpt-5.2-chat`, `claude-3-opus` |

### DeepSeek

| Modelo | ID | Notas |
|--------|-----|-------|
| **DeepSeek V4 Flash** | `deepseek-v4-flash` | Rápido, recomendado para DeepSeek |

```bash
commit-ai --provider deepseek -m deepseek-v4-flash
```

## 💾 Configuración Persistente

### Cómo Funciona

1. **Primera vez**: Usas modo interactivo (`commit-ai -i`)
2. **Seleccionas**: Proveedor, estilo y modelo
3. **Se guarda**: Localmente en `~/.commit-ai-store.json`
4. **Próximas veces**: Modo no interactivo usa esos valores

### Archivos locales

| Archivo | Contenido |
|---------|-----------|
| `~/.commit-ai-store.json` | Configuración, historial y estadísticas |
| `~/.commit-ai-openrouter-key` | API key de OpenRouter (opcional) |
| `~/.commit-ai-deepseek-key` | API key de DeepSeek (opcional) |

### Cambiar Configuración

```bash
# Modo interactivo para cambiar
commit-ai -i

# O especificar directamente
commit-ai -s emoji
commit-ai -p deepseek -m deepseek-v4-flash
```

## 📚 Historial

La CLI guarda automáticamente todos los commits generados. Puedes verlos en cualquier momento:

```bash
# Ver historial
commit-ai --history

# O en modo interactivo
commit-ai -i
# Selecciona "Ver historial"
```

El historial incluye:
- Mensaje de commit
- Estilo utilizado
- Proveedor y modelo de IA usados
- Fecha y hora

## 📊 Estadísticas

Visualiza estadísticas de uso:

```bash
# Ver estadísticas
commit-ai --stats

# O en modo interactivo
commit-ai -i
# Selecciona "Ver estadísticas"
```

Incluye:
- Total de commits generados
- Distribución por estilo
- Distribución por proveedor
- Distribución por modelo
- Último uso

## 🔧 Casos de Uso

### Caso 1: Desarrollo Normal (Recomendado)

```bash
# Primera vez: configurar con modo interactivo
commit-ai -i

# Próximas veces: usar modo no interactivo
commit-ai
commit-ai
commit-ai
```

### Caso 2: Cambiar Estilo Temporalmente

```bash
# Usar emoji en este commit
commit-ai -s emoji

# Próximos commits usan estilo anterior
commit-ai
```

### Caso 3: Usar Modelo Diferente

```bash
# Usar modelo potente para este commit
commit-ai -m gpt-5.2-chat

# Próximos commits usan modelo anterior
commit-ai
```

### Caso 4: Automatización en Scripts

```bash
#!/bin/bash
# script.sh - Automatizar commits

echo "console.log('hello');" > app.js
git add app.js

# Generar commit automáticamente (sin interacción)
commit-ai

# Continuar con el script
git push origin main
```

### Caso 5: CI/CD Pipeline

```yaml
# .github/workflows/commit.yml
- name: Generate commit
  run: commit-ai --auto-commit
```

## ⚙️ Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (se carga automáticamente al iniciar):

```env
# API key de OpenRouter (proveedor por defecto)
OPENROUTER_API_KEY=sk-or-v1-...

# API key de DeepSeek
DEEPSEEK_API_KEY=sk-...

# Proveedor por defecto (openrouter, deepseek)
DEFAULT_PROVIDER=openrouter

# Modelo por defecto
DEFAULT_MODEL=openrouter/free

# Estilo por defecto (conventional, emoji, descriptive)
DEFAULT_STYLE=conventional

# Modo debug
DEBUG=false
```

También puedes exportar las variables en tu shell o guardar las API keys en los archivos locales (`~/.commit-ai-*-key`). Las variables de entorno tienen prioridad sobre los archivos locales.

### Primeros Pasos

La primera vez que ejecutes la CLI:

1. Configura al menos una API key (OpenRouter o DeepSeek)
2. Ejecuta `commit-ai -i` para elegir proveedor, estilo y modelo
3. La configuración se guarda en `~/.commit-ai-store.json`

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
# o
export DEEPSEEK_API_KEY="sk-..."

commit-ai -i
```

## 🔐 Seguridad

- Las API keys se leen desde variables de entorno o archivos locales con permisos `600`
- Los archivos de key con permisos demasiado abiertos son rechazados
- El historial y la configuración se guardan localmente en `~/.commit-ai-store.json`
- Los diffs se envían al proveedor de IA seleccionado (OpenRouter o DeepSeek) para generar mensajes
- No hardcodees API keys en el repositorio; usa `.env` (añadido a `.gitignore`) o variables de entorno

## 🐛 Solución de Problemas

### "No estás en un repositorio Git válido"
```bash
# Asegúrate de estar en un directorio con .git
cd tu-proyecto
git status
```

### "No hay cambios staged"
```bash
# Haz staging de tus cambios
git add archivo.js
# O todos los cambios
git add .
```

### "Error al conectar con OpenRouter" / "Error al conectar con DeepSeek"
- Verifica tu conexión a internet
- Comprueba que la API key esté configurada: `echo $OPENROUTER_API_KEY` o `echo $DEEPSEEK_API_KEY`
- Verifica el archivo local: `~/.commit-ai-openrouter-key` o `~/.commit-ai-deepseek-key`
- Obtén una nueva key en [openrouter.ai/keys](https://openrouter.ai/keys) o [platform.deepseek.com](https://platform.deepseek.com/api_keys)

### "El editor no se abre"
- En Termux, asegúrate de tener `nano` o `vi` instalado
- Puedes establecer `EDITOR=nano` en tu shell

### "Comando no encontrado"
```bash
# Asegúrate de haber ejecutado npm link
npm link

# O ejecuta directamente
node /ruta/completa/commit-ai-cli/index.js
```

## 📱 Uso en Termux (Móvil)

### Instalación Completa

```bash
# 1. Instalar Node.js
pkg install nodejs

# 2. Instalar Git
pkg install git

# 3. Clonar el proyecto
git clone <repository-url>
cd commit-ai-cli

# 4. Instalar dependencias
npm install

# 5. Crear enlace global
npm link

# 6. Usar desde cualquier repositorio
cd ~/storage/projects/mi-proyecto
commit-ai
```

### Tips para Termux

- **Primera vez**: Usa `commit-ai -i` para configurar proveedor y modelo
- **Próximas veces**: Solo `commit-ai` (modo no interactivo)
- Usa `openrouter/free` o `deepseek-v4-flash` para mejor rendimiento
- La configuración se guarda localmente en el dispositivo
- Puedes usar SSH para clonar repositorios
- Los commits se ejecutan normalmente con Git
- Perfecto para automatización en scripts

### Automatización en Scripts

```bash
#!/bin/bash
# script.sh - Automatizar commits

echo "console.log('hello');" > app.js
git add app.js
commit-ai  # Genera commit automáticamente
git push origin main
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [OpenRouter](https://openrouter.ai) - Acceso unificado a múltiples modelos de IA
- [DeepSeek](https://www.deepseek.com) - Modelos de IA de alto rendimiento
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - Interfaz interactiva
- [Chalk](https://github.com/chalk/chalk) - Colores en terminal
- [Simple-Git](https://github.com/steveukx/git-js) - Interfaz Git

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:

1. Abre un issue en GitHub
2. Describe el problema detalladamente
3. Incluye tu versión de Node.js y OS
4. Proporciona pasos para reproducir

## 🚀 Roadmap

- [ ] Integración con hooks de Git
- [ ] Soporte para múltiples idiomas
- [ ] Temas personalizables
- [ ] Sincronización entre dispositivos
- [ ] Análisis de cambios más inteligente
- [ ] Sugerencias de commits basadas en patrones
- [ ] Integración con GitHub/GitLab

---

**Hecho con ❤️ para desarrolladores que usan Termux en móvil**
