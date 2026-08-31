"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Camera, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const handleScan = async () => {
    // Simulated scan - in production, use a QR scanner library
    setScanning(true)
    
    try {
      const user = JSON.parse(localStorage.getItem('q_control_user') || '{}')
      
      // Simulated QR code scan result (replace with actual scanner)
      const scannedData = prompt("Enter QR code or Patrol Point ID:")
      
      if (!scannedData) {
        setScanning(false)
        return
      }

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
        setMessage("Patrol scan recorded!")
      } else {
        // Try to match employee/visitor/vehicle
        const { data: entity } = await supabase
          .from('employees')
          .select('*')
          .eq('id', scannedData)
          .single()

        if (entity) {
          setResult(`✓ Employee: ${entity.full_name}`)
          setMessage("Employee scanned!")
        } else {
          setResult(`❌ Unknown QR code`)
          setMessage("Not found in system")
        }
      }
    } catch (error) {
      console.error('Scan error:', error)
      setMessage("Scan failed")
    } finally {
      setScanning(false)
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
        <Camera size={80} style={{ margin: '0 auto 20px', color: '#007bff' }} />
        
        <button
          onClick={handleScan}
          disabled={scanning}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: scanning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: scanning ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {scanning ? '⏳ Scanning...' : '📷 Start Scan'}
        </button>

        {result && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: result.includes('✓') ? '#d4edda' : '#f8d7da',
            color: result.includes('✓') ? '#155724' : '#721c24',
            marginBottom: '12px'
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
