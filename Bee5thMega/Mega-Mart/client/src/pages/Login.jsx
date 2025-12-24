import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [needOtp, setNeedOtp] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    try {
      if (!needOtp) {
        // Step 1: request OTP
        const { data } = await api.post('/auth/login', { email, password })
        if (data.needOtp) {
          setNeedOtp(true)
          setInfo('We have sent a verification code to your email. Enter it below to continue.')
          return
        }
        // In case backend returns token directly (fallback)
        if (data?.token) {
          await login({ token: data.token })
          navigate('/')
        }
      } else {
        // Step 2: verify OTP
        const { data } = await api.post('/auth/verify-otp', { email, otp })
        await login({ token: data.token })
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="container auth">
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        <p className="muted" style={{ marginTop: 0 }}>Login to continue shopping</p>
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="alert">{error}</div>}
          {info && <div className="badge" style={{ background:'#eef2ff', borderColor:'#c7d2fe' }}>{info}</div>}
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          {needOtp && (
            <>
              <label>Verification code (OTP)</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="6-digit code" maxLength={6} />
            </>
          )}
          <button className="btn primary" type="submit">{needOtp ? 'Verify OTP' : 'Login'}</button>
          <p className="muted" style={{ margin: '6px 0 0' }}>We send a verification email/code to your registered address.</p>
          <p className="muted">Don't have an account? <Link to="/register">Register</Link></p>
        </form>
      </div>
    </div>
  )
}
