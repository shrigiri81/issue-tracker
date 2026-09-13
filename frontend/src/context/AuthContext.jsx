import { createContext, useContext, useState, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { apiLogin } from '../api/client'

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
    return t ? parseUser(t) : null
  })

  const login = useCallback(async (username, password) => {
    const res = await apiLogin(username, password)
    const jwt = res.data
    localStorage.setItem('jwt_token', jwt)
    const u = parseUser(jwt) || { username }
    localStorage.setItem('jwt_user', JSON.stringify(u))
    setToken(jwt)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_user')
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
