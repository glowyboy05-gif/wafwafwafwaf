"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, BarChart3, Check, ChevronRight, FileText, Globe2, LocateFixed, LockKeyhole, LogOut, Menu, Moon, ScanLine, ShieldCheck, UserRound, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Geolocation } from '@capacitor/geolocation'
import { App as CapacitorApp } from '@capacitor/app'

const logoUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/q-controle-logo-zE07zuJZaNApC9syFlYI4qGPNUgvW9.jpg"

// Translations
const translations = {
  fr: {
    welcome: "Bienvenue sur Q-Control",
    subtitle: "Connectez-vous à votre espace de contrôle mobile.",
    identifier: "Identifiant",
    pin: "Code PIN",
    login: "Se connecter",
    securityAgent: "Agent de sécurité",
    sos: "SOS",
    scan: "SCAN",
    checkpoint: "CHECKPOINT",
    qControl: "Q-Control",
    qPatrol: "Q-Patrol",
    instructions: "Instructions",
    report: "Rapport",
    nightMode: "Mode Nuit",
    language: "Langue",
    logout: "Déconnexion",
    sosConfirm: "Êtes-vous sûr de vouloir envoyer une alerte SOS ?",
    cancel: "Annuler",
    confirm: "Confirmer",
    sosSent: "🚨 Alerte SOS envoyée!",
    checkpointRecorded: "✅ Checkpoint enregistré",
    errorLocation: "Erreur de géolocalisation - Vérifiez les permissions",
    fillAllFields: "Veuillez remplir tous les champs",
    incorrectCredentials: "Identifiant ou code PIN incorrect",
    connectionError: "Erreur de connexion",
    french: "Français",
    english: "English"
  },
  en: {
    welcome: "Welcome to Q-Control",
    subtitle: "Connect to your mobile control space.",
    identifier: "Identifier",
    pin: "PIN Code",
    login: "Login",
    securityAgent: "Security Agent",
    sos: "SOS",
    scan: "SCAN",
    checkpoint: "CHECKPOINT",
    qControl: "Q-Control",
    qPatrol: "Q-Patrol",
    instructions: "Instructions",
    report: "Report",
    nightMode: "Night Mode",
    language: "Language",
    logout: "Logout",
    sosConfirm: "Are you sure you want to send an SOS alert?",
    cancel: "Cancel",
    confirm: "Confirm",
    sosSent: "🚨 SOS Alert sent!",
    checkpointRecorded: "✅ Checkpoint recorded",
    errorLocation: "Location error - Check permissions",
    fillAllFields: "Please fill all fields",
    incorrectCredentials: "Incorrect identifier or PIN code",
    connectionError: "Connection error",
    french: "Français",
    english: "English"
  }
}

function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [employeeId, setEmployeeId] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('fr')

  useEffect(() => {
    const savedLang = localStorage.getItem('q_control_language') || 'fr'
    setLang(savedLang)
  }, [])

  const t = translations[lang as keyof typeof translations]

  async function submit(event: React.FormEvent) { 
    event.preventDefault()
    if (!employeeId || !pin) {
      setError(t.fillAllFields)
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data, error: loginError } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('pin_code', pin)
        .single()

      if (loginError || !data) {
        setError(t.incorrectCredentials)
        setLoading(false)
        return
      }

      await supabase
        .from('employee_presence')
        .upsert({
          employee_id: data.id,
          account_id: data.account_id,
          status: 'online',
          last_seen: new Date().toISOString(),
        }, { onConflict: 'employee_id' })

      localStorage.setItem('q_control_user', JSON.stringify(data))
      onLogin(data)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(t.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <img src={logoUrl} alt="Q-Control" />
        </div>
        <p className="eyebrow">ESPACE SÉCURISÉ</p>
        <h1 id="login-title">{t.welcome}</h1>
        <p className="login-subtitle">{t.subtitle}</p>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="employeeId">{t.identifier}</label>
          <div className="input-wrap">
            <UserRound size={18} />
            <input 
              id="employeeId" 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)} 
              placeholder={t.identifier}
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <label htmlFor="pin">{t.pin}</label>
          <div className="input-wrap">
            <LockKeyhole size={18} />
            <input 
              id="pin" 
              type="password" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder={t.pin}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? '...' : t.login} <ChevronRight size={18} />
          </button>
        </form>
        
        {/* Language selector on login */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={() => { 
              const newLang = lang === 'fr' ? 'en' : 'fr'
              setLang(newLang)
              localStorage.setItem('q_control_language', newLang)
            }}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Globe2 size={16} style={{ display: 'inline', marginRight: '8px' }} />
            {lang === 'fr' ? t.french : t.english}
          </button>
        </div>
        
        <p className="login-help">Accès réservé aux agents autorisés</p>
      </section>
    </main>
  )
}

function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("Q-Control")
  const [night, setNight] = useState(false)
  const [message, setMessage] = useState("")
  const [showSOSConfirm, setShowSOSConfirm] = useState(false)
  const [lang, setLang] = useState('fr')
  
  useEffect(() => {
    const savedLang = localStorage.getItem('q_control_language') || 'fr'
    setLang(savedLang)
  }, [])

  const t = translations[lang as keyof typeof translations]
  
  useEffect(() => {
    if (night) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [night])
  
  useEffect(() => {
    requestLocationPermission()
  }, [])
  
  const requestLocationPermission = async () => {
    try {
      const permission = await Geolocation.checkPermissions()
      if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
        await Geolocation.requestPermissions()
      }
    } catch (error) {
      console.error('Location permission error:', error)
    }
  }
  
  const notify = (text: string) => { 
    setMessage(text)
    window.setTimeout(() => setMessage(""), 2200) 
  }

  const handleScan = () => {
    router.push('/scan')
  }

  const handleSOS = async () => {
    try {
      const permission = await Geolocation.checkPermissions()
      if (permission.location === 'denied') {
        notify(t.errorLocation)
        return
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      })
      
      const sosData = {
        employee_id: user.id,
        account_id: user.account_id || null,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        status: 'Active',
        guard_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Guard',
        guard_phone: user.phone_number || null,
      }
      
      const { error: sosError } = await supabase.from('sos_alerts').insert(sosData)
      
      if (sosError) {
        console.error('SOS insert error:', sosError)
        notify("Erreur SOS")
      } else {
        notify(t.sosSent)
        setShowSOSConfirm(false)
      }
    } catch (error: any) {
      console.error('SOS error:', error)
      notify(t.errorLocation)
    }
  }

  const handleCheckpoint = async () => {
    try {
      const permission = await Geolocation.checkPermissions()
      if (permission.location === 'denied') {
        notify(t.errorLocation)
        return
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      })
      
      await supabase.from('employee_location_tracking').upsert({
        employee_id: user.id,
        account_id: user.account_id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        is_active: true,
        timestamp: new Date().toISOString(),
      }, { onConflict: 'employee_id' })
      
      notify(t.checkpointRecorded)
    } catch (error: any) {
      console.error('Checkpoint error:', error)
      notify(t.errorLocation)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.from('employee_presence').update({
        status: 'offline',
        last_seen: new Date().toISOString(),
      }).eq('employee_id', user.id)
      
      localStorage.removeItem('q_control_user')
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
      onLogout()
    }
  }

  const changeLang = (newLang: string) => {
    setLang(newLang)
    localStorage.setItem('q_control_language', newLang)
    notify(`${newLang === 'fr' ? 'Français' : 'English'}`)
  }

  const nav = [
    { label: t.qControl, icon: ShieldCheck, action: () => setActiveTab("Q-Control") }, 
    { label: t.qPatrol, icon: BarChart3, action: () => { setActiveTab("Q-Patrol"); notify(t.qPatrol) } }, 
    { label: t.instructions, icon: FileText, action: () => { setActiveTab("Instructions"); router.push('/instructions') } }
  ]

  const userName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Agent'
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  const profilePhoto = user?.photo || null

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="profile">
          <div className="avatar">
            {profilePhoto ? (
              <img src={profilePhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              initials
            )}
          </div>
          <div>
            <strong>{userName}</strong>
            <span>{t.securityAgent}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="sos-button" onClick={() => setShowSOSConfirm(true)}>
            <AlertTriangle size={16} fill="currentColor" /> {t.sos}
          </button>
          <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={22} />
          </button>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="brand-orbit">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="brand-logo">
            <img src={logoUrl} alt="Logo Q-Control" />
          </div>
        </div>
        <h1>Q-Control Mobile</h1>
        <p className="tagline">Stay Safe, Stay Connected</p>
        <div className="action-stack">
          <button className="action-button scan" onClick={handleScan}>
            <ScanLine size={22} />
            <span>{t.scan}</span>
          </button>
          <button className="action-button checkpoint" onClick={handleCheckpoint}>
            <LocateFixed size={22} fill="currentColor" />
            <span>{t.checkpoint}</span>
          </button>
        </div>
      </section>
      <nav className="bottom-nav" aria-label="Navigation principale">
        {nav.map(({ label, icon: Icon, action }) => (
          <button 
            key={label} 
            className={activeTab === label ? "active" : ""} 
            onClick={() => action()}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {message && (
        <div className="toast" role="status">
          <Check size={16} />{message}
        </div>
      )}
      
      {/* SOS Confirmation Modal */}
      {showSOSConfirm && (
        <>
          <div className="drawer-overlay" onClick={() => setShowSOSConfirm(false)} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            zIndex: 1001,
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#dc2626' }}>
              ⚠️ {t.sos}
            </h2>
            <p style={{ marginBottom: '30px', fontSize: '16px', color: '#334155' }}>
              {t.sosConfirm}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSOSConfirm(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSOS}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </>
      )}
      
      {menuOpen && (
        <>
          <button className="drawer-overlay" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />
          <aside className="drawer">
            <div className="drawer-head">
              <div className="profile">
                <div className="avatar">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <strong>{userName}</strong>
                  <span>{t.securityAgent}</span>
                </div>
              </div>
              <button className="close-button" onClick={() => setMenuOpen(false)} aria-label="Fermer">
                <X />
              </button>
            </div>
            <div className="drawer-items">
              <button onClick={() => { setMenuOpen(false); router.push('/rapport') }}>
                <FileText />{t.report}
              </button>
              <button onClick={() => { setMenuOpen(false); handleCheckpoint() }}>
                <LocateFixed />{t.checkpoint}
              </button>
              <div className="drawer-row">
                <span>
                  <Moon />{t.nightMode}
                </span>
                <button className={`switch ${night ? "on" : ""}`} onClick={() => setNight(!night)} aria-label="Activer le mode nuit">
                  <span />
                </button>
              </div>
              <button onClick={() => {
                const newLang = lang === 'fr' ? 'en' : 'fr'
                changeLang(newLang)
              }}>
                <Globe2 />{t.language} <small>{lang === 'fr' ? t.french : t.english}</small><ChevronRight />
              </button>
            </div>
            <button className="logout" onClick={handleLogout}>
              <LogOut />{t.logout}
            </button>
          </aside>
        </>
      )}
    </main>
  )
}

export default function Home() { 
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('q_control_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      setLoading(false)
    }
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>
  }

  return user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />
}
