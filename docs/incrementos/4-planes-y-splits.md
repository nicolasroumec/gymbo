# Incremento 4: Planes y splits

Alcance y criterios: [especificación, incremento 4](../especificacion.md#4-planes-y-splits).
Rama: `feat/routines`.

- [x] **`feat: add routines page with cycle order`**
  `RoutinesPage`: lista, alta, archivo, reordenar el ciclo.
- [x] **`feat: add routine recipe form`**
  `RoutineFormPage`: ejercicios en orden, series objetivo, rango de reps, tipo por defecto, descanso, superseries.
- [x] **`feat: add training cycle logic`**
  `lib/cycle.ts` y test.
- [x] **`feat: build today's workout from routine`**
  Pestaña Entrenar = "Hoy toca", con la columna Anterior.
- [x] **`docs: close increment 4`**

👤 Pendiente: abrir la app en el gym y que la sesión del día esté armada. Cuando se cumpla, tildar el criterio en la especificación y sacar "(falta probarlo en el gym)" de la tabla Estado.

**Decidido en el camino:**
- La lógica del ciclo y "Hoy toca" fueron en un solo commit.
- "Empezar" con un toque, no automático.
- Reordenar con botones ↑↓, sin librería de arrastrar.
- La receta se guarda reemplazándola completa (borrar e insertar), como las series de una sesión.
- Si la última rutina hecha fue archivada, el ciclo sigue desde su lugar.
