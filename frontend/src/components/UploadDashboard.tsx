import React, { useState } from 'react'
import { BackButton } from './BackButton'
import { ToggleModeButton } from './ToggleModeButton'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UploadDashboardProps {
  onBack: () => void
}

interface DocumentItem {
  id: string
  name: string
  size: string
  uploadedAt: string
}

interface ApiDocument {
  id: string
  text: string
  metadata?: {
    source?: string
    size_bytes?: string | number
    uploaded_at?: string
  }
}

interface DocumentsResponse {
  documents: ApiDocument[]
}

const getDocumentName = (document: ApiDocument) => {
  const source = document.metadata?.source
  return source ? source.split(/[\\/]/).pop() || source : 'Untitled document'
}

const formatFileSize = (sizeBytes?: string | number) => {
  const bytes = Number(sizeBytes)
  if (!Number.isFinite(bytes)) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatUploadDate = (uploadedAt?: string) => {
  if (!uploadedAt) return 'N/A'
  const date = new Date(uploadedAt)
  return Number.isNaN(date.getTime()) ? uploadedAt : date.toLocaleString()
}

const toDocumentItem = (document: ApiDocument): DocumentItem => ({
  id: document.id,
  name: getDocumentName(document),
  size: formatFileSize(document.metadata?.size_bytes),
  uploadedAt: formatUploadDate(document.metadata?.uploaded_at),
})

export const UploadDashboard: React.FC<UploadDashboardProps> = ({ onBack }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isDBModalOpen, setIsDBModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/all-documents`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents from backend')
      }

      const result: DocumentsResponse = await response.json()
      setDocuments(result.documents.map(toDocumentItem))
    } catch (error) {
      console.error('Failed to load database documents', error)
      alert('Error loading documents from the backend server.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDatabase = () => {
    setIsDBModalOpen(true)
    void loadDocuments()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('files', file)
    })

    const newDocs: DocumentItem[] = Array.from(files).map((file, idx) => ({
      id: Date.now().toString() + idx,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
    }))

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload files to backend')
      }

      const result = await response.json()
      setDocuments((prev) => [...prev, ...newDocs])
      alert(result.message || 'Files uploaded successfully!')
    } catch (error) {
      console.error('Upload failed', error)
      alert('Error uploading files to the backend server.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="panel chat-panel upload-panel-root" style={{ position: 'relative' }}>
      <div 
        className="upload-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '24px 24px 0',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <BackButton onBack={onBack} />
        <ToggleModeButton />
      </div>

      <div id="center" className="upload-container">
        <div className="upload-actions">
          <button type="button" className="toggle-btn" onClick={handleOpenDatabase}>
            View Database Files
          </button>
        </div>

        <div className="upload-card">
          <div className="dropzone">
            <input type="file" multiple onChange={handleFileUpload} className="file-input" />
            <p className="dropzone-text">
              Drag & drop files here, or <span className="browse-highlight">browse</span>
            </p>
            <p className="dropzone-subtext">Support for documents, images, and text files</p>
          </div>
        </div>
      </div>

      {isDBModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDBModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Database Files ({documents.length})</h3>
              <button type="button" onClick={() => setIsDBModalOpen(false)} className="modal-close-btn">
                &times;
              </button>
            </div>

            <div className="modal-body">
              {isLoading ? (
                <p className="modal-status-text">Uploading and indexing files...</p>
              ) : documents.length === 0 ? (
                <p className="modal-status-text">No documents found in database.</p>
              ) : (
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="doc-name">{doc.name}</td>
                        <td className="doc-meta">{doc.size}</td>
                        <td className="doc-meta">{doc.uploadedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="ticks"></div>
    </div>
  )
}