# Gymbo: especificación

Fuente de verdad del proyecto para personas y agentes. Si el código y este documento no coinciden, gana este documento o se actualiza en el mismo cambio.

## Estado

| Incremento | Estado |
| --- | --- |
| 0. Base | Terminado |
| 1. Catálogo de ejercicios | Terminado |
| 2. Registro de sesiones | Terminado |
| 3. Actividades y cuerpo | Terminado (falta la semana de prueba) |
| 4. Planes y splits | Pendiente |
| 5. Importador de Excels | Pendiente |
| 6. Estadísticas | Pendiente |
| 7. Progresión | Pendiente |
| 8. PWA y pulido | Pendiente |

## Objetivo y alcance

App personal, para un solo usuario, que reemplaza los Excels de rutina: se carga en el gym desde el celular y se analiza desde la PC, con los mismos datos en los dos.

Repo público y pieza de portfolio: quien quiera usarla hace fork y levanta su propia copia con su Supabase y su Vercel siguiendo el README.

**Qué registra:**

- **Fuerza:** sesiones por rutina (EMPUJE, TIRÓN, PIERNAS, TORSO A/B), con repeticiones, peso y tipo de cada serie.
- **Actividades:** fútbol, pádel, HIIT, bici (km y minutos), movilidad, running y cualquier tipo nuevo.
- **Soga:** por rondas: cantidad de rondas, segundos de salto y de descanso por ronda (y, si los anotás, saltos totales y mejor tanda).
- **Cuerpo:** peso corporal y pasos diarios.
- **Planes:** catálogo de ejercicios, rutinas planificadas y sugerencias de progresión.

**Idioma y tema:** la UI está en español (rioplatense) e inglés, y en modo claro y oscuro. Por defecto toma el idioma y el tema del sistema; los dos se cambian a mano en Más y la elección se recuerda en el dispositivo. El código, las tablas, las columnas y los valores guardados en la base van en inglés: la traducción vive solo en la UI.

**Fuera de alcance (por ahora):** varios usuarios o instancia pública con registro, idiomas además de español e inglés, uso sin conexión con sincronización posterior, integración con relojes o Google Fit, publicación en tiendas de apps.

## Stack y arquitectura

Frontend estático en React que habla directo con Supabase. No hay servidor propio: Supabase pone la base de datos, el login y las reglas de acceso.

```
Celular (PWA) ─┐                          ┌─ Auth (email + contraseña)
               ├─> App React + TS ──supabase-js──> Supabase
PC (navegador) ┘    (servida por Vercel)  └─ Postgres + RLS (cada fila tiene user_id)
```

La seguridad la da Row Level Security (RLS): cada fila guarda el `user_id` del dueño y la base solo devuelve las tuyas, aunque la clave publicable viaje en el navegador.

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Lenguaje | TypeScript | Tipos en todo el modelo |
| UI | React 19 + Vite | Estándar, arranque rápido |
| Ruteo | React Router | Botón atrás del celular, links a cada pantalla |
| Datos | supabase-js + tipos generados (`app/src/lib/database.types.ts`) | Consultas tipadas, sin API propia |
| Base | Supabase Postgres | Relacional, plan gratis, respaldos |
| Login | Supabase Auth | Email + contraseña; registro cerrado tras crear la cuenta |
| Gráficos | SVG propio | Sin dependencia extra |
| Instalable | vite-plugin-pwa | Ícono y pantalla completa en el celular |
| Hosting | Vercel | Publica en cada push a GitHub |
| Idiomas | Diccionario propio (`app/src/lib/i18n.tsx`) | Dos idiomas y pocas pantallas: no justifica una librería |
| Tests | Vitest | Parser de series, progresión, estadísticas |

Variables de entorno (en `app/.env.local`, ver `app/.env.example`): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La secret key (o la `service_role` legacy) nunca va al frontend.

## Modelo de datos

Diez tablas y una vista. La unidad mínima es la **serie**: una fila por serie, así las estadísticas salen con SQL y no hay que reinterpretar texto.

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| `muscle_groups` | name, block, archived | Lista editable de grupos musculares. Nombre único por usuario. `block` = `push`, `pull`, `legs`, `core` u `other`, para el balance empuje / tirón / piernas. Con ejercicios no se borra (`on delete restrict`): se archiva |
| `exercises` | name, muscle_group_id, equipment, weight_step, video_url, video_start_s, notes, archived | Catálogo. Nombre único por usuario. Se archiva en vez de borrar si tiene historial. `notes` = nota fija que se ve cada vez que se carga ("asiento en 4"). `weight_step` = salto de peso propio; vacío = el del equipo (2,5 kg barra y mancuerna, 5 kg máquina) |
| `routines` | name, position, active, notes | Una rutina del plan (EMPUJE, TORSO A). `position` = orden del ciclo |
| `routine_exercises` | routine_id, exercise_id, position, target_sets, rep_min, rep_max, default_set_type, rest_s, superset_group | Receta de cada rutina. El rango de reps alimenta la progresión |
| `workouts` | date, routine_id (opcional), notes | Una sesión real. Sin rutina = sesión libre |
| `workout_sets` | workout_id, exercise_id, position, set_number, reps, seconds, weight_kg, set_type, tempo, superset_group, notes | Una fila por serie. `reps` o `seconds`, nunca ambos vacíos (check constraint). |
| `activity_types` | name, fields, archived | Lista editable de actividades (Fútbol, Pádel, Bici, Soga...). `fields text[]` = qué campos pide al cargar, entre `minutes`, `km`, `rounds`, `work_s`, `rest_s`, `jumps`, `best_streak`. Nombre único por usuario |
| `activities` | date, activity_type_id, minutes, km, rounds, work_s, rest_s, jumps, best_streak, notes | Todos los campos opcionales; la pantalla muestra solo los `fields` del tipo. Soga: tiempo de salto = `rounds` × `work_s`; total = salto + (`rounds` − 1) × `rest_s` (después de la última ronda no hay descanso). Borrar un tipo con actividades está bloqueado (`on delete restrict`) |
| `body_weights` | date, kg | Pesajes |
| `daily_steps` | date, steps | Único por usuario y fecha |
| `personal_records` | vista (pendiente) | Desde `workout_sets`: mejor peso, mejor 1RM estimado y más reps por ejercicio. Hasta el incremento 6 los récords se calculan en `lib/records.ts` |

**Reglas comunes:**

- `id uuid default gen_random_uuid()`, `user_id uuid not null default auth.uid() references auth.users on delete cascade`, `created_at timestamptz default now()`.
- RLS activado en todas las tablas, con **una política por operación** (select, insert, update, delete), `to authenticated`, usando `(select auth.uid()) = user_id`. Índice sobre `user_id`.
- `date` es tipo `date` (fecha local del usuario, sin hora).
- Borrar una sesión borra sus series (`on delete cascade`); borrar un ejercicio con historial está bloqueado (`on delete restrict`).
- El esquema vive en `supabase/migrations/` como SQL versionado; nunca se edita una migración ya commiteada.

## Pantalla de carga

Tomado de Hevy, Strong y Liftosaur. Cada ejercicio de la sesión es una tarjeta con una grilla, una fila por serie:

| Serie | Anterior | kg | Reps | ✓ |
| --- | --- | --- | --- | --- |
| 1 | 20 × 8 | `20` | `8` | ☐ |
| C | 10 × 12 | | | ☐ |

- **Anterior:** lo que hiciste en esa misma serie la última vez (de la misma rutina si hay, si no de cualquier sesión). Los campos vacíos muestran ese valor de fondo; tildar ✓ con el campo vacío lo copia. Una sesión igual a la anterior se carga solo tildando.
- **Tipo de serie:** tocando el número de serie se elige `C` calentamiento, `D` drop, `F` fallo, `RP` rest-pause. Va por serie, no por ejercicio.
- **Atajo de notación:** un campo de texto por ejercicio acepta la notación del Excel (`8-6-4 x 20`) y rellena la grilla. Al editar, la grilla se puede ver como texto con `format`.
- **Al tildar ✓:** arranca el temporizador de descanso (`rest_s` de la receta, 90 s si no hay; ±15 s), y si la serie supera un récord se marca 🏆 en el momento.
- **Nota fija** del ejercicio (`exercises.notes`) arriba de la grilla; **nota de la serie** en `workout_sets.notes` (pendiente: no entra en 360 px, se verá en el incremento 8).
- **Teclado:** inputs con `inputMode="decimal"` (kg) y `"numeric"` (reps) para que el celular abra el teclado numérico.

## Notación de series y tipos de serie

Atajo de carga (ver arriba) y formato del importador: una línea por ejercicio; al guardar se convierte en filas de `workout_sets`. Parser: `app/src/lib/sets.ts` (parse y format, puro, con tests).

| Escribís | Se guarda como |
| --- | --- |
| `8-6-4 x 20` | 3 series: 8, 6 y 4 reps con 20 kg |
| `10 x 32 7 x 37` | 2 series: 10 reps con 32 kg y 7 reps con 37 kg |
| `8-8` o `8-8-` | 2 series de 8 reps sin peso |
| `5-5 x 2,5` | Acepta coma o punto decimal |
| `35s-30s-22s` | 3 series por tiempo: 35, 30 y 22 segundos |
| `40s x 20` | 1 serie de 40 segundos con 20 kg |

Ida y vuelta obligatoria: `format(parse(x))` devuelve la forma canónica de `x` (por ejemplo `8-8-` vuelve como `8-8`).

**Tipos de serie** (`set_type`), uno por serie: `normal` (por defecto), `warmup` = calentamiento (no cuenta para récords ni progresión), `drop`, `rest_pause`, `failure` = fallo.
**Tempo** (`tempo`): `slow` = lento, `explosive` = explosivo, `pause` = pausa. Reemplaza los "(lento)", "(aguantando)", "(explosiva)" que el Excel ponía en el nombre. En la pantalla de carga se elige por ejercicio y se guarda en cada serie.
**Equipo** (`exercises.equipment`): `barbell` = barra, `dumbbell` = mancuerna, `machine` = máquina, `cable` = polea, `bodyweight` = peso corporal, `other` = otro.
**Superserie** (`superset_group`): ejercicios con el mismo número dentro de la sesión se muestran juntos.
**Variantes:** cada variante es un ejercicio aparte, con la variante en el nombre: movimiento primero y variante al final ("Press militar con barra", "Press militar con mancuernas"). Así cada una tiene su Anterior, sus récords y su salto de peso, que no se pueden comparar entre equipos. La que no se usa se archiva y conserva su historial. Renombrar un ejercicio cambia el nombre en todo el historial, porque las series apuntan al id.
**Mancuernas:** se anota el peso de una mancuerna, no la suma de las dos.

## Plan de incrementos

Cada incremento termina publicado y usable desde el celular. Se trabaja uno a la vez (`/incremento N`): al empezar se revisa este plan y se ajusta. Al cerrar uno: tildar sus criterios y actualizar la tabla **Estado**.

**Orden:** después del incremento 3 se adelantó Planes y splits (ahora 4), porque no depende del historial y se usa en el gym desde el primer día. El importador (5) va justo antes de Estadísticas (6) y Progresión (7), que necesitan historial para tener sentido.

**Commits:** cada incremento tiene su plan de commits en `docs/incrementos/N-*.md`, en una rama propia que se mergea a `main` al cerrar. Cada commit deja `npm run check` en verde y la app funcionando. El orden va de lógica pura con tests a pantallas, y termina con `docs: close increment N`.

Pantallas en `app/src/pages/`, lógica pura en `app/src/lib/` con su `*.test.ts`. Navegación inferior fija: **Entrenar · Registrar · Historial · Estadísticas · Más** (Más = ejercicios, actividades, rutinas, importar, exportar, salir).

### 0. Base
- Proyecto Vite + React + TS en `app/`, repo en GitHub (`nicolasroumec/gymbo`), deploy automático en Vercel.
- `npx supabase init` en la raíz, proyecto Supabase creado y linkeado.
- Primera migración con **todas** las tablas del modelo de datos, checks, índices, RLS y la vista `personal_records`; tipos generados. Revisión con `revisor-seguridad`.
- `app/src/lib/supabase.ts`: cliente único tipado.
- `LoginPage` (email + contraseña) y ruta protegida: sin sesión, todo redirige al login.
- `Layout` con la navegación inferior y una página vacía por pestaña.
- Idiomas: `lib/i18n.tsx` con los textos en español e inglés y un hook para usarlos; ningún texto de la UI escrito directo en un componente. El tipo del diccionario obliga a que los dos idiomas tengan las mismas claves; test de la detección del idioma.
- Tema claro y oscuro: sigue al sistema por defecto, con selector en Más (sistema, claro, oscuro). Idioma y tema se guardan en localStorage.
- `project_ref` cargado en `.mcp.json`.
- `LICENSE` (MIT) y `README.md`: qué es, link a la app, stack, y cómo levantar tu propia copia (fork + Supabase + Vercel).

**Paso a paso** (👤 = lo hacés vos en la web o la terminal; 🤖 = lo hace el agente):

1. 👤 **Proyecto Supabase.** En supabase.com: New project, nombre `gymbo`, región South America (São Paulo). Guardá la contraseña de la base en tu gestor de contraseñas: se pide al linkear.
2. 👤 **Claves locales.** Copiá `app/.env.example` a `app/.env.local` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (Project Settings > API Keys). Nunca la secret key.
3. 👤 **Tu usuario.** Authentication > Users > Add user > Create new user, con tu email, contraseña y "Auto Confirm User".
4. 👤 **Cerrar el registro.** Authentication > Sign In / Providers: desactivar "Allow new users to sign up".
5. 👤 **CLI.** En Claude Code: `! npx supabase login` (abre el navegador).
6. 🤖 `npx supabase init` en la raíz.
7. 👤 **Linkear.** `! npx supabase link --project-ref <ref>` (el ref está en la URL del proyecto: `supabase.com/dashboard/project/<ref>`). Pide la contraseña del paso 1.
8. 👤 **MCP.** `setx SUPABASE_PROJECT_REF <ref>` en PowerShell y reiniciar Claude Code, para que `.mcp.json` lo tome sin escribir el ref en el repo.
9. 🤖 **Migración inicial** con el skill `migracion`: todas las tablas, checks, índices, RLS y la vista `personal_records`. Revisión con `revisor-seguridad`.
10. 👤 Aprobar `npx supabase db push --remote`.
11. 🤖 Generar `app/src/lib/database.types.ts`.
12. 🤖 **App:** borrar el ejemplo de Vite, crear `lib/supabase.ts`, `LoginPage`, ruta protegida, `LICENSE`, `README.md`, `Layout` con la navegación inferior y las cinco pestañas vacías; `app/vercel.json` con rewrite a `/index.html` para que React Router funcione al recargar.
13. 🤖 Probar a 360 px con `npm run dev`, `npm run check`, commit y push.
14. 👤 **Vercel.** En vercel.com: Add New > Project, importar `gymbo`, Root Directory `app`, framework Vite, y cargar las dos variables `VITE_SUPABASE_*`. Deploy.
15. 👤 **URL en Supabase.** Authentication > URL Configuration: Site URL = la URL de Vercel.
16. 👤 **Prueba final.** Entrar desde el celular a la URL de Vercel con tu cuenta, e intentar registrarse con otro email para confirmar que falla.

- [x] Código en GitHub.
- [x] Entrás con tu cuenta desde el celular a la URL pública.
- [x] El registro de usuarios nuevos está desactivado en Supabase.
- [x] README y LICENSE en el repo.

### 1. Catálogo de ejercicios
- Migración `muscle_groups`: grupos musculares editables; `exercises.muscle_group` (texto) pasa a `muscle_group_id`.
- `MuscleGroupsPage` (en Más): alta, renombrar, cambiar bloque, archivar; borrar solo si no tiene ejercicios. Si la lista está vacía, ofrece cargar los sugeridos en el idioma actual: Pecho, Hombros, Tríceps (empuje); Espalda, Bíceps, Antebrazos (tirón); Cuádriceps, Isquiotibiales, Glúteos, Gemelos (piernas); Abdominales (core); Otro.
- `ExercisesPage`: lista con buscador por nombre (sin distinguir mayúsculas ni tildes) y filtro por grupo muscular; archivados ocultos con opción de verlos.
- `ExerciseFormPage`: alta y edición con grupo muscular, equipo, salto de peso (opcional), link al video con minuto (`m:ss`) y nota fija.
- Archivar en vez de borrar si tiene series; borrar solo si no tiene.
- `lib/video.ts`: arma el link de YouTube con el minuto (`?t=`) y descarta links que no sean `http(s)`. Test.
- `lib/numbers.ts`: lectura de decimales con coma o punto, compartida por todos los formularios. Test.
- `lib/exercises.ts`: búsqueda y filtro del catálogo. Test.
- [x] Están cargados los ejercicios de la rutina actual.

### 2. Registro de sesiones
- `lib/sets.ts`: `parse` y `format` de la notación, con la tabla de ejemplos como tests e ida y vuelta.
- `lib/previous.ts`: para cada ejercicio, las series de la última vez (misma rutina primero, si no cualquier sesión), emparejadas por número de serie. Test.
- `lib/records.ts`: dada una serie y los récords actuales, dice si es récord (peso, 1RM estimado o reps con ese peso); ignora calentamiento. Test.
- `lib/draft.ts`: guardar y recuperar la sesión en curso en localStorage; se borra solo cuando Supabase confirma el guardado. Test.
- `WorkoutPage`: grilla de la **Pantalla de carga**, selector de ejercicio con búsqueda, tipo de serie, tempo, superserie, temporizador de descanso, aviso 🏆, nota fija del ejercicio.
- "Repetir" una sesión pasada desde el historial (la última de una rutina llega con el incremento 4).
- `HistoryPage` y detalle de sesión: lista por fecha, editar y borrar.
- [x] Se anota una sesión real en el gym desde el celular sin usar el Excel.

### 3. Actividades y cuerpo
- `ActivityTypesPage` (en Más): alta, edición y archivo de tipos, eligiendo qué campos pide cada uno. Si la lista está vacía, ofrece cargar Fútbol, Pádel, HIIT, Bici, Movilidad, Running y Soga.
- `RegisterPage` (pestaña Registrar): cargar la actividad del día con los campos de su tipo; peso corporal; pasos.
- Soga: rondas, segundos de salto y de descanso; muestra el tiempo de salto y el total calculados.
- Una sola fecha arriba vale para actividad, peso y pasos. Debajo de cada formulario, los últimos registros con borrar (editar = borrar y volver a cargar). Pasos: uno por día; cargar de nuevo la misma fecha lo reemplaza.
- [ ] Una semana completa (gym, fútbol, soga, peso) registrada solo en la app.

### 4. Planes y splits
- `RoutinesPage` y `RoutineFormPage`: rutinas con receta (ejercicios en orden, series objetivo, rango de reps, tipo por defecto, descanso, superseries); reordenar el ciclo.
- `lib/cycle.ts`: qué rutina toca hoy según la última sesión hecha y el orden del ciclo. Test.
- Pestaña Entrenar = "Hoy toca": arma la sesión desde la receta, con la columna Anterior.
- [ ] Al abrir la app en el gym, la sesión del día ya está armada.

### 5. Importador de Excels
- Lee el formato de los Excels del autor (ver **Importador de Excels**); para otros usuarios queda documentado en el README, no se generaliza.
- Dependencia nueva: SheetJS (`xlsx`), ya prevista en el stack.
- `lib/import/`: un lector por origen de la tabla **Importador de Excels** (fuerza, bici fija, calendario, pasos, peso, lista de ejercicios) que devuelve filas listas para insertar, sin tocar la base. Tests con celdas de ejemplo escritas en el test (los .xlsx reales no se commitean).
- `lib/import/similar.ts`: agrupa nombres parecidos para unificar. Test.
- `ImportPage`: subir archivo, vista previa con conteos por mes y avisos (fechas fuera de mes, nombres a unificar), confirmar y guardar. Crea los tipos de actividad y ejercicios que falten. Reimportar no duplica.
- [ ] Datos de 2025 y 2026 importados; totales por mes iguales a la hoja "Total" (tolerancia ±1 sesión por mes).

### 6. Estadísticas
- `lib/stats.ts`: 1RM Epley, volumen, peso máximo por sesión, series semanales por grupo muscular, frecuencia mensual por tipo. Tests.
- `components/LineChart.tsx` y `components/BarChart.tsx` en SVG propio.
- `StatsPage`: progreso por ejercicio (elegís ejercicio y período), récords, tabla mensual, volumen semanal por grupo, soga, peso corporal y pasos.
- [ ] "¿Mejoré en press plano este año?" se responde en dos toques.

### 7. Progresión
- `lib/progression.ts`: progresión doble (ver **Estadísticas y progresión**), con `weight_step` del ejercicio o el del equipo. Tests por cada regla.
- En la grilla, cada ejercicio muestra su objetivo de hoy (peso y reps) y se acepta con un toque.
- [ ] Cada ejercicio del plan muestra su objetivo para hoy.

### 8. PWA y pulido
- Dependencia nueva: `vite-plugin-pwa`, prevista en el stack. Ícono, nombre Gymbo, pantalla completa, caché de la app.
- `lib/export.ts`: todas las tablas a JSON y a CSV. Test.
- Pantalla Exportar en Más.
- Nota por serie (`workout_sets.notes`) en la pantalla de carga, sin romper la grilla en 360 px.
- README de portfolio: capturas o GIF con datos inventados, decisiones técnicas (RLS, una fila por serie, lógica pura testeada).
- [ ] Se usa como app del teléfono y hay un respaldo descargado.

## Estadísticas y progresión

Todas las métricas salen de `workout_sets`, sin series de calentamiento (`warmup`). Se guardan series crudas, nunca resultados calculados.

| Métrica | Cálculo | Dónde se ve |
| --- | --- | --- |
| Peso máximo | Mayor `weight_kg` de la sesión | Gráfico por ejercicio |
| 1RM estimado | Epley: `w × (1 + r/30)`, solo series de hasta 12 reps | Gráfico por ejercicio, récords |
| Volumen | Suma de reps × kg | Gráfico por ejercicio, volumen semanal por grupo |
| Series por grupo | Series por semana por grupo muscular (`muscle_group_id`) y por `block` | Balance empuje / tirón / piernas |
| Récords | Mejor peso, mejor 1RM, más reps con un mismo peso | Lista, aviso al guardar |
| Frecuencia | Sesiones y actividades por mes y tipo | Tabla mensual (como la hoja "Total") |
| Soga | Rondas y tiempo de salto por sesión (saltos y mejor tanda si están) | Gráfico de soga |

**Progresión doble** con el rango `rep_min`–`rep_max` de la receta (`app/src/lib/progression.ts`, función pura con tests):

1. Si en la última sesión todas las series efectivas llegaron a `rep_max`: subir un salto (2,5 kg barra y mancuerna, 5 kg máquina).
2. Si alguna serie quedó bajo `rep_min` dos sesiones seguidas: bajar 10%.
3. Si no: mismo peso, una rep más en la primera serie que no llegó al tope.

## Importador de Excels

Los archivos están en `docs/*.xlsx` (datos personales, fuera de git). Una prueba con las hojas reales interpretó todas las series sin errores y las sesiones por mes quedaron casi iguales a la hoja "Total". No anotar acá cifras de esos datos: el repo es público.

| Origen | Cómo se lee | Destino |
| --- | --- | --- |
| Hoja mensual, bloque FUERZA (columna B, encabezados en fila 3) | Fila con nombre + **fechas contiguas desde la columna C** = rutina y sus sesiones; filas siguientes = ejercicios, una celda por sesión. Ojo: la columna FECHA del calendario cae en H–J según la hoja, por eso solo cuentan fechas contiguas | `workouts` + `workout_sets` |
| Hoja mensual, BICI FIJA | Columnas FECHA, DISTANCIA, TIEMPO, ubicadas por encabezado (la posición cambia entre hojas) | `activities` tipo Bici (se crea el tipo si falta) |
| Hoja mensual, CALENDARIO | FECHA + columnas contiguas FUE, BICI, HIIT, FUT, MOV con "X" | `activities`; se omite si ya existe con más detalle (FUE si hay sesión, BICI si hay bici fija) |
| Hoja mensual, columna PASOS | Número por fecha | `daily_steps` |
| Peso.xlsx | Pares FECHA / PESO por año; ignorar ceros y negativos | `body_weights` |
| Lista de ejercicios.xlsx | GRUPO MUSCULAR, NOMBRE, LINK, MINUTO | `exercises` |
| Hoja "Total" | No se importa: valida los totales | — |

**Casos especiales:**

- Las celdas usan espacio duro (`\xa0`) en `x`: normalizar antes de parsear.
- Celdas `#DIV/0!` y fechas sueltas dentro del bloque de fuerza: ignorar.
- Modificadores en el nombre ("(lento)", "(aguantando)") pasan a `tempo` y el ejercicio se unifica.
- Nombres casi iguales ("Press militar" / "Press militar con barra") se muestran para unificar a mano.
- Fechas fuera del mes de la hoja (sesión de marzo en la hoja de junio): marcar para revisar.
- Bloques HIIT con `15s x 14`: se importan como actividad HIIT, no como series.
- Reimportar no duplica: una sesión se identifica por fecha + rutina.

## Decisiones abiertas y riesgos

| Riesgo | Mitigación |
| --- | --- |
| Sin señal en el gym | Borrador local de la sesión en curso (incremento 2); offline completo solo si hace falta |
| Supabase gratis pausa el proyecto tras 7 días sin uso | Uso diario; exportación de respaldo (incremento 8) |
| Clave publicable visible en el navegador | RLS en todas las tablas, registro cerrado |
| Repo público en GitHub | `.env*` y `docs/*.xlsx` ignorados; push protection de GitHub activado; los tests del importador usan fixtures inventados, nunca datos reales |
| Nombres de ejercicios duplicados | Selector con búsqueda y unificación en el importador |

**Para decidir:**

- [x] Tipos de actividad: lista editable en la app (`activity_types`), cada tipo elige qué campos pide.
- [x] Salto de peso: por equipo, con `exercises.weight_step` para pisarlo en un ejercicio.
- [x] Soga: por rondas (cantidad, segundos de salto y de descanso). Variantes en notas.
- [x] Unidades: solo kg.
- [x] Distribución: app personal; otros la usan haciendo fork con su propio Supabase y Vercel. Licencia MIT.
- [x] Nombre: **Gymbo** (repo `gymbo`; dominio: el que dé Vercel, `gymbo.vercel.app` si está libre).
