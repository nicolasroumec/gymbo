---
paths:
  - "supabase/**"
---
# Convenciones SQL y Supabase

Basadas en los prompts oficiales de Supabase para migraciones y RLS.

- Archivo nuevo con `npx supabase migration new <nombre>`: genera `supabase/migrations/YYYYMMDDHHmmss_<nombre>.sql` (UTC).
- Encabezado de comentario: propósito, tablas afectadas, consideraciones. Un comentario breve por paso.
- SQL en minúsculas.
- Toda tabla nueva lleva:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null default auth.uid() references auth.users on delete cascade`
  - `created_at timestamptz not null default now()`
  - `alter table ... enable row level security;`
  - Índice sobre `user_id`.
- Políticas: una por operación (select, insert, update, delete), nunca `for all`. Siempre `to authenticated`. Comparar con `(select auth.uid()) = user_id` (el `select` permite que Postgres lo calcule una vez por consulta). Insert y update llevan `with check`.
- Nombre de política descriptivo entre comillas: `"usuarios leen sus ejercicios"`.
- Restricciones en la base, no solo en la app: `check`, `unique`, `not null`, `on delete restrict` para ejercicios con historial.
- `drop`, `truncate` o cambios de columna: comentario explicando por qué y qué datos se pierden.
- Después de aplicar: regenerar `app/src/lib/database.types.ts` y actualizar la tabla del modelo de datos en `docs/especificacion.md` si cambió.
