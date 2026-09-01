import React, { useState } from 'react'
import { BackButton } from './BackButton'

interface UploadDashboardProps {
  onBack: () => void
}

interface DocumentItem {
  id: string
  name: string
  size: string
  uploadedAt: string
}

const API_BASE_URL = 'http://localhost:8000/api'

export const UploadDashboard: React.FC<UploadDashboardProps> = ({ onBack }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isDBModalOpen, setIsDBModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

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
    <div className="panel chat-panel upload-panel-root">
      <div className="upload-header">
        <BackButton onBack={onBack} />
      </div>

      <div id="center" className="upload-container">
        <div className="upload-actions">
          <button type="button" className="toggle-btn" onClick={() => setIsDBModalOpen(true)}>
            View Database Files ({documents.length})
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