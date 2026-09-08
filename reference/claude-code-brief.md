# Project Hub — Brief para Claude Code

## Qué es esto
Project Hub es una app personal de gestión de proyectos (para uso individual, un solo
usuario con login). Ya existe un proyecto React + Vite inicializado, conectado a un
repo de GitHub y a un proyecto de Supabase (con el esquema de base de datos ya
creado y RLS activo). Ya existen 5 mockups HTML de alta fidelidad que definen el
Design System completo y el layout exacto de cada pantalla — deben usarse como
referencia visual pixel-a-pixel, no reinterpretarse.

## Tu tarea
Migrar las 5 pantallas HTML estáticas a una app React funcional que lea y escriba
datos reales en Supabase, manteniendo el Design System exactamente como está
definido en los HTML (colores, tipografía Inter, espaciado, radios, componentes).

## Ya está hecho (no lo repitas)
- Proyecto Vite + React inicializado, con `@supabase/supabase-js` y `react-router-dom`
  instalados.
- `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `src/lib/supabaseClient.js` con el cliente de Supabase ya configurado.
- `vite.config.js` con `base: '/project-hub/'` para GitHub Pages.
- Esquema de base de datos completo en Supabase: tablas `projects`, `project_areas`,
  `tasks`, `task_dependencies`, `documents`, `notes`, `risks`, `milestones`,
  `activity_log` — todas con RLS activo (política "owner only": cada fila solo es
  visible/editable por su `user_id`, que además tiene `default auth.uid()`).
- Workflow de GitHub Actions en `.github/workflows/deploy.yml` para desplegar a
  GitHub Pages automáticamente en cada push a `main` (usa los secrets
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configurados en GitHub).
- Un usuario de Supabase ya creado manualmente en Authentication → Users (no hay
  pantalla de registro público, solo login).

## Pantallas a migrar (adjunto los 5 HTML de referencia)
1. **Dashboard** (`project-hub-dashboard.html`) → ruta `/`
   Resumen general: KPIs, proyectos activos, timeline general (Gantt preview),
   próximos hitos, mis Jiras (omitir por ahora, no hay tabla Jira), requiere
   atención, para hoy, actividad reciente.
2. **Proyectos** (`project-hub-proyectos.html`) → ruta `/proyectos`
   Lista de todos los proyectos (tabla `projects`), toggle Cards/Lista, con
   búsqueda y filtros.
3. **Detalle de proyecto — Resumen** (`project-hub-loyalty.html`) → ruta
   `/proyectos/:id`
   Header del proyecto, KPIs, estado por área (`project_areas`), próximos hitos
   (`milestones`), bloqueos y riesgos (`risks`), próximas tareas (`tasks`),
   **documentos** (`documents`) y **notas** (`notes`) — estas dos secciones deben
   quedar editables directamente aquí (agregar/eliminar), actividad reciente
   (`activity_log`).
   Nota: quitamos del navbar contextual las pestañas separadas de Documentos,
   Notas, Riesgos y Actividad — todo vive dentro de esta pantalla de Resumen.
4. **Plan de trabajo** (`project-hub-plan-trabajo.html`) → ruta
   `/proyectos/:id/plan`
   Gantt jerárquico (Área → Backend/Frontend → Tarea → Subtarea) usando `tasks`
   con `area_id` y `parent_task_id`. Reutiliza el mismo colapsar/expandir y el
   drawer de tarea del HTML de referencia.
5. **Tareas** (`project-hub-tareas.html`) → ruta `/tareas`
   Vista global de todas las tareas del usuario (join `tasks` + `projects`),
   agrupada por proyecto por defecto, con las vistas Lista / Kanban / Mis tareas
   tal como están en el HTML (Kanban sin drag & drop real por ahora — puede
   quedar para una siguiente iteración).

## Reglas importantes
- No inventes columnas nuevas en Supabase sin decírmelo primero — el esquema ya
  está fijado y tiene RLS configurado sobre esos nombres exactos.
- Todos los `insert` deben depender de la sesión activa (no mandar `user_id`
  manualmente, ya tiene `default auth.uid()` en la base de datos).
- Antes de cualquier `insert`/`update`/`delete`, la ruta debe estar protegida por
  el login (usa `supabase.auth.getSession()` en un `ProtectedRoute`).
- Mantén los mismos nombres de variables CSS/tokens que aparecen en los `<style>`
  de los HTML (`--color-brand-cyan`, `--radius-lg`, etc.) — o conviértelos a un
  archivo de tokens compartido (`src/styles/tokens.css`) si usamos CSS puro, o a
  un objeto de theme si terminamos usando styled-components / Tailwind config.
  Pregúntame cuál prefiero antes de decidirlo por tu cuenta.
- Los datos de ejemplo que aparecen en los HTML (Loyalty, App Delivery, CRM, y
  todas sus tareas) son solo referencia visual — no hace falta reproducirlos
  como seed data a menos que yo lo pida explícitamente.

## Primer paso sugerido
Antes de tocar las 5 pantallas, arma primero:
1. El layout base (`Sidebar` + `ProtectedRoute` + `react-router-dom` con las 5
   rutas de arriba).
2. La pantalla de `Login`.
3. Un solo componente de datos de prueba (ej. lista de proyectos en `/proyectos`
   leyendo de Supabase) para confirmar que la conexión completa funciona de
   principio a fin antes de migrar el resto.
