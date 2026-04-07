# 📱 Guía de Instalación para Termux

Esta guía te ayudará a instalar y configurar **Commit AI CLI** en tu dispositivo Android usando Termux.

## 📋 Requisitos Previos

- **Android 7.0+** (Termux funciona en versiones anteriores, pero se recomienda 7.0+)
- **Termux** instalado desde [F-Droid](https://f-droid.org/en/packages/com.termux/) o [Google Play](https://play.google.com/store/apps/details?id=com.termux)
- **Conexión a Internet** (para descargar dependencias)

## 🔧 Instalación Paso a Paso

### Paso 1: Actualizar Termux

```bash
pkg update
pkg upgrade
```

Presiona `y` cuando se te pida confirmación.

### Paso 2: Instalar Node.js

```bash
pkg install nodejs
```

Verifica la instalación:
```bash
node -v
npm -v
```

Deberías ver versiones de Node.js 24+ y npm.

### Paso 3: Instalar Git

```bash
pkg install git
```

Verifica:
```bash
git --version
```

### Paso 4: (Opcional) Instalar Editor de Texto

Para poder editar mensajes de commit en la CLI:

```bash
pkg install nano
```

O si prefieres `vi`:
```bash
pkg install vim
```

### Paso 5: Clonar el Proyecto

Elige una ubicación para guardar el proyecto:

```bash
# Opción 1: En el almacenamiento compartido (recomendado)
cd ~/storage/downloads
git clone <repository-url>
cd commit-ai-cli

# Opción 2: En el directorio home
cd ~
git clone <repository-url>
cd commit-ai-cli
```

### Paso 6: Instalar Dependencias

```bash
npm install
```

Esto puede tardar 1-2 minutos. Espera a que termine.

### Paso 7: Crear Enlace Global (Opcional pero Recomendado)

```bash
npm link
```

Esto te permite ejecutar `commit-ai` desde cualquier directorio.

## ✅ Verificación de Instalación

```bash
# Si creaste el enlace global
commit-ai --version

# O ejecuta directamente
node /ruta/a/commit-ai-cli/index.js
```

## 🚀 Primer Uso

### 1. Navega a un Repositorio Git

```bash
# Ejemplo: Si tienes un proyecto en almacenamiento compartido
cd ~/storage/shared/mi-proyecto

# O clona un repositorio
git clone https://github.com/usuario/proyecto.git
cd proyecto
```

### 2. Realiza Cambios y Haz Staging

```bash
# Edita tus archivos (usando un editor de texto en Termux)
nano archivo.js

# Haz staging de los cambios
git add archivo.js

# O todos los cambios
git add .
```

### 3. Ejecuta Commit AI

```bash
commit-ai
```

### 4. Sigue las Instrucciones Interactivas

- Selecciona el estilo de commit
- Revisa el mensaje generado
- Elige si ejecutar, editar o regenerar
- ¡Listo! Tu commit está hecho

## 🌐 Configuración de Puter

### Primera Ejecución

La primera vez que ejecutes `commit-ai`:

1. Se abrirá tu navegador automáticamente
2. Serás redirigido a `puter.com`
3. Inicia sesión (o crea una cuenta si no tienes)
4. Autoriza el acceso a la CLI
5. Vuelve a Termux - la CLI continuará automáticamente

### Autenticación Persistente

Después de la primera autenticación:
- El token se guarda localmente
- No necesitarás autenticarte nuevamente
- Los datos se sincronizan automáticamente

## 📁 Estructura de Directorios

Después de la instalación, tu estructura será:

```
~/storage/downloads/commit-ai-cli/
├── index.js              # Punto de entrada
├── package.json          # Dependencias
├── README.md             # Documentación
├── INSTALL.md            # Esta guía
├── .env.example          # Configuración de ejemplo
└── src/
    ├── config.js         # Configuración
    ├── git.js            # Utilidades Git
    ├── ai.js             # Integración Puter
    ├── storage.js        # Almacenamiento
    └── interactive.js    # Interfaz interactiva
```

## 🎯 Casos de Uso Comunes

### Caso 1: Trabajar en un Proyecto Local

```bash
# 1. Navega al proyecto
cd ~/storage/shared/mi-proyecto

# 2. Realiza cambios
nano archivo.js

# 3. Haz staging
git add archivo.js

# 4. Genera commit
commit-ai
```

### Caso 2: Contribuir a un Proyecto en GitHub

```bash
# 1. Clona el repositorio
cd ~/storage/downloads
git clone https://github.com/usuario/proyecto.git
cd proyecto

# 2. Crea una rama
git checkout -b feature/mi-feature

# 3. Realiza cambios
nano archivo.js

# 4. Haz staging
git add archivo.js

# 5. Genera commit
commit-ai

# 6. Push
git push origin feature/mi-feature
```

### Caso 3: Múltiples Commits

```bash
# Puedes generar varios commits seguidos
commit-ai
# Después del primer commit, te preguntará si deseas generar otro
# Responde "sí" para continuar
```

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` en el directorio del proyecto:

```bash
nano ~/.bashrc
```

Añade al final:

```bash
# Configuración de Commit AI
export DEFAULT_MODEL="gpt-5.4-nano"  # Modelo rápido para móvil
export DEFAULT_STYLE="emoji"         # Estilo por defecto
export DEBUG="false"
```

Luego recarga:
```bash
source ~/.bashrc
```

### Cambiar el Editor por Defecto

Si quieres usar un editor diferente:

```bash
# Para nano (recomendado en Termux)
export EDITOR=nano

# Para vi
export EDITOR=vi

# Para vim
export EDITOR=vim
```

## 🐛 Solución de Problemas

### Problema: "command not found: commit-ai"

**Solución:**
```bash
# Asegúrate de haber ejecutado npm link
npm link

# O ejecuta directamente
node /ruta/completa/commit-ai-cli/index.js
```

### Problema: "No estás en un repositorio Git válido"

**Solución:**
```bash
# Verifica que estés en un directorio con .git
ls -la | grep git

# Si no existe, inicializa Git
git init
```

### Problema: "No hay cambios staged"

**Solución:**
```bash
# Haz staging de tus cambios
git add archivo.js

# O todos
git add .

# Verifica
git status
```

### Problema: El navegador no se abre

**Solución:**
```bash
# Instala un navegador si no tienes
pkg install firefox

# O usa curl para autenticación manual
# Sigue las instrucciones en pantalla
```

### Problema: "npm: command not found"

**Solución:**
```bash
# Reinstala Node.js
pkg remove nodejs
pkg install nodejs

# Verifica
npm -v
```

### Problema: Errores de permisos

**Solución:**
```bash
# Asegúrate de tener permisos en el directorio
chmod -R 755 ~/storage/downloads/commit-ai-cli

# O usa sudo (si está disponible)
sudo npm install
```

## 📱 Tips para Termux

1. **Usa Modelos Rápidos**: Selecciona GPT-5.4 Nano para mejor rendimiento
2. **Almacenamiento**: Guarda tus proyectos en `~/storage/shared` para acceso fácil
3. **Conexión**: Asegúrate de tener buena conexión a internet
4. **Batería**: Usa modelos rápidos para ahorrar batería
5. **Pantalla**: Mantén la pantalla encendida durante la generación de commits

## 🔄 Actualizar la CLI

```bash
# Navega al directorio
cd ~/storage/downloads/commit-ai-cli

# Obtén las últimas actualizaciones
git pull origin main

# Reinstala dependencias si es necesario
npm install
```

## 🗑️ Desinstalar

```bash
# Elimina el enlace global
npm unlink

# Elimina el directorio
rm -rf ~/storage/downloads/commit-ai-cli

# (Opcional) Desinstala Node.js si no lo necesitas
pkg remove nodejs
```

## 📞 Soporte

Si tienes problemas específicos de Termux:

1. **Verifica la versión de Termux**: `echo $TERMUX_VERSION`
2. **Actualiza todo**: `pkg update && pkg upgrade`
3. **Limpia caché**: `pkg clean`
4. **Reporta el problema** con:
   - Versión de Termux
   - Versión de Node.js
   - Versión de Android
   - Mensaje de error completo

## 🎉 ¡Listo!

Ya tienes Commit AI CLI instalado y funcionando en tu Termux. 

**Próximos pasos:**
- Lee el [README.md](README.md) para más información
- Explora los diferentes estilos de commit
- Prueba diferentes modelos de IA
- ¡Disfruta generando commits automáticamente!

---

**Nota:** Este proyecto está optimizado para Termux en Android. Si encuentras problemas específicos de tu dispositivo, asegúrate de tener las últimas actualizaciones de Termux y Android.
