---
name: incremento
description: Trabaja un incremento del plan de docs/especificacion.md de punta a punta (planificar, implementar, verificar, cerrar).
disable-model-invocation: true
argument-hint: [numero-de-incremento]
---

Trabajá el incremento $ARGUMENTS de `docs/especificacion.md`.

1. **Contexto.** Leé la sección del incremento, la tabla Estado y las secciones de la especificación que toque (modelo de datos, notación, estadísticas). Si un incremento anterior no está cerrado, avisá y preguntá antes de seguir.
2. **Plan.** Proponé un plan corto: archivos a crear o cambiar, migraciones necesarias, funciones puras y sus tests, pantallas. Si algo de la especificación es ambiguo o choca con lo que ya existe, preguntá ahora. Esperá el OK del usuario antes de escribir código.
3. **Lógica primero.** La lógica de dominio va en `app/src/lib/` con tests escritos antes o junto con el código (`npx vitest run <archivo>`).
4. **Base de datos.** Si hace falta una tabla o columna, usá el skill `migracion`. Aplicar con `db push` requiere OK del usuario.
5. **UI.** Pantallas en `app/src/pages/`. Probalas con `npm run dev` a 360 px de ancho (Claude in Chrome si está disponible) y mostrá una captura al usuario.
6. **Verificación.**
   - `npm run check` en `app/`, mostrando la salida.
   - Si hubo migraciones, auth o manejo de claves: delegá en el subagente `revisor-seguridad` y resolvé lo que encuentre.
   - Recorré cada criterio `[ ]` del incremento y decí cómo lo comprobaste. Los criterios que dependen del usuario (por ejemplo, usarlo en el gym) quedan sin tildar hasta que confirme.
7. **Cierre.**
   - Actualizá la tabla Estado y tildá los criterios cumplidos en `docs/especificacion.md`.
   - Si una decisión cambió la especificación, actualizala en el mismo cambio.
   - Explicá en 3 a 5 líneas los conceptos nuevos de React, TypeScript o Supabase que aparecieron.
   - Proponé un mensaje de commit en español. Commiteá solo si el usuario lo pide.
