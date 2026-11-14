import { NavLink, Outlet } from 'react-router-dom'
import { useI18n, type Texts } from '../lib/i18n'

const tabs: { to: string; label: keyof Texts }[] = [
  { to: '/', label: 'train' },
  { to: '/registrar', label: 'register' },
  { to: '/historial', label: 'history' },
  { to: '/estadisticas', label: 'stats' },
  { to: '/mas', label: 'more' },
]

export default function Layout() {
  const { t } = useI18n()
  return (
    <>
      <main>
        <Outlet />
      </main>
      <nav className="tabs">
        {tabs.map((tab) => (
          // end solo en "/": si no, Entrenar quedaría activa en todas las rutas; Más sigue activa en /mas/grupos
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}>
            {t[tab.label]}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
