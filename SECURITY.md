# Política de Seguridad

## Versiones soportadas

| Versión | Soporte |
|---------|---------|
| main (latest) | ✅ Activa |
| < main | ❌ Sin soporte |

El proyecto está en MVP temprano; solo la rama `main` recibe actualizaciones de seguridad.

## Reportar vulnerabilidades

**NO abras un Issue público** para vulnerabilidades.

Envía un email a: **security@whatsfinance.local** (o DM a mantenedores en GitHub) con:
- Descripción de la vulnerabilidad
- Pasos para reproducir
- Impacto potencial
- Sugerencia de fix si la tienes

Nos comprometemos a:
- Responder en ≤ 72 horas
- Mantenerte informado del progreso
- Creditarte en el fix (si quieres)

## Riesgos conocidos del MVP

Ver [README.md#-riesgos-y-limitaciones-conocidas](../README.md#-riesgos-y-limitaciones-conocidas):

- **Baileys**: No es API oficial de WhatsApp. Riesgo bajo de ban del número. Usa número secundario.
- **NVIDIA NIM gratis**: Tier para desarrolladores, no producción. Límites de rate/tokens. El fallback regex mitiga.
- **SQLite**: No para alta concurrencia multi-usuario. Migración a Postgres documentada para futuro.
- **Red local only**: No expuesto a internet en MVP. Para acceso remoto: VPN/túnel/despliegue real (fuera de scope MVP).

## Buenas prácticas para self-host

- Usa número de WhatsApp secundario (no tu principal)
- Mantén `NIM_API_KEY` solo en `.env` (nunca en repo)
- Corre en red local de confianza (LAN/VPN)
- Backups periódicos de `data/whatsfinance.db`
- Actualiza dependencias: `npm audit` periódico
