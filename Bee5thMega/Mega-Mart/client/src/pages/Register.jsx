import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../state/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      await login({ token: data.token })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="container auth">
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        <p className="muted" style={{ marginTop: 0 }}>Join MegaMart to track orders and checkout faster</p>
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="alert">{error}</div>}
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
          <button className="btn primary" type="submit">Register</button>
          <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </div>
  )
}
