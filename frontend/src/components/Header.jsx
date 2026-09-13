import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderKanban, CheckCircle2, LogIn } from 'lucide-react'
import { apiSearch } from '../api/client'
import Avatar from './Avatar'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return }
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await apiSearch(query)
        setResults(Array.isArray(res.data) ? res.data : [])
        setShowResults(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Click outside to close
  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setShowResults(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleResultClick = (r) => {
    setQuery('')
    setShowResults(false)
    if (r.type === 'PROJECT') navigate(`/projects/${r.id}`)
    else if (r.type === 'ISSUE') navigate(`/issues/${r.id}`)
  }

  return (
    <header
      className="fixed top-0 left-60 right-0 h-[3.25rem] z-40 flex items-center justify-between px-4 gap-4"
      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg" ref={searchRef}>
        <div className="relative w-full">
          <div className="flex items-center gap-2 w-full bg-[#eff4ff] px-3 py-1.5 rounded-lg text-[#454652] hover:bg-[#e5eeff] transition-colors">
            <Search className="w-4 h-4 text-[#767684]" />
            <input
              className="bg-transparent border-none outline-none text-[13px] text-[#0b1c30] placeholder:text-[#767684] flex-1 font-[Inter,sans-serif]"
              placeholder="Search issues, projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query && setShowResults(true)}
            />
            <kbd className="text-[11px] bg-white px-1.5 py-0.5 rounded shadow-sm text-[#767684] font-mono">⌘K</kbd>
          </div>

          {/* Search results dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-xl border border-[#e5eeff] shadow-xl z-50 overflow-hidden" style={{ boxShadow: '0 10px 30px rgba(11,28,48,0.1)' }}>
              {loading && (
                <div className="px-4 py-2 text-[12px] text-[#767684]">Searching...</div>
              )}
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleResultClick(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#eff4ff] transition-colors text-left"
                >
                  {r.type === 'PROJECT' ? (
                    <FolderKanban className="w-4 h-4 text-[#767684]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#767684]" />
                  )}
                  <div>
                    <p className="text-[13px] text-[#0b1c30] font-medium">{r.name}</p>
                    <p className="text-[11px] text-[#565e74]">{r.type}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center"
            title={user?.username}
          >
            <Avatar name={user?.username} size="md" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="h-8 px-3 bg-[#4450b7] hover:bg-[#3540a0] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors font-[Geist,sans-serif]"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </button>
        )}
      </div>
    </header>
  )
}
