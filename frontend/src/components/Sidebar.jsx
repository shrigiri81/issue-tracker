import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'

const NAV_ITEMS = [
  { icon: 'grid_view', label: 'Dashboard', to: '/' },
  { icon: 'folder', label: 'Projects', to: '/projects' },
  { icon: 'person', label: 'Profile', to: '/profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white z-50 flex flex-col justify-between border-r border-[#e5eeff]" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex flex-col">
        {/* Logo */}
        <div className="h-[3.25rem] px-3 flex items-center justify-between border-b border-[#e5eeff]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#4450b7] flex items-center justify-center text-white font-semibold text-[13px] font-[Geist,sans-serif]">P</div>
            <span className="font-semibold text-[15px] text-[#0b1c30] tracking-tight font-[Geist,sans-serif]">Pulse</span>
          </div>
        </div>

        {/* Workspace label */}
        <div className="px-3 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-[#767684] uppercase tracking-wider px-2 font-[Geist,sans-serif]">Workspace</span>
        </div>

        {/* Navigation */}
        <nav className="px-2 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#dce9ff] text-[#4450b7] font-semibold'
                    : 'text-[#454652] hover:bg-[#e5eeff] hover:text-[#0b1c30] font-normal'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              <span className="font-[Inter,sans-serif]">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User area */}
      <div className="p-2 border-t border-[#e5eeff] flex flex-col gap-1">
        {user ? (
          <>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#eff4ff] transition-colors w-full text-left"
            >
              <Avatar name={user?.username} size="md" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-[#0b1c30] truncate font-[Geist,sans-serif]">{user?.username || 'User'}</span>
                <span className="text-[11px] text-[#565e74] truncate font-[Inter,sans-serif]">{user?.email || 'Member'}</span>
              </div>
            </button>
            <div className="flex items-center justify-between px-2 py-1">
              <NavLink
                to="/profile"
                className="flex items-center gap-1 text-[11px] text-[#767684] hover:text-[#0b1c30] transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">settings</span>
                <span className="font-[Geist,sans-serif]">Preferences</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-[11px] text-[#767684] hover:text-[#ba1a1a] transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                <span className="font-[Geist,sans-serif]">Exit</span>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#4450b7] hover:bg-[#3540a0] text-white text-[12px] font-semibold transition-colors font-[Geist,sans-serif]"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            Sign in
          </button>
        )}
      </div>
    </aside>
  )
}
