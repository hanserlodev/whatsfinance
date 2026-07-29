# WhatsFinance 💸

> Control de gastos e ingresos personales, gestionado 100% por chat de WhatsApp + IA. Sin apps, sin formularios, sin fricción. Le escribes como le escribirías a un amigo y él lo organiza todo en un dashboard.

Proyecto open source, self-hosted, pensado para que cualquiera lo levante en su propia máquina/servidor con sus propias API keys. Sin backend centralizado, sin cuentas de terceros, sin cobros.

---

## 🎯 La idea

Las apps de control de gastos fallan porque requieren que el usuario **registre todo a mano** dentro de una app dedicada. WhatsFinance elimina ese paso: le escribes a un número de WhatsApp (el tuyo propio, conectado por ti) cosas como:

```
Tú: gasté 45 soles en almuerzo
Bot: ✅ Registrado: S/ 45.00 — Comida — hoy

Tú: me pagaron 800 de un freelance
Bot: ✅ Registrado: S/ 800.00 (ingreso) — Freelance — hoy

Tú: no, fue 55 no 45
Bot: ✏️ Corregido: S/ 55.00 — Comida — hoy
```

Un modelo de IA interpreta el mensaje, extrae monto/categoría/tipo/fecha, y lo guarda en la base de datos. Un dashboard web te muestra el resumen, gráficos por categoría, y tus metas de ahorro.

---

## 🧘 Filosofía: KISS

Este proyecto prioriza **tener un MVP funcional y simple hoy** por encima de una arquitectura "perfecta" desde el día 1. Reglas que guían cada decisión técnica del repo:

- **Menos piezas móviles > más piezas "correctas".** Un archivo SQLite en vez de un Postgres gestionado; un fallback por regex en vez de depender 100% de un servicio de IA externo; red local en vez de deploy en la nube. Si algo se puede resolver simple, se resuelve simple, aunque no sea la solución "ideal" a largo plazo.
- **Que funcione, aunque sea lento.** El objetivo del MVP es que cualquiera lo clone y en minutos tenga el flujo completo (WhatsApp → registro → dashboard) funcionando de punta a punta. La performance y la escala se optimizan después, cuando haya uso real que lo justifique — optimizar antes de tiempo es la trampa clásica que mata proyectos open source antes de que arranquen.
- **Cero dependencias externas obligatorias.** No hace falta crear cuenta en ningún servicio de terceros para correr el proyecto. `NIM_API_KEY` es la única excepción, y es opcional.
- **Todo queda preparado para escalar, sin escalar de más ahora.** Por ejemplo, la tabla `users` ya existe aunque el MVP sea single-user, y el parser de IA vive detrás de una interfaz simple para poder cambiar de proveedor el día que haga falta. Se deja la puerta abierta sin construir la casa entera hoy.
- **El código debe ser fácil de leer para que la comunidad contribuya rápido.** Módulos pequeños, nombres claros, sin abstracciones prematuras. Preferir un archivo de 100 líneas legible sobre un framework interno "elegante" que solo el autor original entiende.

---

## 🧱 Arquitectura

```
WhatsApp (tu número) ─┐
                       ▼
              [ bot-service ]  ← proceso Node persistente (Baileys), corre en tu red local
                       │
                       ▼
         [ Parser: NVIDIA NIM (IA) o Regex (fallback) ]  ← extrae datos del mensaje
                       │
                       ▼
                 [ SQLite ]  ← un solo archivo .db, embebido, sin servidor aparte
                       │
                       ▼
        [ dashboard (Next.js) ]  ← corre en red local, gráficos, metas, historial
```

**Por qué SQLite en vez de Supabase/Postgres:**
KISS. Para un MVP de un solo usuario corriendo en su propia red local, levantar un proyecto Postgres externo (aunque sea gratis) agrega una dependencia de red, una cuenta más que crear, y complejidad que no se necesita todavía. SQLite es un solo archivo (`whatsfinance.db`), no requiere servidor, no requiere internet, y tanto `bot-service` como `dashboard` lo leen/escriben directo desde disco. Si el proyecto escala a multi-usuario o necesita acceso remoto concurrente más adelante, ahí sí tiene sentido migrar a Postgres — no antes.

**Por qué todo corre en red local por ahora:**
El MVP está pensado para levantarse en tu propia máquina/red doméstica (localhost o IP local, tipo `192.168.x.x`) — sin necesidad de VPS, dominios ni deploys en la nube. Esto baja la barrera de entrada a cero: cualquiera lo clona, lo prende en su PC/Raspberry Pi, y ya. Cuando el proyecto tenga más tracción y la comunidad quiera invertir en un despliegue público (VPS, dominio, HTTPS, multi-usuario), se documentará esa ruta aparte — no es prioridad del MVP.

**Por qué dos servicios separados (`bot-service` y `dashboard`):**
Baileys mantiene una conexión WebSocket viva 24/7 con WhatsApp, así que necesita un proceso Node corriendo todo el tiempo (no serverless). El dashboard es una app Next.js normal que también puedes correr en modo `dev` o `build + start` en la misma red local, apuntando al mismo archivo SQLite.

---

## 🛠️ Stack

| Parte | Tecnología | Por qué |
|---|---|---|
| Conexión WhatsApp | [Baileys](https://github.com/WhiskeySockets/Baileys) | No oficial pero cero fricción: escaneas QR y ya. Ideal para uso personal self-hosted. |
| IA / extracción de datos | [NVIDIA NIM](https://build.nvidia.com/) (modelos gratuitos, ej. Llama 3.1/3.3) con tool calling | API gratuita para desarrolladores, no requiere tarjeta. Ver advertencia abajo. |
| Fallback sin IA | Parser por regex | Si no hay API key de NIM configurada, el bot igual funciona reconociendo patrones básicos ("gasté X en Y", "me pagaron X de Y") |
| Base de datos | SQLite ([better-sqlite3](https://github.com/WiseLibs/better-sqlite3)) | Un solo archivo local, cero configuración, cero servicios externos. KISS. |
| Dashboard | Next.js + Tailwind + Recharts | Corre en red local (`localhost` o IP LAN) en el MVP |
| Bot service | Node.js (TypeScript) | Mismo lenguaje en todo el stack |

> **Nota Baileys:** se eligió en vez de la WhatsApp Business API oficial de Meta a propósito. La API oficial requiere aprobación de negocio por cada instancia — eso mata la adopción de un proyecto open source pensado para self-host individual. Riesgo asumido: posibilidad de restricción de número por parte de WhatsApp; se documenta en la sección de Riesgos.

> **⚠️ Advertencia sobre NVIDIA NIM:** el tier gratuito de NIM está pensado para **desarrolladores probando/prototipando**, no para uso productivo sostenido. Tiene límites de rate y de consumo de tokens que pueden agotarse o cambiar sin aviso, y el acceso gratuito no está garantizado a largo plazo. Por eso el proyecto **no depende exclusivamente de la IA**: si no hay `NIM_API_KEY` configurada, o si la llamada falla/se agota la cuota, el bot cae automáticamente al **parser por regex** (sección siguiente) para seguir funcionando sin interrupciones, aunque con reconocimiento más limitado (menos flexible con lenguaje natural ambiguo).

---

## 📦 Estructura del repo (monorepo simple)

```
whatsfinance/
├── bot-service/              # Proceso Node que conecta WhatsApp + IA + DB
│   ├── src/
│   │   ├── whatsapp/         # Conexión Baileys, manejo de sesión/QR
│   │   ├── ai/               # Parser IA (NIM) + parser regex (fallback)
│   │   ├── handlers/          # Lógica: nuevo registro, corrección, consulta
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
│
├── dashboard/                # App web Next.js
│   ├── app/
│   │   ├── dashboard/         # Resumen, gráficos
│   │   ├── goals/              # Metas de ahorro
│   │   └── transactions/       # Historial + edición manual
│   ├── .env.example
│   └── package.json
│
├── db/                        # Módulo compartido de acceso a SQLite
│   ├── schema.sql             # Definición de tablas (versionado simple)
│   ├── client.ts               # Wrapper de better-sqlite3, usado por bot-service y dashboard
│   └── seed.ts                 # Categorías default al primer arranque
│
├── data/
│   └── whatsfinance.db        # el archivo de base de datos en sí (gitignored)
│
├── docs/
│   ├── SETUP.md
│   └── ARCHITECTURE.md
│
├── CONTRIBUTING.md
├── LICENSE                   # MIT
└── README.md                 # este archivo
```

---

## 🗃️ Schema de base de datos (MVP)

SQLite puro, en `db/schema.sql`. Como es un solo usuario por instancia, se simplifica dejando la tabla `users` como referencia mínima (útil si más adelante se agrega multi-usuario) sin llaves foráneas complejas ni extensiones.

```sql
-- usuarios (single-user por instancia en el MVP, pero se deja preparado)
create table if not exists users (
  id integer primary key autoincrement,
  whatsapp_number text unique not null,
  created_at text default (datetime('now'))
);

-- categorías (con defaults sembrados, editables por el usuario)
create table if not exists categories (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('gasto', 'ingreso')),
  created_at text default (datetime('now'))
);

-- transacciones
create table if not exists transactions (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  category_id integer references categories(id),
  type text not null check (type in ('gasto', 'ingreso')),
  amount real not null,
  description text,
  raw_message text,              -- mensaje original de WhatsApp, para trazabilidad
  occurred_at text not null default (date('now')),
  created_at text default (datetime('now'))
);

-- metas de ahorro
create table if not exists savings_goals (
  id integer primary key autoincrement,
  user_id integer references users(id) on delete cascade,
  name text not null,
  target_amount real not null,
  current_amount real default 0,
  target_date text,
  created_at text default (datetime('now'))
);
```

El módulo `db/client.ts` abre la conexión con `better-sqlite3` en modo **WAL** (`PRAGMA journal_mode = WAL`), que permite lecturas concurrentes mientras un proceso escribe — necesario porque `bot-service` y `dashboard` son dos procesos Node distintos accediendo al mismo archivo `.db`. Al arrancar, si el archivo no existe, se crea automáticamente corriendo `schema.sql` + `seed.ts` (categorías default).

Categorías default a sembrar en el primer arranque: `Comida`, `Transporte`, `Vivienda`, `Salud`, `Entretenimiento`, `Educación`, `Ropa`, `Otros` (gasto) / `Sueldo`, `Freelance`, `Otros ingresos` (ingreso).

---

## 🤖 Lógica del parser: NIM (IA) con fallback a Regex

El bot usa una **estrategia de dos niveles**, para no depender 100% de un servicio de IA gratuito que puede tener límites o caerse:

```
mensaje entrante
      │
      ▼
¿hay NIM_API_KEY configurada y la llamada responde OK?
   │                                  │
  sí                                  no / falla / sin cuota
   ▼                                  ▼
[ parser IA (NVIDIA NIM) ]     [ parser Regex (fallback) ]
   │                                  │
   └──────────────┬───────────────────┘
                   ▼
         mismo formato de salida → guardar en DB
```

### Nivel 1 — Parser IA (NVIDIA NIM)

El bot llama a la API de NIM (compatible con el formato OpenAI-style de chat completions) usando un modelo gratuito con tool/function calling (ej. Llama 3.1 70B Instruct u otro disponible en el catálogo de NIM). Tool definido así (esquema conceptual, ajustar en implementación):

```json
{
  "name": "registrar_transaccion",
  "description": "Extrae los datos de una transacción financiera de un mensaje en lenguaje natural",
  "input_schema": {
    "type": "object",
    "properties": {
      "tipo": { "type": "string", "enum": ["gasto", "ingreso"] },
      "monto": { "type": "number" },
      "categoria": { "type": "string" },
      "descripcion": { "type": "string" },
      "es_correccion": { "type": "boolean", "description": "true si el usuario está corrigiendo el último registro" },
      "confianza": { "type": "string", "enum": ["alta", "media", "baja"] }
    },
    "required": ["tipo", "monto", "categoria", "confianza"]
  }
}
```

Reglas de manejo:
- **`confianza: "baja"`** → el bot responde pidiendo aclaración en vez de guardar directo (evita registros basura).
- **`es_correccion: true`** → actualiza el último registro del usuario en vez de crear uno nuevo.
- Contexto enviado al modelo: lista de categorías existentes del usuario (para que reutilice, no invente nuevas cada vez).

### Nivel 2 — Parser Regex (fallback, sin IA)

Si no hay `NIM_API_KEY` en el `.env`, o la llamada a NIM falla (timeout, rate limit, cuota agotada), el bot usa un parser basado en expresiones regulares y palabras clave. No entiende lenguaje tan libre como la IA, pero cubre los patrones más comunes en español:

- `gasté|gasto|pagué|pague` + número + (`en|de|por`) + texto → gasto
- `me pagaron|ingresó|ingreso|cobré|cobre|recibí` + número + (`de|por`) + texto → ingreso
- Números: soporta formatos `45`, `45.50`, `45,50`, `S/45`, `45 soles`
- Categoría: matching simple contra palabras clave por categoría (ej. "almuerzo", "comida", "menú" → `Comida`); si no matchea ninguna, cae en `Otros`
- Si el regex no logra extraer monto o tipo con confianza razonable, el bot responde pidiendo que se reformule el mensaje (ej. "Gasté [monto] en [categoría]")

Este parser vive en `bot-service/src/ai/regex-parser.ts` como módulo independiente, para que la comunidad lo pueda ir mejorando con más patrones sin tocar la integración de NIM.

### Comandos especiales (siempre por regex, nunca por IA)

`resumen`, `metas`, `ayuda` — no consumen tokens, se resuelven directo con lógica simple antes de llegar a cualquiera de los dos parsers.

---

## ⚙️ Variables de entorno

**`bot-service/.env`**
```bash
# Opcional: si no se configura, el bot usa el parser por regex automáticamente
NIM_API_KEY=
NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NIM_MODEL=meta/llama-3.1-70b-instruct   # ajustar según catálogo vigente de NIM

DB_PATH=../data/whatsfinance.db   # ruta al archivo SQLite compartido
WHATSAPP_SESSION_PATH=./sessions   # carpeta local donde Baileys guarda la sesión
```

**`dashboard/.env`**
```bash
DB_PATH=../data/whatsfinance.db   # mismo archivo que usa bot-service
```

Todo por `.env`, nunca hardcodeado. Se incluye `.env.example` en cada paquete. `NIM_API_KEY` es la **única variable realmente opcional** de todo el proyecto — sin ella, todo lo demás sigue funcionando con el fallback regex. No hace falta crear ninguna cuenta externa para tener el proyecto corriendo.

---

## 🚀 Setup local (para el MVP)

```bash
# 1. Clonar
git clone https://github.com/<tu-usuario>/whatsfinance.git
cd whatsfinance

# 2. Bot service
cd bot-service
cp .env.example .env    # NIM_API_KEY es opcional; el resto ya trae defaults razonables
npm install
npm run dev              # crea data/whatsfinance.db si no existe, y escanea el QR con tu WhatsApp

# 3. Dashboard (en otra terminal)
cd ../dashboard
cp .env.example .env
npm install
npm run dev               # http://localhost:3000 (o http://<tu-ip-local>:3000 para verlo desde el celular en la misma red)
```

Ambos servicios están pensados para quedarse corriendo en tu red local (PC, mini PC, Raspberry Pi, etc.). No hace falta dominio, HTTPS ni deploy en la nube para el MVP — accedes al dashboard desde cualquier dispositivo de tu misma red usando la IP local de la máquina donde corre.

---

## ✅ Alcance del MVP

Lo mínimo para que el proyecto sea usable de verdad desde el día 1:

- [ ] Conexión WhatsApp vía QR (Baileys)
- [ ] Registrar gasto/ingreso desde texto libre, con parser IA (NIM) + fallback regex automático
- [ ] Confirmación automática por WhatsApp
- [ ] Corrección del último registro ("no, fue X")
- [ ] Comando `resumen` → totales del mes por WhatsApp
- [ ] Dashboard corriendo en red local: lista de transacciones, gráfico por categoría, balance mensual
- [ ] Metas de ahorro: crear, ver progreso
- [ ] Categorías default + posibilidad de crear nuevas

**Fuera del MVP** (para después, si el proyecto tiene acogida y la comunidad quiere invertir esfuerzo):
- Despliegue público (VPS, dominio, HTTPS) — hoy todo vive en red local
- Multi-usuario / multi-tenant
- Notas de voz (transcripción)
- Reconocimiento de recibos/fotos
- Multi-moneda
- Presupuestos por categoría con alertas
- Exportar a Excel/CSV
- Soporte para otros proveedores de IA además de NIM (configurable)
- Migración de SQLite a Postgres, si el uso concurrente o multi-usuario lo justifica

---

## ⚠️ Riesgos y limitaciones conocidas

- **Baileys no es la API oficial de WhatsApp.** Existe riesgo (bajo pero real) de restricción del número si se detecta actividad automatizada atípica. Se recomienda usar un número secundario, no el principal.
- **NVIDIA NIM gratuito es para desarrolladores, no para producción.** Los modelos gratuitos del catálogo NIM tienen límites de rate/tokens pensados para prototipar, pueden agotarse en uso diario intensivo, y la disponibilidad del tier gratis puede cambiar. Por eso el bot siempre puede operar sin IA usando el parser regex — no es opcional tenerlo como respaldo, es parte del diseño.
- **El parser regex es menos flexible que la IA.** Reconoce patrones comunes en español pero no entiende frases muy libres o ambiguas; es un fallback funcional, no un reemplazo completo.
- **SQLite no está pensado para muchos escritores concurrentes.** Para un solo usuario mandando mensajes uno a la vez, funciona perfecto (modo WAL soporta esto sin problema). No es la elección correcta si el proyecto crece a multi-usuario con alta concurrencia — ahí se documentará la migración a Postgres.
- **Solo red local por ahora.** El dashboard y el bot no están expuestos a internet en el MVP; para acceder desde fuera de tu red (ej. datos móviles) haría falta configurar algo adicional (VPN, túnel, deploy real) que no es parte de este alcance inicial.
- **Single-user por instancia en el MVP.** Cada quien corre su propia instancia con su propio número; no es un servicio compartido.
- **Las keys de NIM (si se usan) son tuyas.** El proyecto no tiene backend central ni base de datos externa: todo vive en tu máquina, en un archivo `.db` local.

---

## 🤝 Contribuir

Proyecto pensado para que contribuir sea rápido y sin fricción:

1. Fork + branch (`feat/lo-que-sea` o `fix/lo-que-sea`)
2. Un PR = un cambio enfocado (evitar PRs gigantes)
3. Si agregas una feature nueva, actualiza este README si cambia el alcance
4. No hace falta pedir permiso para issues pequeños (typos, bugs claros) — PR directo
5. Para features grandes, abrir un issue primero para discutir el enfoque

Ver `CONTRIBUTING.md` para detalles.

---

## 📄 Licencia

MIT — usa, modifica y comparte libremente.
