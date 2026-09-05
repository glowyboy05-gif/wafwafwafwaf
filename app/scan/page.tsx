"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'

export default function ScanPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startScanner()
    
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      // Request camera permission
      const { granted } = await BarcodeScanner.requestPermissions()
      if (!granted) {
        alert('Permission caméra refusée')
        router.push('/')
        return
      }

      // Make body transparent for camera view
      document.body.classList.add('barcode-scanner-active')

      setScanning(true)

      // Start scanning
      const result = await BarcodeScanner.scan()
      
      console.log('Barcode scanned:', result)
      
      if (result.barcodes && result.barcodes.length > 0) {
        const code = result.barcodes[0].rawValue
        await handleScanResult(code)
      }

    } catch (error: any) {
      console.error('Scanner error:', error)
      router.push('/')
    } finally {
      stopScanner()
    }
  }

  const stopScanner = async () => {
    try {
      await BarcodeScanner.stopScan()
      document.body.classList.remove('barcode-scanner-active')
      setScanning(false)
    } catch (error) {
      console.error('Stop scanner error:', error)
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

  return (
    <>
      {/* Camera background - full screen */}
      {scanning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}>
          {/* Camera shows here automatically */}
        </div>
      )}

      {/* Scanning overlay */}
      {scanning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          pointerEvents: 'none'
        }}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            pointerEvents: 'auto'
          }}>
            📷 Pointez vers le QR code
          </div>

          <button
            onClick={async () => {
              await stopScanner()
              router.push('/')
            }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              fontSize: '30px',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px 40px',
          borderRadius: '12px',
          backgroundColor: result.success ? '#10b981' : '#ef4444',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 1000
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
    </>
  )
}
