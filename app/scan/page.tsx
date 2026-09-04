"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import jsQR from 'jsqr'

export default function ScanPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Auto-start camera when page loads
    startCamera()
  }, [])

  const startCamera = async () => {
    try {
      setScanning(true)
      
      // Take a photo using Capacitor Camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false,
        correctOrientation: true
      })

      // Convert to image data and scan for QR code
      if (image.webPath) {
        await decodeQRFromImage(image.webPath)
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.message && err.message.includes('cancel')) {
        // User cancelled
        router.push('/')
      } else {
        setError("Erreur caméra: " + err.message)
      }
    } finally {
      setScanning(false)
    }
  }

  const decodeQRFromImage = async (imagePath: string) => {
    try {
      // Create image element
      const img = new Image()
      img.src = imagePath
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // Create canvas to get image data
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) {
        setError("Erreur canvas")
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      context.drawImage(img, 0, 0)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code && code.data) {
        console.log('QR code found:', code.data)
        await handleScanResult(code.data)
      } else {
        setError("Aucun QR code trouvé. Réessayez.")
        setTimeout(() => router.push('/'), 2000)
      }
    } catch (err: any) {
      console.error('Decode error:', err)
      setError("Erreur de décodage: " + err.message)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  const handleScanResult = async (scannedCode: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      
      console.log('Processing QR code:', scannedCode)

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
        await supabase.from('patrol_scans').insert({
          patrol_point_id: patrolPoint.id,
          employee_id: user.id,
          account_id: user.account_id,
          scan_timestamp: new Date().toISOString(),
          status: 'completed'
        })
        
        setResult({ message: `Point: ${patrolPoint.point_name}`, success: true })
        setTimeout(() => router.push('/'), 2000)
        return
      }

      setResult({ message: 'QR code inconnu', success: false })
      setTimeout(() => router.push('/'), 2000)
      
    } catch (error) {
      console.error('Processing error:', error)
      setResult({ message: 'Erreur', success: false })
      setTimeout(() => router.push('/'), 2000)
    }
  }

  const handleAction = async (action: 'enter' | 'exit', target: 'person' | 'vehicle') => {
    try {
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      const timestamp = new Date().toISOString()

      if (target === 'person') {
        await supabase.from('access_logs').insert({
          entity_id: scannedData.data.id,
          entity_type: scannedData.type,
          action: action,
          timestamp: timestamp,
          employee_id: user.id,
          account_id: user.account_id
        })
      } else if (target === 'vehicle') {
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

  const handleClose = () => {
    router.push('/')
  }

  const handleRetry = () => {
    setError("")
    startCamera()
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
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Scanning indicator */}
      {scanning && !error && (
        <div style={{ color: 'white', fontSize: '18px' }}>
          📸 Scan en cours...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          <p style={{ margin: 0, marginBottom: '15px' }}>⚠️ {error}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleRetry}
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                color: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Réessayer
            </button>
            <button
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          padding: '20px 40px',
          borderRadius: '12px',
          backgroundColor: result.success ? '#10b981' : '#ef4444',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {result.message}
        </div>
      )}

      {/* Modal */}
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
            zIndex: 101
          }}>
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

            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>
              {scannedData.type === 'employee' && '👤 Employé'}
              {scannedData.type === 'visitor' && '👤 Visiteur'}
              {scannedData.type === 'vehicle' && '🚗 Véhicule'}
            </h2>
            
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#334155' }}>
              {scannedData.data.full_name || scannedData.data.name || scannedData.data.license_plate || 'N/A'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scannedData.type !== 'vehicle' && (
                <>
                  <button onClick={() => handleAction('enter', 'person')} style={{ padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ✅ Entrée
                  </button>
                  <button onClick={() => handleAction('exit', 'person')} style={{ padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ❌ Sortie
                  </button>
                </>
              )}

              {scannedData.type === 'vehicle' && (
                <>
                  <button onClick={() => handleAction('enter', 'vehicle')} style={{ padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🚗 Véhicule Entrée
                  </button>
                  <button onClick={() => handleAction('exit', 'vehicle')} style={{ padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🚗 Véhicule Sortie
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
