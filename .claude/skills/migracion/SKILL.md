---
name: migracion
description: Crea una migración SQL de Supabase (tabla, columna, índice, vista o política RLS) siguiendo las convenciones del proyecto, y regenera los tipos de TypeScript.
argument-hint: [descripcion-del-cambio]
---

Cambio pedido: $ARGUMENTS

1. Revisá `docs/especificacion.md` (Modelo de datos) y las migraciones existentes en `supabase/migrations/` para no duplicar ni contradecir nada.
2. Desde la raíz: `npx supabase migration new <nombre_en_snake_case>`.
3. Escribí el SQL siguiendo `.claude/rules/supabase.md`: encabezado, minúsculas, RLS activado, una política por operación con `(select auth.uid()) = user_id`, índice en `user_id`, restricciones en la base.
4. Mostrale el SQL al usuario y pedí OK antes de aplicarlo. Después: `npx supabase db push --remote`.
5. Regenerá los tipos: `npx supabase gen types typescript --remote > app/src/lib/database.types.ts`, y corré `npm run check` en `app/`.
6. Si cambió el modelo, actualizá la tabla de Modelo de datos en `docs/especificacion.md`.
7. Si la migración crea tablas o políticas, pedile una revisión al subagente `revisor-seguridad`.

Si una migración ya está commiteada, no se edita (el hook lo bloquea): el arreglo es una migración nueva.
