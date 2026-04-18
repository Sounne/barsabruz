import React from 'react'
import { signUp, signIn } from '../services'

// ─────────── INPUT FIELD ───────────
const Field = ({ label, type = 'text', value, onChange, placeholder, autoComplete }) => (
  <div>
    <label style={{
      fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      display: 'block', marginBottom: 6,
    }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      style={{
        width: '100%', padding: '13px 14px',
        border: '1.5px solid var(--line)', borderRadius: 12,
        fontSize: 15, fontFamily: 'inherit', color: 'var(--ink)',
        background: '#fff', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--terracotta)'}
      onBlur={e => e.target.style.borderColor = 'var(--line)'}
    />
  </div>
)

// ─────────── AUTH SCREEN ───────────
const AuthScreen = () => {
  const [mode, setMode] = React.useState('login') // 'login' | 'signup' | 'verify'
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSignup = async () => {
    if (!name.trim()) { setError('Entre ton prénom.'); return }
    if (!email.trim()) { setError('Entre ton adresse email.'); return }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    setError('')
    setLoading(true)
    try {
      await signUp(email.trim(), password, name.trim())
      setMode('verify')
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Remplis tous les champs.'); return }
    setError('')
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      // AuthContext will pick up the new session automatically
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('invalid')) {
        setError('Email ou mot de passe incorrect.')
      } else {
        setError(msg || 'Erreur de connexion.')
      }
    } finally {
      setLoading(false)
    }
  }

  const btnStyle = (disabled) => ({
    width: '100%', padding: 15,
    background: disabled ? 'var(--line-strong)' : 'var(--terracotta)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'pointer',
    boxShadow: disabled ? 'none' : '0 4px 14px rgba(198,93,61,0.35)',
    transition: 'background 0.15s',
  })

  // ── Email verify state ──
  if (mode === 'verify') {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper)', padding: '40px 28px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>📬</div>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: '0 0 12px' }}>
          Vérifie tes emails
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 32px', maxWidth: 300 }}>
          Un lien de confirmation a été envoyé à <strong>{email}</strong>. Clique dessus pour activer ton compte.
        </p>
        <button onClick={() => setMode('login')} style={{
          background: 'none', border: 'none', color: 'var(--terracotta)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--paper)',
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 28px 32px',
        background: `linear-gradient(160deg, #C65D3D 0%, #A04530 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }}>
          <defs>
            <pattern id="authDots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.8" fill="#fff"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#authDots)"/>
        </svg>
        <div style={{ position: 'relative' }}>
          <div className="serif" style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            Bars à Bruz
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            {mode === 'login' ? 'Content de te revoir 👋' : 'Rejoins la communauté 🍻'}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: '#fff', borderRadius: 12,
          border: '1.5px solid var(--line)', marginBottom: 28, padding: 4,
        }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 9,
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                background: mode === m ? 'var(--terracotta)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--ink-mute)',
                transition: 'all 0.18s',
              }}>
              {m === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <Field
              label="Prénom"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enzo"
              autoComplete="given-name"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="moi@exemple.fr"
            autoComplete="email"
          />
          <Field
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Au moins 6 caractères' : '••••••••'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(198,93,61,0.08)', border: '1px solid rgba(198,93,61,0.25)',
            borderRadius: 10, fontSize: 13, color: 'var(--terracotta)', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}
          style={{ ...btnStyle(loading), marginTop: 24 }}
        >
          {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </div>
    </div>
  )
}

export { AuthScreen }
