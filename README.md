<p align="center">
  <img src="https://raw.githubusercontent.com/hanserlodev/whatsfinance/main/docs/logo.svg" alt="WhatsFinance" width="180"/>
</p>

<h1 align="center">WhatsFinance</h1>

<p align="center">
  <strong>Control de gastos e ingresos personales vía WhatsApp + IA</strong><br>
  Sin apps, sin formularios, sin fricción. Escribes como le escribirías a un amigo y él lo organiza todo en un dashboard.
</p>

<p align="center">
  <a href="#-demo"><img src="https://img.shields.io/badge/Demo-Live-brightgreen" alt="Demo"></a>
  <a href="https://github.com/hanserlodev/whatsfinance/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License"></a>
  <a href="https://github.com/hanserlodev/whatsfinance/actions"><img src="https://img.shields.io/badge/Build-Passing-brightgreen" alt="Build"></a>
  <a href="https://github.com/hanserlodev/whatsfinance/issues"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs Welcome"></a>
  <a href="https://discord.gg/whatsfinance"><img src="https://img.shields.io/badge/Discord-Join-7289DA" alt="Discord"></a>
</p>

---

## 🎯 ¿Qué es WhatsFinance?

Las apps de control de gastos fallan porque requieren **registrar todo a mano** dentro de una app dedicada. WhatsFinance elimina ese paso:

> Le escribes a tu propio número de WhatsApp cosas como:
> - *"gasté 45 soles en almuerzo"*
> - *"me pagaron 800 de un freelance"*
> - *"no, fue 55 no 45"* (corrección)

Y el bot lo interpreta, extrae los datos y lo guarda. Un dashboard web te muestra resúmenes, gráficos por categoría y metas de ahorro.

**Open source • Self-hosted • Sin backend centralizado • Sin cuentas de terceros • Sin cobros**

---

## ✨ Características

| Característica | Descripción |
|----------------|-------------|
| 💬 **WhatsApp nativo** | Tu número, tu WhatsApp, escaneas QR y listo |
| 🤖 **IA + Fallback** | NVIDIA NIM (gratis) con fallback regex automático |
| 📊 **Dashboard local** | Next.js + Recharts, corre en tu red (localhost/LAN) |
| 💾 **SQLite embebido** | Un archivo `.db`, cero configuración, modo WAL |
| 🔧 **Extensible** | Arquitectura preparada para multi-usuario, multi-moneda, otros proveedores IA |
| 🛡️ **Privacidad total** | Tus datos nunca salen de tu máquina |

---

## 🏗️ Arquitectura

```mermaid
graph LR
    A[WhatsApp<br/>(tu número)] --> B[bot-service<br/>Node + Baileys]
    B --> C{Parser}
    C -->|NIM_API_KEY| D[NVIDIA NIM<br/>Tool Calling]
    C -->|Fallback| E[Regex Parser<br/>Español]
    D --> F[SQLite<br/>whatsfinance.db]
    E --> F
    F --> G[Dashboard<br/>Next.js 15]
```

**Componentes:**
- **`bot-service/`** — Proceso Node persistente (Baileys WebSocket 24/7), IA/Regex parser, handlers
- **`dashboard/`** — Next.js 15 App Router, Server Components, Tailwind, Recharts
- **`db/`** — Módulo compartido TypeScript, `better-sqlite3` en modo WAL

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| WhatsApp | [Baileys](https://github.com/WhiskeySockets/Baileys) | No oficial, cero fricción, QR y listo |
| IA | [NVIDIA NIM](https://build.nvidia.com/) (Llama 3.1 70B) | Gratis para devs, tool calling nativo |
| Fallback | Regex TypeScript | Siempre funciona, sin dependencias externas |
| Base de datos | SQLite + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Un archivo, WAL, cero config |
| Dashboard | Next.js 15 + React 19 + Tailwind v4 + Recharts | Moderno, performante, tipo-safe |
| Lenguaje | TypeScript (strict) | Mismo lenguaje en todo el stack |

> **¿Por qué no WhatsApp Business API oficial?** Requiere aprobación de negocio por instancia → mata adopción open source self-host. Baileys asume riesgo bajo de restricción de número (documentado).

> **⚠️ NVIDIA NIM gratis** es para prototipar, no producción sostenida. Límites de rate/tokens pueden agotarse. Por eso el **fallback regex es obligatorio** — el bot siempre funciona.

---

## 📦 Estructura del Monorepo

```
whatsfinance/
├── bot-service/              # Node + Baileys (WhatsApp)
│   ├── src/
│   │   ├── ai/               # NIM parser + Regex fallback
│   │   ├── handlers/         # Transacciones, comandos, correcciones
│   │   └── index.ts          # Entry point
│   └── .env.example
│
├── dashboard/                # Next.js 15 (App Router)
│   ├── app/
│   │   ├── dashboard/        # Resumen + gráficos
│   │   ├── transactions/     # Historial completo
│   │   └── goals/            # Metas de ahorro
│   └── lib/db.ts             # Cliente SQLite para Server Components
│
├── db/                       # Paquete compartido
│   ├── schema.sql            # users, categories, transactions, savings_goals
│   ├── client.ts             # Singleton better-sqlite3 (WAL)
│   └── seed.ts               # 11 categorías default
│
├── data/                     # gitignored - whatsfinance.db
├── docs/                     # SETUP.md, ARCHITECTURE.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE (MIT)
```

---

## 🗃️ Esquema de Base de Datos (MVP)

```sql
-- Usuarios (single-user por instancia, preparado para multi-user)
create table users (
  id integer primary key autoincrement,
  whatsapp_number text unique not null,
  created_at text default (datetime('now'))
);

-- Categorías (editables, con defaults sembrados)
create table categories (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('gasto', 'ingreso')),
  created_at text default (datetime('now'))
);

-- Transacciones
create table transactions (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  category_id integer references categories(id),
  type text not null check (type in ('gasto', 'ingreso')),
  amount real not null,
  description text,
  raw_message text,
  occurred_at text not null default (date('now')),
  created_at text default (datetime('now'))
);

-- Metas de ahorro
create table savings_goals (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  name text not null,
  target_amount real not null,
  current_amount real default 0,
  target_date text,
  created_at text default (datetime('now'))
);
```

**Categorías default (11):**
- **Gasto (8):** Comida, Transporte, Vivienda, Salud, Entretenimiento, Educación, Ropa, Otros
- **Ingreso (3):** Sueldo, Freelance, Otros ingresos

---

## 🤖 Parser: Estrategia de Dos Niveles

```
Mensaje entrante
       │
       ▼
┌──────────────────┐
│ NIM_API_KEY +    │── No / Falla / Cuota ──▶ [Regex Parser]
│ Llamada OK?      │
└────────┬─────────┘
         │ Sí
         ▼
┌──────────────────┐
│ Tool call válido?│── No ──▶ [Regex Parser]
└────────┬─────────┘
         │ Sí
         ▼
   [Guardar en DB]
```

### Nivel 1 — NVIDIA NIM (IA)
- Modelos gratuitos con function calling (Llama 3.1 70B, etc.)
- Tool `registrar_transaccion` con schema estricto
- Contexto: categorías del usuario → no inventa nuevas
- `confianza: "baja"` → pide aclaración, no guarda basura
- `es_correccion: true` → actualiza último registro

### Nivel 2 — Regex (Fallback, siempre disponible)
- Patrones: `gasté|gasto|pagué` + número + `en|de|por` + texto → **gasto**
- `me pagaron|ingresó|cobré|recibí` + número + `de|por` + texto → **ingreso**
- Números: `45`, `45.50`, `45,50`, `S/45`, `45 soles`
- Categoría: keyword matching → `Comida`, `Transporte`, etc. Default `Otros`
- Comandos especiales (siempre regex): `resumen`, `metas`, `ayuda`

---

## ⚙️ Variables de Entorno

### `bot-service/.env`
```bash
# Opcional: sin ella = solo regex (bot 100% funcional)
NIM_API_KEY=
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NIM_MODEL=meta/llama-3.1-70b-instruct

DB_PATH=../data/whatsfinance.db
WHATSAPP_SESSION_PATH=./sessions
```

### `dashboard/.env`
```bash
DB_PATH=../data/whatsfinance.db
```

> `NIM_API_KEY` es la **única variable opcional real**. Sin ella, todo funciona con regex. No necesitas crear cuentas externas.

---

## 🚀 Setup Local (MVP)

### Requisitos
- Node.js 18+ (recomendado 20+)
- npm 9+
- Git
- WhatsApp en móvil (para QR)

### Instalación

```bash
# 1. Clonar
git clone https://github.com/hanserlodev/whatsfinance.git
cd whatsfinance

# 2. Instalar dependencias (3 paquetes)
cd db && npm install && cd ..
cd bot-service && npm install && cd ..
cd dashboard && npm install && cd ..

# 3. Configurar variables
cp bot-service/.env.example bot-service/.env
cp dashboard/.env.example dashboard/.env
# Edita bot-service/.env si quieres NIM_API_KEY (opcional)
```

### Ejecución (2 terminales)

**Terminal 1 — Bot Service**
```bash
cd bot-service
npm run dev
# Escanea el QR con WhatsApp: Configuración → Dispositivos vinculados → Vincular dispositivo
# ⚠️ Usa número SECUNDARIO (Baileys no es API oficial)
```

**Terminal 2 — Dashboard**
```bash
cd dashboard
npm run dev
# Abre http://localhost:3000
# Desde móvil en misma red: http://<TU_IP_LOCAL>:3000
```

### ¡Listo! Prueba escribiendo al bot:
```
gasté 45 soles en almuerzo
me pagaron 800 de freelance
resumen
metas
```

---

## 📋 Alcance del MVP

| Feature | Estado |
|---------|--------|
| Conexión WhatsApp vía QR (Baileys) | ✅ |
| Registrar gasto/ingreso (IA + regex fallback) | ✅ |
| Confirmación automática por WhatsApp | ✅ |
| Corrección último registro ("no, fue X") | ✅ |
| Comando `resumen` → totales mes | ✅ |
| Dashboard local: transacciones, gráfico, balance | ✅ |
| Metas de ahorro: crear, ver progreso | ✅ |
| Categorías default + crear nuevas | ✅ |

**Fuera del MVP (roadmap):**
- Despliegue público (VPS, dominio, HTTPS)
- Multi-usuario / multi-tenant
- Notas de voz (transcripción)
- Reconocimiento recibos/fotos
- Multi-moneda
- Presupuestos por categoría con alertas
- Exportar Excel/CSV
- Otros proveedores IA (OpenAI, Ollama, etc.)
- Migración SQLite → Postgres

---

## ⚠️ Riesgos y Limitaciones Conocidas

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Baileys no oficial** | Posible restricción de número | Usar número secundario, documentado |
| **NIM gratis = prototipado** | Rate limits, cuota agotada | Fallback regex obligatorio (siempre funciona) |
| **Regex < IA** | Menos flexible con lenguaje libre | Cubre patrones comunes en español |
| **SQLite concurrencia** | No para multi-user alto tráfico | WAL soporta 1 escritor + lectores; migración a Postgres documentada |
| **Solo red local** | No acceso desde internet | VPN (Tailscale), túnel (ngrok), o deploy real (fuera de MVP) |
| **Single-user/instancia** | No es SaaS compartido | Cada usuario corre su instancia |

---

## 🤝 Contribuir

Proyecto diseñado para contribución **rápida y sin fricción**:

1. **Fork** + branch: `feat/mi-feature` o `fix/mi-bug`
2. **Un PR = un cambio enfocado** (evitar PRs gigantes)
3. **Tests** para features nuevas (unit en bot-service, e2e en dashboard después)
4. **Actualiza docs** si cambia la UX
5. **No hace falta permiso** para issues pequeños (typos, bugs claros) — PR directo
6. **Features grandes**: abre Issue primero para discutir enfoque

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para detalles completos.

---

## 📄 Licencia

**MIT** — úsalo, modifícalo y compártelo libremente.

Ver [`LICENSE`](LICENSE) para detalles.

---

## 🙋 Soporte y Comunidad

- **Issues**: [GitHub Issues](https://github.com/hanserlodev/whatsfinance/issues) — bugs, features, preguntas
- **Discusiones**: [GitHub Discussions](https://github.com/hanserlodev/whatsfinance/discussions) — ideas, help, show & tell
- **Seguridad**: [`SECURITY.md`](SECURITY.md) — reporta vulns en privado

---

<p align="center">
  Hecho con ❤️ para la comunidad open source<br>
  <a href="https://github.com/hanserlodev/whatsfinance">github.com/hanserlodev/whatsfinance</a>
</p>