# Setup Local (MVP)

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+
- Git
- WhatsApp en tu móvil (para escanear QR)

## 1. Clonar e instalar

```bash
git clone https://github.com/<tu-usuario>/whatsfinance.git
cd whatsfinance

# Instalar dependencias de todos los paquetes
cd db && npm install && cd ..
cd bot-service && npm install && cd ..
cd dashboard && npm install && cd ..
```

## 2. Configurar variables de entorno

### Bot Service

```bash
cd bot-service
cp .env.example .env
# Edita .env si quieres usar NVIDIA NIM (opcional)
# NIM_API_KEY=tu_key_aqui
# El resto ya tiene defaults razonables
```

### Dashboard

```bash
cd dashboard
cp .env.example .env
# DB_PATH ya apunta a ../data/whatsfinance.db (compartido con bot)
```

## 3. Levantar servicios

### Terminal 1: Bot Service

```bash
cd bot-service
npm run dev
```

Verás un código QR en la terminal. Escanéalo con WhatsApp (Configuración → Dispositivos vinculados → Vincular dispositivo).

> **Importante**: Usa un número secundario. Baileys no es API oficial y existe riesgo bajo de restricción.

### Terminal 2: Dashboard

```bash
cd dashboard
npm run dev
```

Abre http://localhost:3000 (o http://TU_IP_LOCAL:3000 desde el móvil en la misma red).

## 4. ¡Listo!

Escribe al bot:
- `gasté 45 soles en almuerzo`
- `me pagaron 800 de freelance`
- `resumen`
- `metas`

El dashboard mostrará gráficos, historial y metas.

---

## Estructura de datos

La BD se crea automáticamente en `data/whatsfinance.db` al arrancar el bot por primera vez (schema + seed de categorías).

---

## Troubleshooting

### "Could not locate bindings file" (better-sqlite3)
```bash
cd dashboard && npm install-scripts approve better-sqlite3 && npm rebuild better-sqlite3
cd ../bot-service && npm install-scripts approve better-sqlite3 && npm rebuild better-sqlite3
```

### QR no aparece / conexión falla
- Borra `bot-service/sessions/` y reinicia
- Verifica Node.js versión (18+)
- Red local: firewall puede bloquear WebSocket

### Dashboard no carga datos
- Verifica que `DB_PATH` en ambos `.env` apunte al mismo archivo
- El bot debe haber creado las tablas (primer arranque)

### NIM API key no funciona
- El bot cae automáticamente al parser regex (funciona sin IA)
- Verifica cuota en https://build.nvidia.com/
- Modelos gratuitos tienen rate limits estrictos

---

## Desarrollo

```bash
# Bot: watch mode
cd bot-service && npm run dev

# Dashboard: hot reload
cd dashboard && npm run dev

# TypeScript check
cd bot-service && npm run build
cd ../dashboard && npm run build
```

---

## Próximos pasos (post-MVP)

Ver [ROADMAP.md](../ROADMAP.md) o issues del repo.