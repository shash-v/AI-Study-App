const API_BASE_URL = "http://localhost:8000/api"

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