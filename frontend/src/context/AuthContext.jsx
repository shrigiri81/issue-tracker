import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { apiLogin, apiGetUsers } from '../api/client'
import { queryClient } from '../queryClient'

const AuthContext = createContext(null)

function parseUser(token) {
  try {
    const decoded = jwtDecode(token)
    return { username: decoded.sub, ...decoded }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token'))
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('jwt_token')
    const saved = localStorage.getItem('jwt_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return t ? parseUser(t) : null
  })

  // Resolve userId if not yet populated
  useEffect(() => {
    if (token && user?.username && !user?.userId) {
      apiGetUsers()
        .then((res) => {
          const list = res?.data || []
          const me = list.find((u) => u.username === user.username)
          if (me?.userId) {
            setUser((prev) => {
              const updated = { ...prev, userId: me.userId, email: me.email || prev?.email }
              localStorage.setItem('jwt_user', JSON.stringify(updated))
              return updated
            })
          }
        })
        .catch(() => {})
    }
  }, [token, user?.username, user?.userId])

  const login = useCallback(async (username, password) => {
    const res = await apiLogin(username, password)
    const jwt = res.data
    localStorage.setItem('jwt_token', jwt)
    let u = parseUser(jwt) || { username }
    try {
      const usersRes = await apiGetUsers()
      const me = (usersRes.data || []).find((x) => x.username === username)
      if (me?.userId) {
        u = { ...u, userId: me.userId, email: me.email }
      }
    } catch {}
    localStorage.setItem('jwt_user', JSON.stringify(u))
    setToken(jwt)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_user')
    queryClient.clear()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
