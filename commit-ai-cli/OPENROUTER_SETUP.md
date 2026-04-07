# ✅ Configuración Completada

Tu API key de OpenRouter ya está configurada y lista para usar.

## 🚀 Uso Inmediato

Desde cualquier directorio, ejecuta:

```bash
commit-ai
```

O en modo interactivo:

```bash
commit-ai --interactive
```

## 📍 Ubicación de la API Key

La API key está guardada en: `~/.commit-ai-openrouter-key`

## 🆓 Modelo Usado

- **Modelo**: `openrouter/free` (router automático gratuito)
- **Proveedores disponibles**: MiniMax, Nvidia Nemotron, Llama, Gemma, y más
- **Costo**: $0 (completamente gratuito)
- **Límites**: ~20 requests/día sin créditos comprados

## 🔄 Si necesitas cambiar la API Key

Edita el archivo directamente:

```bash
nano ~/.commit-ai-openrouter-key
```

O reemplázalo:

```bash
echo "sk-or-v1-nueva-api-key-aqui" > ~/.commit-ai-openrouter-key
chmod 600 ~/.commit-ai-openrouter-key
```

## 🛠️ Solución de Problemas

### Si muestra "No se encontró API key"

Verifica que el archivo exista:

```bash
ls -la ~/.commit-ai-openrouter-key
```

Si no existe, créalo:

```bash
echo "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" > ~/.commit-ai-openrouter-key
chmod 600 ~/.commit-ai-openrouter-key
```

### Límites de uso

Si ves errores de rate limit, espera un momento y vuelve a intentar. Los modelos gratuitos tienen límites, pero son suficientes para uso normal.

---

**¡Todo listo!** La CLI está configurada y funcionando. 🎉
