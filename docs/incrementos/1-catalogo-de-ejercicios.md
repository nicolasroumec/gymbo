# Incremento 1: Catálogo de ejercicios

Alcance y criterios: [especificación, incremento 1](../especificacion.md#1-catálogo-de-ejercicios).
Rama: `feat/exercise-catalog`.

- [x] **`feat: add editable muscle groups and catalog domain logic`**
  Migración `muscle_groups`, tipos regenerados, `lib/video.ts`, `lib/numbers.ts`, `lib/exercises.ts`, `lib/muscleGroups.ts` con sus tests.
- [x] **`feat: add muscle groups page`**
  `MuscleGroupsPage` con ruta y link en Más: alta, renombrar, cambiar bloque, archivar, borrar si no tiene ejercicios, cargar los sugeridos si la lista está vacía.
- [ ] **`feat: add exercise list with search and group filter`**
  `ExercisesPage` con ruta y link en Más: buscador, filtro por grupo, ver archivados.
- [ ] **`feat: add exercise create and edit form`**
  `ExerciseFormPage` (nuevo y editar): grupo, equipo, salto de peso, video con minuto, nota fija.
- [ ] **`feat: archive exercises with history instead of deleting`**
  Borrar solo si no tiene series en `workout_sets`; si tiene, archivar.
- [ ] **`docs: close increment 1`**
  Tildar el criterio y actualizar la tabla Estado.

👤 Antes del cierre: cargar los ejercicios de la rutina actual desde la app.
