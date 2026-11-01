# Gymbo

App personal de entrenamiento (un solo usuario): fuerza, actividades, soga, peso y pasos. React + TypeScript + Supabase, sin backend propio.

`docs/especificacion.md` es la fuente de verdad: alcance, modelo de datos, notación de series, plan de incrementos y su estado. Leela antes de empezar o planificar cualquier incremento.

## Estructura

- `app/`: frontend Vite. Los comandos `npm` se corren desde acá.
- `supabase/`: migraciones y config del CLI. Los comandos `npx supabase` se corren desde la raíz.
- `docs/*.xlsx`: historial viejo del usuario. Solo lectura, datos personales (no se commitean), sirven de fixtures del importador (incremento 4).

## Comandos

Desde `app/`:
- `npm run dev`: servidor local
- `npm run check`: typecheck + tests. Un hook lo corre al final de cada turno y no deja terminar si falla.
- `npx vitest run src/lib/sets.test.ts`: un solo archivo de tests
- `npm run lint`

Desde la raíz:
- `npx supabase migration new <nombre_en_snake_case>`
- `npx supabase db push`: aplica migraciones en la base real (pide confirmación)
- `npx supabase gen types typescript --linked > app/src/lib/database.types.ts`: después de cada migración

## Decisiones que no están en el código

- La seguridad es RLS en Postgres: el navegador habla directo con Supabase con la clave publicable. La secret key o `service_role` nunca entra en `app/`.
- Una fila por serie en `workout_sets`. La notación `8-6-4 x 20` existe solo en la UI; el parser y el formateo viven en `app/src/lib/sets.ts`.
- La lógica de dominio (parser, progresión, estadísticas) va en `app/src/lib/` como funciones puras con su `*.test.ts` al lado. Los componentes no calculan.
- Gráficos en SVG propio. No agregar dependencias sin preguntar: el stack está fijado en la especificación.
- Las migraciones commiteadas no se editan: se crea una nueva. Un hook lo bloquea.

## Gotchas

- Fechas: guardar la fecha local `YYYY-MM-DD` con `toLocaleDateString('sv')`, nunca `toISOString().slice(0, 10)`: en Argentina (UTC-3), después de las 21 h da el día siguiente.
- Decimales: el usuario escribe `2,5`; aceptar coma y punto en toda entrada numérica.
- Windows: PowerShell y Git Bash, npm (no pnpm ni yarn).
- `app/.env.local` tiene las claves y está bloqueado para lectura. Los nombres de las variables están en `app/.env.example`.

## Cómo trabajar con el usuario

- Está aprendiendo React, TypeScript y Supabase (viene de .NET/Blazor). Al cerrar un cambio, explicá en 3 a 5 líneas los conceptos nuevos que usaste, comparando con C# cuando ayude.
- UI en español rioplatense (vos). Código, tablas y columnas en inglés. Docs y mensajes de commit en español.
- Un incremento a la vez, con `/incremento N`. Al terminar, tildá sus criterios y actualizá la tabla Estado de la especificación.
