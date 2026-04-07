# 🚀 Inicio Rápido

## Dos Modos de Uso

### 🤖 Modo No Interactivo (Por Defecto)

**Ideal para**: Automatización, scripts, uso rápido

```bash
# Sin flags - genera commit automáticamente
commit-ai

# Generar PR automáticamente
commit-ai --pr
```

Esto:
1. Lee la configuración guardada
2. Obtiene cambios staged
3. Genera commit/PR con IA
4. Ejecuta: `git commit` o abre PR en navegador
5. Listo en segundos ⚡

### 💬 Modo Interactivo

**Ideal para**: Seleccionar opciones, cambiar estilo/modelo

```bash
# Con flag -i o --interactive
commit-ai -i
```

Esto:
1. Muestra menú: Commit, PR, Historial, Estadísticas
2. Según selección, muestra opciones correspondientes
3. Genera contenido con IA
4. Muestra opciones: ejecutar, editar, regenerar, cancelar
5. Guarda configuración para próximas veces

## Para Usuarios Nuevos

### En 5 Minutos

```bash
# 1. Descargar y navegar
git clone <repository-url>
cd commit-ai-cli

# 2. Instalar
npm install
npm link

# 3. Primer uso (modo interactivo para configurar)
cd tu-proyecto
git add archivo.js
commit-ai -i

# 4. Próximos usos (modo no interactivo)
git add otro-archivo.js
commit-ai
```

## Para Termux (Móvil)

### Instalación Rápida

```bash
# 1. Actualizar Termux
pkg update && pkg upgrade

# 2. Instalar Node.js y Git
pkg install nodejs git

# 3. Clonar y instalar
git clone <repository-url>
cd commit-ai-cli
npm install
npm link

# 4. Usar
commit-ai
```

## Primer Commit

### Primera Vez (Modo Interactivo - Recomendado)

```bash
# 1. Navega a tu proyecto Git
cd tu-proyecto

# 2. Haz cambios y staging
git add archivo.js

# 3. Ejecuta en modo interactivo
commit-ai -i

# 4. Sigue el menú:
# - Selecciona: Commit o PR
# - Si Commit: selecciona estilo y modelo
# - Si PR: selecciona modelo
# - Muestra contenido generado
# - Elige: ejecutar, editar, regenerar, cancelar
```

### Próximos Commits (Modo No Interactivo)

```bash
# 1. Haz cambios
git add archivo.js

# 2. Ejecuta (sin flags)
commit-ai

# ¡Listo! Commit hecho automáticamente
```

## Estilos Disponibles

| Estilo | Ejemplo | Uso |
|--------|---------|-----|
| **Conventional** | `feat(auth): add login` | Proyectos profesionales |
| **Emoji** | `✨ add login feature` | Proyectos personales |
| **Descriptive** | `[FEATURE] Add login` | Documentación clara |

## Modelos de IA

- **Rápido**: GPT-5.4 Nano (recomendado para Termux)
- **Balanceado**: GPT-5.4, Claude 3.5 Sonnet
- **Potente**: GPT-5.2 Chat, Claude 3 Opus

## Flags Disponibles

```bash
# Modos
-i, --interactive         Modo interactivo

# Opciones
-s, --style <estilo>      Especificar estilo
-m, --model <modelo>      Especificar modelo
-a, --auto-commit         Ejecutar sin confirmación
--pr                      Generar PR
--no-browser              No abrir navegador para PR
--no-confirm              No pedir confirmación

# Información
--history                 Ver historial
--stats                   Ver estadísticas
-h, --help                Mostrar ayuda
-v, --version             Mostrar versión
```

## Casos de Uso

### Caso 1: Desarrollo Normal (Recomendado)

```bash
# Primera vez: configurar con modo interactivo
commit-ai -i

# Próximas veces: usar modo no interactivo
commit-ai
commit-ai
commit-ai
```

### Caso 2: Generar PR

```bash
# Modo interactivo
commit-ai -i
# Selecciona: PR

# O modo no interactivo
commit-ai --pr
```

### Caso 3: Cambiar Estilo Temporalmente

```bash
# Usar emoji en este commit
commit-ai -s emoji

# Próximos commits usan estilo anterior
commit-ai
```

### Caso 4: Automatización en Scripts

```bash
#!/bin/bash
# script.sh

# Hacer cambios
echo "console.log('hello');" > app.js

# Hacer staging
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

## Configuración Persistente

### Cómo Funciona

1. **Primera vez**: Usas modo interactivo (`commit-ai -i`)
2. **Seleccionas**: Estilo y modelo
3. **Se guarda**: Automáticamente en tu cuenta Puter
4. **Próximas veces**: Modo no interactivo usa esos valores

### Cambiar Configuración

```bash
# Modo interactivo para cambiar
commit-ai -i

# O especificar directamente
commit-ai -s emoji -m claude-3.5-sonnet
```

## Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| "No hay cambios staged" | Ejecuta `git add archivo.js` primero |
| "No es un repo Git" | Ejecuta `git init` o navega a un repo existente |
| "Comando no encontrado" | Ejecuta `npm link` nuevamente |
| "Error de conexión" | Verifica tu conexión a internet |
| "Quiero cambiar estilo" | Usa `commit-ai -i` o `commit-ai -s nuevo-estilo` |
| "Menú de inicio aparece" | Asegúrate de haber actualizado a la última versión |

## Comandos Útiles

```bash
# Ver historial de últimos commits generados
commit-ai --history

# Ver estadísticas de uso
commit-ai --stats

# Ver ayuda completa
commit-ai --help

# Desinstalar
npm unlink
rm -rf commit-ai-cli
```

## Próximos Pasos

- Lee [README.md](README.md) para documentación completa
- Lee [INSTALL.md](INSTALL.md) para instalación detallada
- Prueba los diferentes estilos
- Personaliza tu configuración

---

**¿Necesitas ayuda?** Ejecuta `commit-ai --help` o consulta la documentación completa.
