# Incremento 4: Importador de Excels

Alcance y criterios: [especificación, incremento 4](../especificacion.md#4-importador-de-excels).
Rama: `feat/excel-import`.

Los tests usan celdas inventadas escritas en el test; los `.xlsx` reales nunca entran en un commit.

- [ ] **`build: add xlsx dependency`**
- [ ] **`feat: add exercise list and body weight readers`**
  `lib/import/` para Lista de ejercicios.xlsx y Peso.xlsx, con tests.
- [ ] **`feat: add strength block reader`**
  Bloque FUERZA a `workouts` y `workout_sets`, con los casos especiales de la especificación.
- [ ] **`feat: add bike, calendar and steps readers`**
- [ ] **`feat: detect similar exercise names`**
  `lib/import/similar.ts` y test.
- [ ] **`feat: add import page with preview`**
  `ImportPage`: subir archivo, conteos por mes, avisos; todavía no guarda.
- [ ] **`feat: save imports without duplicates`**
  Confirmar y guardar, crear tipos y ejercicios faltantes; reimportar no duplica (fecha + rutina). Si hace falta un índice único, va en su propia migración.
- [ ] **`docs: close increment 4`**

👤 Antes del cierre: importar 2025 y 2026 y comparar con la hoja "Total".
