import { useState, useCallback, useRef, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function readCollapsed() {
  try { return localStorage.getItem('pulse_sidebar_collapsed') === 'true' } catch { return false }
}

export default function Layout({ children }) {
  const initial = readCollapsed()
  const [isCollapsed, setIsCollapsed] = useState(initial)
  const [headerCollapsed, setHeaderCollapsed] = useState(initial)
  const [widthOpen, setWidthOpen] = useState(!initial)
  const [animClass, setAnimClass] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  const timers = useRef([])
  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => () => clearAllTimers(), [])

  // ── Collapse flow: sidebar rolls up into topbar → swamps into the pill ──
  const handleCollapse = useCallback(() => {
    clearAllTimers()
    try { localStorage.setItem('pulse_sidebar_collapsed', 'true') } catch {}
    setIsCollapsed(true)
    setIsAnimating(true)

    // Phase 1 (0ms): Sidebar begins rolling up towards topbar
    setAnimClass('sidebar-roll-up')

    // Phase 2 (90ms): Outer column begins closing width smoothly
    timers.current.push(setTimeout(() => {
      setWidthOpen(false)
    }, 90))

    // Phase 3 (270ms): Sidebar reaches the topbar → header switches to pill ("swamps into the pill")
    timers.current.push(setTimeout(() => {
      setHeaderCollapsed(true)
    }, 270))

    // Phase 4 (440ms): Animation settled
    timers.current.push(setTimeout(() => {
      setAnimClass('')
      setIsAnimating(false)
    }, 440))
  }, [])

  // ── Expand flow: pill drops out → sidebar unrolls downward into place ──
  const handleExpand = useCallback(() => {
    clearAllTimers()
    try { localStorage.setItem('pulse_sidebar_collapsed', 'false') } catch {}
    setIsCollapsed(false)
    setIsAnimating(true)

    // Phase 1 (0ms): Column width opens and sidebar begins unrolling downward
    setWidthOpen(true)
    setAnimClass('sidebar-drop-in')

    // Phase 2 (70ms): Header transitions from pill to logo as sidebar unrolls down
    timers.current.push(setTimeout(() => {
      setHeaderCollapsed(false)
    }, 70))

    // Phase 3 (450ms): Settled
    timers.current.push(setTimeout(() => {
      setAnimClass('')
      setIsAnimating(false)
    }, 450))
  }, [])

  const toggle = useCallback(() => {
    if (isCollapsed) {
      handleExpand()
    } else {
      handleCollapse()
    }
  }, [isCollapsed, handleExpand, handleCollapse])

  const collapse = useCallback(() => {
    if (!isCollapsed) {
      handleCollapse()
    }
  }, [isCollapsed, handleCollapse])

  const outerStyle = {
    flexShrink: 0,
    width: widthOpen ? '16rem' : 0,
    marginRight: widthOpen ? '0.875rem' : 0,
    position: 'relative',
    zIndex: isAnimating ? 30 : 1,
    overflow: isAnimating ? 'visible' : (widthOpen ? 'visible' : 'hidden'),
    transition: 'width 420ms cubic-bezier(0.22, 1, 0.36, 1), margin-right 420ms cubic-bezier(0.22, 1, 0.36, 1)',
    pointerEvents: !widthOpen && !isAnimating ? 'none' : 'auto',
    opacity: !widthOpen && !isAnimating ? 0 : 1,
  }

  return (
    <div
      className="bg-[#f4f6fb] p-3 flex flex-col gap-3.5"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* Full-width floating header */}
      <Header collapsed={headerCollapsed} onToggle={toggle} />

      {/* Split body: visible overflow during roll-up so top strip can cross into header */}
      <div
        className="flex-1 min-h-0 flex relative"
        style={{ overflow: isAnimating ? 'visible' : 'hidden' }}
      >
        {/* Sidebar outer clip (width-animating) */}
        <div style={outerStyle}>
          {/* Sidebar inner (plays keyframe roll-up / drop-in) */}
          <div
            className={animClass}
            style={{
              height: '100%',
              width: '16rem',
              flexShrink: 0,
              willChange: isAnimating ? 'transform, clip-path, opacity' : 'auto',
            }}
          >
            <Sidebar onCollapse={collapse} />
          </div>
        </div>

        {/* Main content panel */}
        <main className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-y-auto min-w-0">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}
