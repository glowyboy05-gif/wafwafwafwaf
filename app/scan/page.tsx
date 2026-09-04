"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export default function ScanPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)

  useEffect(() => {
    openCamera()
  }, [])

  const openCamera = async () => {
    try {
      // Just open the camera - NOTHING ELSE
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false
      })
      
      // User took photo or cancelled - go back
      router.push('/')
      
    } catch (error) {
      console.error('Camera error:', error)
      router.push('/')
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: '#000'
    }}>
      {/* Camera opens automatically - no UI needed */}
    </div>
  )
}
