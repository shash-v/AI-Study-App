const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SearchResult {
  text: string
  metadata: Record<string, any>
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
}

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`)
  if (!response.ok) throw new Error("Health check failed")
  return response.json()
}

export const searchDocuments = async (query: string, k: number = 5): Promise<SearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, k }),
  })

  if (!response.ok) throw new Error("Search request failed")
  return response.json()
}

export const uploadDocuments = async (files: FileList): Promise<any> => {
  const formData = new FormData()
  
  Array.from(files).forEach((file) => {
    formData.append("files", file)
  })

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) throw new Error("Document upload failed")
  return response.json()
}

export const getAllDocuments = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/all-documents`, {
    method: "GET",
  })
  if (!response.ok) throw new Error("Failed to fetch all documents")
  return response.json()
}
