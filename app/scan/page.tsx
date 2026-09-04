"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Html5Qrcode } from "html5-qrcode"

export default function ScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [error, setError] = useState("")
  const [permissionGranted, setPermissionGranted] = useState(false)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  // Request camera permission and start scanner
  useEffect(() => {
    requestCameraAndStart()
    
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const requestCameraAndStart = async () => {
    try {
      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      
      // Permission granted, stop the test stream
      stream.getTracks().forEach(track => track.stop())
      setPermissionGranted(true)
      
      // Now start the actual scanner
      await startScanner()
    } catch (error: any) {
      console.error('Camera permission error:', error)
      setError("Permission caméra refusée. Activez la caméra dans les paramètres.")
      setPermissionGranted(false)
    }
  }

  const startScanner = async () => {
    try {
      setScanning(true)
      setError("")
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader")
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          // QR code detected
          console.log("QR Code detected:", decodedText)
          await handleScanResult(decodedText)
        },
        (errorMessage) => {
          // Scanning errors (normal during scanning)
        }
      )
    } catch (error: any) {
      console.error('Scanner start error:', error)
      setError("Erreur: Impossible de démarrer la caméra")
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop()
      }
      setScanning(false)
    } catch (error) {
      console.error('Scanner stop error:', error)
      setScanning(false)
    }
  }

  const handleScanResult = async (scannedCode: string) => {
    try {
      await stopScanner()
      
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      
      console.log('Scanned QR code:', scannedCode)

      // Try to find in different tables
      
      // Check employees
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', scannedCode)
        .single()

      if (employee) {
        setScannedData({ type: 'employee', data: employee })
        setShowModal(true)
        return
      }

      // Check visitors
      const { data: visitor } = await supabase
        .from('visitors')
        .select('*')
        .eq('id', scannedCode)
        .single()

      if (visitor) {
        setScannedData({ type: 'visitor', data: visitor })
        setShowModal(true)
        return
      }

      // Check vehicles
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', scannedCode)
        .single()

      if (vehicle) {
        setScannedData({ type: 'vehicle', data: vehicle })
        setShowModal(true)
        return
      }

      // Check patrol points
      const { data: patrolPoint } = await supabase
        .from('patrol_points')
        .select('*')
        .or(`id.eq.${scannedCode},point_name.ilike.%${scannedCode}%`)
        .single()

      if (patrolPoint) {
        // Auto-record patrol scan
        await supabase.from('patrol_scans').insert({
          patrol_point_id: patrolPoint.id,
          employee_id: user.id,
          account_id: user.account_id,
          scan_timestamp: new Date().toISOString(),
          status: 'completed'
        })
        
        setResult({ message: `Patrol Point: ${patrolPoint.point_name}`, success: true })
        setTimeout(() => router.push('/'), 2000)
        return
      }

      // Unknown QR code
      setResult({ message: 'QR code inconnu', success: false })
      setTimeout(() => router.push('/'), 2000)
      
    } catch (error) {
      console.error('Scan processing error:', error)
      setResult({ message: 'Erreur lors du scan', success: false })
      setTimeout(() => router.push('/'), 2000)
    }
  }

  const handleAction = async (action: 'enter' | 'exit', target: 'person' | 'vehicle') => {
    try {
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      const timestamp = new Date().toISOString()

      if (target === 'person') {
        // Record person entry/exit
        await supabase.from('access_logs').insert({
          entity_id: scannedData.data.id,
          entity_type: scannedData.type,
          action: action,
          timestamp: timestamp,
          employee_id: user.id,
          account_id: user.account_id
        })
      } else if (target === 'vehicle' && scannedData.type === 'vehicle') {
        // Record vehicle entry/exit
        await supabase.from('vehicle_access_logs').insert({
          vehicle_id: scannedData.data.id,
          action: action,
          timestamp: timestamp,
          employee_id: user.id,
          account_id: user.account_id
        })
      }

      setShowModal(false)
      setResult({ message: `${action === 'enter' ? 'Entrée' : 'Sortie'} enregistrée`, success: true })
      setTimeout(() => router.push('/'), 1500)
      
    } catch (error) {
      console.error('Action error:', error)
      setResult({ message: 'Erreur', success: false })
    }
  }

  const goBack = () => {
    stopScanner()
    router.push('/')
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      }}>
        <button 
          onClick={goBack}
          style={{ 
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          <X size={24} />
        </button>
        <h2 style={{ color: 'white', margin: 0 }}>Scanner QR Code</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Permission Error */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '30px',
          borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          fontSize: '16px',
          textAlign: 'center',
          zIndex: 20,
          maxWidth: '80%'
        }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>⚠️ Erreur Caméra</p>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={goBack}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Retour
          </button>
        </div>
      )}

      {/* Loading indicator while requesting permission */}
      {!permissionGranted && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px',
          textAlign: 'center',
          zIndex: 20
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Demande de permission caméra...</p>
        </div>
      )}

      {/* Full Screen Camera */}
      {scanning && permissionGranted && (
        <div 
          id="qr-reader" 
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        />
      )}

      {/* Result Message */}
      {result && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px 40px',
          borderRadius: '12px',
          backgroundColor: result.success ? '#10b981' : '#ef4444',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          zIndex: 20,
          textAlign: 'center'
        }}>
          {result.message}
        </div>
      )}

      {/* Modal for Person/Vehicle Actions */}
      {showModal && scannedData && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 100
            }}
            onClick={() => setShowModal(false)}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            zIndex: 101,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            {/* Close button */}
            <button
              onClick={() => { setShowModal(false); router.push('/') }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>

            {/* Person Info */}
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>
              {scannedData.type === 'employee' && '👤 Employé'}
              {scannedData.type === 'visitor' && '👤 Visiteur'}
              {scannedData.type === 'vehicle' && '🚗 Véhicule'}
            </h2>
            
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#334155' }}>
              {scannedData.data.full_name || scannedData.data.name || scannedData.data.license_plate || 'N/A'}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scannedData.type !== 'vehicle' && (
                <>
                  <button
                    onClick={() => handleAction('enter', 'person')}
                    style={{
                      padding: '16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ✅ Entrée
                  </button>
                  <button
                    onClick={() => handleAction('exit', 'person')}
                    style={{
                      padding: '16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Sortie
                  </button>
                </>
              )}

              {scannedData.type === 'vehicle' && (
                <>
                  <button
                    onClick={() => handleAction('enter', 'vehicle')}
                    style={{
                      padding: '16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🚗 Véhicule Entrée
                  </button>
                  <button
                    onClick={() => handleAction('exit', 'vehicle')}
                    style={{
                      padding: '16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🚗 Véhicule Sortie
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
