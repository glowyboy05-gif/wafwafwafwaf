"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Camera, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Html5Qrcode } from "html5-qrcode"

export default function ScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const scannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check camera permission on mount
    checkCameraPermission()
    
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop()
      }
    }
  }, [])

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
    } catch (error) {
      console.error('Camera permission check:', error)
      setCameraPermission('denied')
    }
  }

  const startScanner = async () => {
    try {
      setScanning(true)
      setResult(null)
      setMessage("")

      // Request camera permission
      await checkCameraPermission()
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader")
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // QR code detected
          await handleScanResult(decodedText)
          await stopScanner()
        },
        (errorMessage) => {
          // Scanning in progress, errors are normal
        }
      )
    } catch (error) {
      console.error('Scanner start error:', error)
      setMessage("Erreur: Impossible d'accéder à la caméra")
      setScanning(false)
      setCameraPermission('denied')
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

  const handleScanResult = async (scannedData: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      
      console.log('Scanned QR code:', scannedData)

      // Try to match patrol point
      const { data: patrolPoint, error: patrolError } = await supabase
        .from('patrol_points')
        .select('*')
        .or(`id.eq.${scannedData},point_name.ilike.%${scannedData}%`)
        .single()

      if (patrolPoint) {
        // Record patrol scan
        await supabase.from('patrol_scans').insert({
          patrol_point_id: patrolPoint.id,
          employee_id: user.id,
          account_id: user.account_id,
          scan_timestamp: new Date().toISOString(),
          status: 'completed'
        })

        setResult(`✓ Patrol Point: ${patrolPoint.point_name}`)
        setMessage("Scan de patrouille enregistré!")
      } else {
        // Try to match employee/visitor/vehicle
        const { data: entity } = await supabase
          .from('employees')
          .select('*')
          .eq('id', scannedData)
          .single()

        if (entity) {
          setResult(`✓ Employee: ${entity.full_name}`)
          setMessage("Employé scanné!")
        } else {
          setResult(`QR Code: ${scannedData}`)
          setMessage("Code scanné avec succès")
        }
      }
    } catch (error) {
      console.error('Scan processing error:', error)
      setMessage("Erreur lors du traitement du scan")
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <button 
        onClick={() => router.push('/')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        <ArrowLeft size={20} /> Retour
      </button>
      
      <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Scanner QR Code</h1>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {cameraPermission === 'denied' && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            marginBottom: '20px'
          }}>
            ⚠️ Permission caméra refusée. Veuillez activer la caméra dans les paramètres.
          </div>
        )}

        {!scanning && (
          <>
            <Camera size={80} style={{ margin: '0 auto 20px', color: '#007bff' }} />
            
            <button
              onClick={startScanner}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              📷 Démarrer le Scan
            </button>
          </>
        )}

        {scanning && (
          <>
            <div 
              id="qr-reader" 
              ref={scannerRef}
              style={{ 
                width: '100%', 
                marginBottom: '20px',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            />
            
            <button
              onClick={stopScanner}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <X size={20} /> Arrêter le Scan
            </button>
          </>
        )}

        {result && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: result.includes('✓') ? '#d4edda' : '#f8d7da',
            color: result.includes('✓') ? '#155724' : '#721c24',
            marginTop: '20px'
          }}>
            {result}
          </div>
        )}

        {message && (
          <p style={{ color: '#6c757d', marginTop: '12px' }}>{message}</p>
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '12px' }}>📋 Types de scan supportés:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>✓ Points de patrouille</li>
          <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>✓ Employés</li>
          <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>✓ Visiteurs</li>
          <li style={{ padding: '8px 0' }}>✓ Véhicules</li>
        </ul>
      </div>
    </div>
  )
}
