import React, { useCallback, useState } from 'react'
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
    const [result, setResult] = useState<ScreenAnalysisResponse | null>(null)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const captureAndAnalyze = useCallback(async () => {
        if (isLoading) return
        setIsLoading(true)
        setError('')
        setResult(null)

        try {
            const capture = await invoke<CapturedScreen>('capture_screen')
            const analysis = await analyzeScreen(capture.data_url)
            setResult(analysis)
        } catch (captureError) {
            setError(captureError instanceof Error ? captureError.message : 'Unable to capture screen.')
        } finally {
            setIsLoading(false)
        }
    }, [isLoading])

    return (
        <div className="panel study-lens-panel">
            <div className="study-lens-header">
                <BackButton onBack={onBack} />
                <ToggleModeButton />
            </div>

            <main className="study-lens-content">
                <section className="study-lens-empty-state">
                    <button
                        type="button"
                        className="study-lens-capture-button"
                        disabled={isLoading}
                        onClick={() => void captureAndAnalyze()}
                    >
                        {isLoading ? 'Reading...' : 'Scan screen'}
                    </button>
                </section>

                {error && (
                    <div className="study-lens-error">
                        <p>{error}</p>
                        <button type="button" disabled={isLoading} onClick={() => void captureAndAnalyze()}>
                            {isLoading ? 'Retrying...' : 'Try again'}
                        </button>
                    </div>
                )}

                {result && (
                    <section className="study-lens-result">
                        <div className="study-lens-result-heading">
                            <div>
                                <p className="study-lens-kicker">STUDY SIGNAL</p>
                                <h2>What stood out</h2>
                            </div>
                            <div className="study-lens-result-stats">
                                <span>{result.regions.length} text areas</span>
                                <span>{result.matches.length} matches</span>
                            </div>
                        </div>
                        <div className="study-lens-detected-text">
                            <span>Detected on screen</span>
                            <p>{result.text || 'No text detected.'}</p>
                        </div>
                        <div className="study-lens-evidence-heading">
                            <h2 className="study-lens-section-title">Past-paper connections</h2>
                            <span>Uploaded evidence</span>
                        </div>
                        {result.matches.length === 0 ? (
                            <p className="study-lens-muted">No related questions found yet.</p>
                        ) : (
                            result.matches.map((match, index) => (
                                <article className="study-lens-match" key={`${match.metadata?.source ?? 'match'}-${index}`}>
                                    <span className="study-lens-match-number">{String(index + 1).padStart(2, '0')}</span>
                                    <div>
                                        <strong>{String(match.metadata?.source ?? 'Uploaded document')}</strong>
                                        <p>{match.text}</p>
                                    </div>
                                </article>
                            ))
                        )}
                    </section>
                )}
            </main>
        </div>
    )
}