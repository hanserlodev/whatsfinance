# Arquitectura WhatsFinance (MVP)

## Diagrama general

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WhatsApp       │────▶│  bot-service     │────▶│  SQLite         │
│  (tu número)    │     │  (Node + Baileys)│     │  (whatsfinance.db)│
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                        │
                                 ▼                        │
                        ┌──────────────────┐              │
                        │  Parser IA/Regex │              │
                        │  (NIM + fallback)│              │
                        └──────────────────┘              │
                                                           │
                        ┌──────────────────┐              │
                        │  dashboard       │◀─────────────┘
                        │  (Next.js)       │
                        └──────────────────┘
```

## Componentes

### 1. bot-service (`bot-service/`)
Proceso Node persistente (no serverless) que mantiene conexión WebSocket 24/7 con WhatsApp vía Baileys.

**Responsabilidades:**
- Autenticación QR / sesión persistente (`sessions/`)
- Recibir mensajes de WhatsApp
- Parsear texto → transacción estructurada (IA NIM + fallback regex)
- Guardar en SQLite
- Responder confirmaciones / comandos (`resumen`, `metas`, `ayuda`)
- Corrección del último registro ("no, fue 55")

**Estructura:**
```
src/
├── index.ts                 # Entry point, setup Baileys, event handlers
├── whatsapp/
│   ├── client.ts           # Conexión, reconexión, QR
│   └── session.ts          # Persistencia auth state (multi-file)
├── ai/
│   ├── index.ts            # Orquestador: intenta NIM → fallback regex
│   ├── nim-parser.ts       # Llamada a NVIDIA NIM (tool calling)
│   └── regex-parser.ts     # Parser español sin IA (patrones + keywords)
└── handlers/
    ├── transaction-handler.ts  # Nuevo gasto/ingreso + corrección
    └── command-handler.ts      # resumen, metas, ayuda
```

### 2. dashboard (`dashboard/`)
App Next.js 15 (App Router) corriendo en red local. Server Components por defecto.

**Rutas:**
- `/` → redirect a `/dashboard`
- `/dashboard` → Resumen mensual, gráfico por categoría, últimas 10 transacciones
- `/transactions` → Tabla paginada (50 últimas)
- `/goals` → Metas de ahorro con barras de progreso

**Stack:**
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4 (postcss plugin)
- Recharts (gráficos)
- better-sqlite3 (lectura directa del .db compartido)

### 3. db (`db/`)
Módulo compartido TypeScript. Wrapper `better-sqlite3` en modo WAL.

**Archivos:**
- `schema.sql` → DDL (users, categories, transactions, savings_goals)
- `client.ts` → `getDb()` singleton, pragma WAL + FK ON, auto-init schema+seed
- `seed.ts` → 11 categorías default (8 gasto / 3 ingreso)
- `index.ts` → re-exports

**Esquema (MVP single-user):**
```sql
users (id, whatsapp_number, created_at)
categories (id, user_id, name, type[gasto|ingreso], created_at)
transactions (id, user_id, category_id, type, amount, description, raw_message, occurred_at, created_at)
savings_goals (id, user_id, name, target_amount, current_amount, target_date, created_at)
```

> `users` existe aunque MVP sea single-user (preparado para multi-usuario futuro). Sin FKs complejas por simplicidad SQLite.

### 4. data/
Carpeta gitignored. Contiene `whatsfinance.db` (SQLite file). Compartida por bot-service y dashboard vía `DB_PATH=../data/whatsfinance.db`.

## Parser IA + Fallback (Diseño resiliente)

```
mensaje entrante
       │
       ▼
┌──────────────────┐
│ NIM_API_KEY set? │──no──▶ [Regex Parser] ──▶ resultado
└────────┬─────────┘
         │sí
         ▼
┌──────────────────┐
│ Llamada NIM OK?  │──no/timeout/cuota──▶ [Regex Parser] ──▶ resultado
└────────┬─────────┘
         │sí
         ▼
┌──────────────────┐
│ Tool call válido?│──no──▶ [Regex Parser] ──▶ resultado
└────────┬─────────┘
         │sí
         ▼
   [Resultado IA] ──▶ guardar en DB
```

**NIVEL 1 - NVIDIA NIM (IA)**
- Modelos gratuitos (Llama 3.1 70B, etc.) con function calling
- Tool `registrar_transaccion` con schema estricto
- Contexto: categorías del usuario (para no inventar)
- `confianza: "baja"` → bot pide aclaración, no guarda
- `es_correccion: true` → actualiza último registro

**NIVEL 2 - Regex (fallback, siempre disponible)**
- Patrones: `gasté|gasto|pagué|pague` + número + `en|de|por` + texto → gasto
- `me pagaron|ingresó|ingreso|cobré|recibí` + número + `de|por` + texto → ingreso
- Números: `45`, `45.50`, `45,50`, `S/45`, `45 soles`
- Categoría: keyword matching simple → `Comida`, `Transporte`, etc. Default `Otros`
- Si no extrae monto/tipo con confianza → pide reformular

**Comandos especiales (siempre regex, nunca IA):**
`resumen`, `metas`, `ayuda`

## Variables de entorno

### bot-service/.env
```bash
NIM_API_KEY=                    # Opcional. Sin ella = solo regex
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NIM_MODEL=meta/llama-3.1-70b-instruct
DB_PATH=../data/whatsfinance.db
WHATSAPP_SESSION_PATH=./sessions
```

### dashboard/.env
```bash
DB_PATH=../data/whatsfinance.db
```

## Decisiones clave (KISS)

| Decisión | Por qué |
|----------|---------|
| SQLite vs Postgres | Un archivo, cero config, cero servidor, WAL soporta 2 procesos (bot + dashboard). Migración a Postgres documentada para multi-user futuro. |
| Baileys vs WhatsApp Business API | API oficial requiere aprobación de negocio por instancia → mata adopción open source self-host. Riesgo asumido: posible ban de número (usar secundario). |
| NIM gratuito + regex fallback | Tier gratis de NIM es para prototipar, no producción sostenida. Fallback obligatorio = bot siempre funciona. |
| Red local only (MVP) | Barrera de entrada cero: clona, `npm run dev`, escanea QR, funciona. Sin VPS, dominio, HTTPS, deploy. Documentar despliegue público aparte. |
| Dos procesos separados | Baileys necesita WS persistente 24/7 (no serverless). Next.js es app web normal. Comparten .db vía disco. |
| TypeScript en todo | Mismo lenguaje, tipos compartidos (db module), fácil contribución. |
| Sin tests en MVP | Prioridad: funcional end-to-end. Tests se añaden cuando hay uso real que justifique CI. |

## Riesgos conocidos

1. **Baileys no oficial** → WhatsApp puede restringir número. Mitigación: doc clara, usar número secundario.
2. **NIM gratis tiene límites** → Fallback regex cubre casos comunes. No es bloqueante.
3. **SQLite concurrencia** → WAL permite lecturas concurrentes durante escritura. Un usuario = un escritor (bot) + lector (dashboard) = OK. No para multi-user alto tráfico.
4. **Solo red local** → Para acceso remoto: VPN (Tailscale/ZeroTier), túnel (ngrok/cloudflare tunnel), o deploy real (fuera de scope MVP).
5. **Single-user por instancia** → Cada usuario corre su propia instancia. No es SaaS multi-tenant.

## Extensibilidad preparada

- `users` table existe (aunque MVP single-user)
- Parser IA detrás de interfaz simple → cambiar proveedor (OpenAI, Ollama, etc.) sin tocar handlers
- Categorías editables por usuario (no hardcoded)
- `savings_goals` table lista para UI futura
- Monorepo simple → fácil añadir paquetes (ej. `shared-types`, `api-client`)

---

*Ver [ROADMAP.md](../ROADMAP.md) para próximos hitos.*