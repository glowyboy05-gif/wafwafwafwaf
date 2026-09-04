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

  useEffect(() => {
    startScanning()
    
    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      // Request permissions
      const { camera } = await BarcodeScanner.requestPermissions()
      
      if (camera !== 'granted') {
        alert('Camera permission denied')
        router.push('/')
        return
      }

      // Add listener for barcode detection
      await BarcodeScanner.addListener('barcodeScanned', async (result) => {
        console.log('Barcode scanned:', result.barcode)
        await handleScanResult(result.barcode.displayValue)
      })

      // Make background of WebView transparent
      document.querySelector('body')?.classList.add('barcode-scanner-active')

      // Start the barcode scanner
      await BarcodeScanner.startScan()
      
    } catch (error) {
      console.error('Scanner error:', error)
      alert('Error starting scanner')
      router.push('/')
    }
  }

  const stopScanning = async () => {
    try {
      await BarcodeScanner.stopScan()
      await BarcodeScanner.removeAllListeners()
      document.querySelector('body')?.classList.remove('barcode-scanner-active')
    } catch (error) {
      console.error('Stop scanning error:', error)
    }
  }

  const handleScanResult = async (scannedCode: string) => {
    try {
      await stopScanning()
      
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      
      console.log('Scanned QR code:', scannedCode)

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
      console.error('Scan processing error:', error)
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
      {/* Result Message */}
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
          zIndex: 99999,
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
              zIndex: 99998
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
            zIndex: 99999,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
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
    </>
  )
}
