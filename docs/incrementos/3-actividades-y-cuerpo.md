# Incremento 3: Actividades y cuerpo

Alcance y criterios: [especificación, incremento 3](../especificacion.md#3-actividades-y-cuerpo).
Rama: `feat/activities-body`.

- [x] **`feat: add activity types page`**
  `ActivityTypesPage` en Más: alta, edición, archivo, campos por tipo, cargar los sugeridos.
- [x] **`feat: register activities by type`**
  `RegisterPage` muestra los campos del tipo elegido; tiempo total de soga calculado en `lib/` con test.
- [x] **`feat: register body weight and daily steps`**
- [x] **`docs: close increment 3`**

👤 Pendiente: una semana completa registrada solo en la app. Cuando se cumpla, tildar el criterio en la especificación y sacar "(falta la semana de prueba)" de la tabla Estado.

**Decidido en el camino:**
- Tiempo de soga: salto = rondas × trabajo; total = salto + (rondas − 1) × descanso.
- Sin pantalla de edición: los últimos registros se borran y se vuelven a cargar.
- Las actividades no aparecen en Historial; se ven en las estadísticas (incremento 5).
- Se sumaron a la especificación las reglas de variantes de ejercicios y de peso de mancuernas.
