# Incremento 2: Registro de sesiones

Alcance y criterios: [especificación, incremento 2](../especificacion.md#2-registro-de-sesiones).
Rama: `feat/workout-logging`.

- [ ] **`feat: add set notation parser`**
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
- [ ] **`feat: repeat last session of a routine`**
- [ ] **`feat: add workout history with edit and delete`**
  `HistoryPage` y detalle de sesión.
- [ ] **`docs: close increment 2`**

👤 Antes del cierre: anotar una sesión real en el gym.

**Para decidir al empezar:** las rutinas se crean recién en el incremento 6. ¿Desde dónde se elige la rutina para "Repetir la última sesión de esta rutina"? Una opción es mover ese commit al incremento 6; otra es repetir cualquier sesión pasada.
