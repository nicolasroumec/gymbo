---
paths:
  - "app/src/**"
---
# Convenciones del frontend

- El cliente de Supabase se crea una sola vez en `app/src/lib/supabase.ts`, tipado con `Database` de `database.types.ts`. Ese archivo es generado: no se edita a mano.
- Cada consulta revisa `error` antes de usar `data`; un error se muestra en pantalla, traducido, no solo en la consola.
- Mobile first: se diseña para 360 px de ancho y se usa con una mano en el gym. Botones de al menos 44 px de alto, `inputMode="decimal"` o `"numeric"` en campos de números, sin depender del hover.
- Formularios: nunca perder lo escrito por un error de red. La sesión en curso se guarda como borrador en localStorage hasta que el guardado en Supabase confirma.
- Estilos con CSS plano (`index.css` + clases) y colores solo por variables CSS. Modo claro y oscuro: sigue a `prefers-color-scheme` salvo que el usuario elija uno en Más.
- Textos: siempre con el hook de `lib/i18n.tsx`, en español e inglés; agregar una clave implica escribir las dos.
- Una pantalla por archivo en `app/src/pages/`. Componentes reutilizables en `app/src/components/`, solo cuando se usan en dos o más lugares.
