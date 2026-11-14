# Gymbo

App personal de entrenamiento para un solo usuario: fuerza (series, peso y reps), actividades, soga, peso corporal y pasos. Se carga desde el celular en el gym y se analiza desde la PC.

**App:** próximamente en Vercel.

## Stack

- React 19 + TypeScript + Vite, React Router
- Supabase: Postgres, Auth (email + contraseña) y Row Level Security
- Vitest para la lógica de dominio
- Vercel para el hosting

No hay backend propio: el navegador habla directo con Supabase usando la clave publicable, y RLS hace que cada usuario vea solo sus filas. La especificación completa está en [`docs/especificacion.md`](docs/especificacion.md).

## Tu propia copia

Necesitás Node 20+, una cuenta de [Supabase](https://supabase.com) y una de [Vercel](https://vercel.com).

1. Hacé fork de este repo y clonalo.
2. **Supabase:** creá un proyecto. En Authentication > Users creá tu usuario (con "Auto Confirm User") y después desactivá "Allow new users to sign up" en Authentication > Sign In / Providers.
3. **Base de datos**, desde la raíz del repo:
   ```sh
   npx supabase login
   npx supabase link --project-ref <tu-ref>
   npx supabase db push --remote
   ```
4. **Claves locales:** copiá `app/.env.example` a `app/.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (Project Settings > API Keys). Nunca la secret key.
5. **Correr local:**
   ```sh
   cd app
   npm install
   npm run dev
   ```
6. **Vercel:** Add New > Project, importá tu fork, Root Directory `app`, framework Vite, cargá las dos variables `VITE_SUPABASE_*` y deploy.

## Licencia

[MIT](LICENSE)
