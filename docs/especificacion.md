# Gymbo: especificación

Fuente de verdad del proyecto para personas y agentes. Si el código y este documento no coinciden, gana este documento o se actualiza en el mismo cambio.

## Estado

| Incremento | Estado |
| --- | --- |
| 0. Base | En curso: proyecto Vite creado en `app/` |
| 1. Catálogo de ejercicios | Pendiente |
| 2. Registro de sesiones | Pendiente |
| 3. Actividades y cuerpo | Pendiente |
| 4. Importador de Excels | Pendiente |
| 5. Estadísticas | Pendiente |
| 6. Planes y splits | Pendiente |
| 7. Progresión | Pendiente |
| 8. PWA y pulido | Pendiente |

## Objetivo y alcance

App personal, para un solo usuario, que reemplaza los Excels de rutina: se carga en el gym desde el celular y se analiza desde la PC, con los mismos datos en los dos.

**Qué registra:**

- **Fuerza:** sesiones por rutina (EMPUJE, TIRÓN, PIERNAS, TORSO A/B), con repeticiones, peso y tipo de cada serie.
- **Actividades:** fútbol, pádel, HIIT, bici (km y minutos), movilidad, running y cualquier tipo nuevo.
- **Soga:** saltos totales, mejor tanda sin cortar y minutos.
- **Cuerpo:** peso corporal y pasos diarios.
- **Planes:** catálogo de ejercicios, rutinas planificadas y sugerencias de progresión.

**Fuera de alcance (por ahora):** varios usuarios, uso sin conexión con sincronización posterior, integración con relojes o Google Fit, publicación en tiendas de apps.

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
| Tests | Vitest | Parser de series, progresión, estadísticas |

Variables de entorno (en `app/.env.local`, ver `app/.env.example`): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La secret key (o la `service_role` legacy) nunca va al frontend.

## Modelo de datos

Ocho tablas y una vista. La unidad mínima es la **serie**: una fila por serie, así las estadísticas salen con SQL y no hay que reinterpretar texto.

| Tabla | Campos clave | Notas |
| --- | --- | --- |
| `exercises` | name, muscle_group, equipment, video_url, video_start_s, notes, archived | Catálogo. Nombre único por usuario. Se archiva en vez de borrar si tiene historial. `notes` = nota fija que se ve cada vez que se carga ("asiento en 4") |
| `routines` | name, position, active, notes | Una rutina del plan (EMPUJE, TORSO A). `position` = orden del ciclo |
| `routine_exercises` | routine_id, exercise_id, position, target_sets, rep_min, rep_max, default_set_type, rest_s, superset_group | Receta de cada rutina. El rango de reps alimenta la progresión |
| `workouts` | date, routine_id (opcional), notes | Una sesión real. Sin rutina = sesión libre |
| `workout_sets` | workout_id, exercise_id, position, set_number, reps, seconds, weight_kg, set_type, tempo, superset_group, notes | Una fila por serie. `reps` o `seconds`, nunca ambos vacíos (check constraint). |
| `activities` | date, type, minutes, km, jumps, best_streak, notes | `jumps` y `best_streak` solo para soga |
| `body_weights` | date, kg | Pesajes |
| `daily_steps` | date, steps | Único por usuario y fecha |
| `personal_records` | vista | Desde `workout_sets`: mejor peso, mejor 1RM estimado y más reps por ejercicio |

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
- **Nota fija** del ejercicio (`exercises.notes`) arriba de la grilla; **nota de la serie** en `workout_sets.notes`.
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

**Tipos de serie** (`set_type`), uno por serie: `normal` (por defecto), `calentamiento` (no cuenta para récords ni progresión), `drop`, `rest_pause`, `fallo`.
**Tempo** (`tempo`): `lento`, `explosivo`, `pausa`. Reemplaza los "(lento)", "(aguantando)", "(explosiva)" que el Excel ponía en el nombre.
**Superserie** (`superset_group`): ejercicios con el mismo número dentro de la sesión se muestran juntos.

## Plan de incrementos

Cada incremento termina publicado y usable desde el celular. Se trabaja uno a la vez (`/incremento N`). Al cerrar uno: tildar sus criterios y actualizar la tabla **Estado**.

### 0. Base
- Proyecto Vite + React + TS en `app/`, repo en GitHub, deploy automático en Vercel.
- `npx supabase init` en la raíz, proyecto Supabase creado y linkeado, primera migración con todas las tablas y RLS, tipos generados.
- Login, layout con navegación inferior y pantallas vacías.
- `project_ref` cargado en `.mcp.json`.
- [ ] Entrás con tu cuenta desde el celular a la URL pública.
- [ ] El registro de usuarios nuevos está desactivado en Supabase.

### 1. Catálogo de ejercicios
- Alta, edición y archivo, con grupo muscular, equipo y link al video con minuto.
- Buscador por nombre y filtro por grupo muscular.
- [ ] Están cargados los ejercicios de la rutina actual.

### 2. Registro de sesiones
- Parser de series con tests.
- Cargar sesión con la grilla de la sección **Pantalla de carga**: fecha, rutina, ejercicios, series con tipo, tempo, superserie.
- "Repetir la última sesión de esta rutina": arma la grilla con las mismas series y la columna Anterior.
- Temporizador de descanso al tildar una serie y aviso de récord.
- Borrador de la sesión en curso guardado en el teléfono (localStorage) hasta que se guarda.
- Historial, edición y borrado.
- [ ] Se anota una sesión real en el gym desde el celular sin usar el Excel.

### 3. Actividades y cuerpo
- Actividades con campos según el tipo: km para bici y running, saltos y mejor tanda para soga.
- Peso corporal y pasos diarios.
- [ ] Una semana completa (gym, fútbol, soga, peso) registrada solo en la app.

### 4. Importador de Excels
- Pantalla "Importar": se sube el .xlsx, se lee en el navegador (SheetJS), vista previa, y recién ahí se guarda.
- Crea los ejercicios que falten y permite unificar nombres parecidos.
- [ ] Datos de 2025 y 2026 importados; totales por mes iguales a la hoja "Total" (tolerancia ±1 sesión por mes).

### 5. Estadísticas
- Progreso por ejercicio, récords personales, totales por mes, volumen semanal por grupo muscular.
- Gráficos de soga, peso corporal y pasos.
- [ ] "¿Mejoré en press plano este año?" se responde en dos toques.

### 6. Planes y splits
- Rutinas con receta: ejercicios en orden, series objetivo, rango de reps, descanso, superseries.
- Ciclo del plan y pantalla "Hoy toca", que arma la sesión desde la rutina.
- [ ] Al abrir la app en el gym, la sesión del día ya está armada.

### 7. Progresión
- Sugerencia por ejercicio al cargar la sesión: subir peso, subir reps o mantener.
- [ ] Cada ejercicio del plan muestra su objetivo para hoy.

### 8. PWA y pulido
- Instalable con ícono, pantalla completa, carga rápida con red lenta.
- Exportar todos los datos a JSON o CSV.
- [ ] Se usa como app del teléfono y hay un respaldo descargado.

## Estadísticas y progresión

Todas las métricas salen de `workout_sets`, sin series de `calentamiento`. Se guardan series crudas, nunca resultados calculados.

| Métrica | Cálculo | Dónde se ve |
| --- | --- | --- |
| Peso máximo | Mayor `weight_kg` de la sesión | Gráfico por ejercicio |
| 1RM estimado | Epley: `w × (1 + r/30)`, solo series de hasta 12 reps | Gráfico por ejercicio, récords |
| Volumen | Suma de reps × kg | Gráfico por ejercicio, volumen semanal por grupo |
| Series por grupo | Series por semana por `muscle_group` | Balance empuje / tirón / piernas |
| Récords | Mejor peso, mejor 1RM, más reps con un mismo peso | Lista, aviso al guardar |
| Frecuencia | Sesiones y actividades por mes y tipo | Tabla mensual (como la hoja "Total") |
| Soga | Saltos totales y mejor tanda por sesión | Gráfico de soga |

**Progresión doble** con el rango `rep_min`–`rep_max` de la receta (`app/src/lib/progression.ts`, función pura con tests):

1. Si en la última sesión todas las series efectivas llegaron a `rep_max`: subir un salto (2,5 kg barra y mancuerna, 5 kg máquina).
2. Si alguna serie quedó bajo `rep_min` dos sesiones seguidas: bajar 10%.
3. Si no: mismo peso, una rep más en la primera serie que no llegó al tope.

## Importador de Excels

Los archivos están en `docs/*.xlsx` (datos personales, fuera de git). Una prueba con las hojas reales interpretó todas las series sin errores y las sesiones por mes quedaron casi iguales a la hoja "Total". No anotar acá cifras de esos datos: el repo es público.

| Origen | Cómo se lee | Destino |
| --- | --- | --- |
| Hoja mensual, bloque FUERZA (columna B, encabezados en fila 3) | Fila con nombre + **fechas contiguas desde la columna C** = rutina y sus sesiones; filas siguientes = ejercicios, una celda por sesión. Ojo: la columna FECHA del calendario cae en H–J según la hoja, por eso solo cuentan fechas contiguas | `workouts` + `workout_sets` |
| Hoja mensual, BICI FIJA | Columnas FECHA, DISTANCIA, TIEMPO, ubicadas por encabezado (la posición cambia entre hojas) | `activities` tipo Bici |
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
| Nombres de ejercicios duplicados | Selector con búsqueda y unificación en el importador |

**Para decidir:**

- [ ] Tipos de actividad: lista fija o libre con sugerencias (propuesta: libre con sugerencias).
- [ ] Salto de peso para la progresión: por tipo de equipo o configurable por ejercicio.
- [ ] Soga: ¿registrar variantes (doble salto, cruzado) o intervalos?
- [ ] Unidades: solo kg o también libras.
- [x] Nombre: **Gymbo** (repo `gymbo`; dominio: el que dé Vercel, `gymbo.vercel.app` si está libre).
