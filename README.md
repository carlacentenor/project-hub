# Project Hub

App personal de gestión de proyectos. React + Vite + Supabase, desplegada en GitHub Pages.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173/project-hub/
npm run build    # genera dist/
npm run lint
```

Necesita un archivo `.env` (no versionado):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Despliegue (GitHub Pages)

El workflow `.github/workflows/deploy.yml` compila y publica en cada push a `main`.

Configuración única en GitHub (repo → Settings):

1. **Pages → Build and deployment → Source:** `GitHub Actions`
2. **Secrets and variables → Actions → New repository secret:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

URL de producción: `https://carlacentenor.github.io/project-hub/`

## Base de datos

Esquema en Supabase (tablas `projects`, `project_areas`, `tasks`, `task_dependencies`,
`documents`, `notes`, `risks`, `milestones`, `activity_log`), todas con RLS "owner only".

Migración pendiente para iconos de documento:

```sql
ALTER TABLE documents ADD COLUMN icon_url text;
```
