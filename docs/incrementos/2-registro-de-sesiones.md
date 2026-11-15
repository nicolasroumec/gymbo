# Incremento 2: Registro de sesiones

Alcance y criterios: [especificación, incremento 2](../especificacion.md#2-registro-de-sesiones).
Rama: `feat/workout-logging`.

- [x] **`feat: add set notation parser`**
  `lib/sets.ts` (`parse` y `format`) con la tabla de ejemplos como tests e ida y vuelta.
- [ ] **`feat: add previous sets lookup`**
  `lib/previous.ts` y test.
- [ ] **`feat: add personal record detection`**
  `lib/records.ts` y test.
- [ ] **`feat: add local workout draft`**
  `lib/draft.ts` y test.
- [ ] **`feat: add workout logging grid`**
  `WorkoutPage`: elegir ejercicios con búsqueda, grilla kg/reps/✓ con columna Anterior, nota fija, guardar usando el borrador.
- [ ] **`feat: add set types, tempo and supersets to workout grid`**
- [ ] **`feat: add notation shortcut to workout grid`**
  Campo de texto por ejercicio que rellena la grilla con `parse`.
- [ ] **`feat: add rest timer and record alert`**
- [ ] **`feat: add workout history with edit and delete`**
  `HistoryPage` y detalle de sesión.
- [ ] **`feat: repeat a past session`**
  Botón "Repetir" en el detalle de una sesión: arma una sesión nueva con sus ejercicios.
- [ ] **`docs: close increment 2`**

👤 Antes del cierre: anotar una sesión real en el gym.

**Decidido al empezar:**
- "Repetir" se hace desde cualquier sesión del historial; "la última de esta rutina" se suma en el incremento 6, cuando existan las rutinas.
- Los récords se calculan en `lib/records.ts` a partir de las series del ejercicio, sin migración. La vista `personal_records` queda para el incremento 5 si hace falta.
- Cierre: incluir lo que quedó afuera del merge del incremento 1 (Estado "Terminado" y criterio tildado).
