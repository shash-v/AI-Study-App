import React, { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { analyzeScreen } from '../../services/api'
import type { ScreenAnalysisResponse } from '../../services/api'
import { BackButton } from './BackButton'
import { ToggleModeButton } from './ToggleModeButton'

interface StudyLensProps {
    onBack: () => void
}

interface CapturedScreen {
    data_url: string
}

export const StudyLens: React.FC<StudyLensProps> = ({ onBack }) => {
    const [status, setStatus] = useState('Capturing your screen...')
    const [result, setResult] = useState<ScreenAnalysisResponse | null>(null)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    const captureAndAnalyze = useCallback(async () => {
        if (isLoading) return
        setIsLoading(true)
        setError('')
        setResult(null)
        setStatus('Capturing your screen...')

        try {
            // Optional: Hide window briefly if app should not capture itself
            // await invoke('hide_main_window')
            
            const capture = await invoke<CapturedScreen>('capture_screen')
            
            if (!isMounted.current) return
            setStatus('Sending screenshot to backend...')
            
            const analysis = await analyzeScreen(capture.data_url)
            
            if (!isMounted.current) return
            setResult(analysis)
            setStatus('Screen analyzed')
        } catch (captureError) {
            if (!isMounted.current) return
            setError(captureError instanceof Error ? captureError.message : 'Unable to capture screen.')
            setStatus('Capture failed')
        } finally {
            if (isMounted.current) setIsLoading(false)
        }
    }, [isLoading])

    useEffect(() => {
        void captureAndAnalyze()
    }, [])

    return (
        <div className="panel" style={{ padding: 24, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton onBack={onBack} />
                <ToggleModeButton />
            </div>

            <main style={{ maxWidth: 720, width: '100%', margin: '48px auto 0' }}>
                <p style={{ color: '#fbbf24', letterSpacing: '0.12em', fontSize: 12 }}>STUDY LENS</p>
                <h1 style={{ margin: '8px 0', color: '#fff', fontWeight: 500 }}>Reading your current screen</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>{status}</p>

                {error && (
                    <div style={{ marginTop: 24, padding: 16, border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, color: '#fecaca' }}>
                        <p style={{ marginTop: 0 }}>{error}</p>
                        <button type="button" disabled={isLoading} onClick={() => void captureAndAnalyze()}>
                            {isLoading ? 'Retrying...' : 'Try again'}
                        </button>
                    </div>
                )}

                {result && (
                    <section style={{ marginTop: 24, padding: 18, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, color: '#fff' }}>
                        <h2 style={{ marginTop: 0, fontWeight: 500 }}>Detected text</h2>
                        <p style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.78)' }}>{result.text || 'No text detected.'}</p>
                        <h2 style={{ fontWeight: 500 }}>Related uploaded material</h2>
                        {result.matches.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.55)' }}>No matching past-paper material found.</p>
                        ) : (
                            result.matches.map((match, index) => (
                                <article key={`${match.metadata?.source ?? 'match'}-${index}`} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <strong>{String(match.metadata?.source ?? 'Uploaded document')}</strong>
                                    <p style={{ color: 'rgba(255,255,255,0.68)' }}>{match.text}</p>
                                </article>
                            ))
                        )}
                    </section>
                )}
            </main>
        </div>
    )
}