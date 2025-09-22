'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleTest() {
  const [status, setStatus] = useState('Testing...')
  const [artworks, setArtworks] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setStatus('Using existing Supabase client...')
      
      setStatus('Testing basic connection...')
      const { data, error } = await supabase
        .from('Artwork')
        .select('id, artwork_title, artist')
        .limit(5)
      
      if (error) {
        console.error('Supabase error:', error)
        setError(`Supabase error: ${error.message}`)
        setStatus('Connection failed')
        return
      }
      
      if (!data || data.length === 0) {
        setError('No artworks found in database')
        setStatus('No data')
        return
      }
      
      setArtworks(data)
      setStatus(`Success! Loaded ${data.length} artworks`)
      console.log('Test successful:', data)
      
    } catch (err) {
      console.error('Test failed:', err)
      setError(`Test failed: ${err}`)
      setStatus('Test failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Connection Test</h1>
        <p className="mb-4">{status}</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {artworks.length > 0 && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Artworks found:</h3>
            {artworks.map((artwork, index) => (
              <div key={artwork.id || index} className="mt-2">
                <strong>{artwork.artwork_title}</strong> by {artwork.artist}
              </div>
            ))}
          </div>
        )}
        
        <button 
          onClick={testConnection}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Again
        </button>
      </div>
    </div>
  )
}
