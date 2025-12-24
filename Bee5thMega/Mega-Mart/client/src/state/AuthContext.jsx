import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/profile')
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function login({ token }) {
    localStorage.setItem('token', token)
    return api.get('/auth/profile').then(({ data }) => {
      setUser(data)
      return data
    })
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = { user, setUser, login, logout }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
