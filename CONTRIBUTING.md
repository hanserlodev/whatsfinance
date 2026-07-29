# Guía de Contribución

¡Gracias por querer contribuir a WhatsFinance! 🎉

## Cómo contribuir

### Reportar bugs
1. Busca en [Issues](../../issues) si ya existe
2. Si no, abre uno nuevo con:
   - Qué esperabas que pasara
   - Qué pasó realmente
   - Pasos para reproducir
   - Capturas de pantalla si aplica
   - Tu entorno (OS, Node version, etc.)

### Sugerir features
1. Abre un Issue tipo "Feature Request"
2. Explica el problema que resuelve
3. Propón una solución (o varias)
4. Discutimos el enfoque antes de codear

### Pull Requests
1. Fork del repo
2. Crea branch: `feat/mi-feature` o `fix/mi-bug`
3. Commits atómicos y claros (ver [Conventional Commits](https://www.conventionalcommits.org/))
4. Tests si agregas funcionalidad nueva
5. Actualiza README/docs si cambia la UX
6. PR con descripción clara

## Estándares de código

- **TypeScript strict mode** en todo el proyecto
- **ESLint + Prettier** (config en cada package)
- **Nombres claros** > abreviaciones
- **Funciones pequeñas** (max ~30 líneas)
- **Comentarios solo para "por qué", no "qué"**

## Flujo de trabajo

```bash
# 1. Clona tu fork
git clone https://github.com/TU-USUARIO/whatsfinance.git
cd whatsfinance

# 2. Instala deps
cd db && npm install
cd ../bot-service && npm install
cd ../dashboard && npm install

# 3. Crea branch
git checkout -b feat/mi-feature

# 4. Codea y testea
cd bot-service && npm run build
cd ../dashboard && npm run build

# 5. Commit y push
git add .
git commit -m "feat: descripción clara"
git push origin feat/mi-feature

# 6. Abre PR en GitHub
```

## Reglas de oro

- **Un PR = un cambio enfocado** (no mezclar refactor + feature + bugfix)
- **No rompas el build** (CI debe pasar)
- **Respeta la filosofía KISS** del proyecto (ver README)
- **Tests para features nuevas** (unit en bot-service, e2e en dashboard después)

## ¿Dudas?

Abre un Issue con label `question` o comenta en el PR. La comunidad ayuda.
