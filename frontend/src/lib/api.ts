const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('access_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
      throw new Error(error.detail || 'An error occurred')
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  }

  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Trip endpoints
  async getTrips() {
    return this.request('/trips')
  }

  async getTrip(id: string) {
    return this.request(`/trips/${id}`)
  }

  async getTripByShareCode(shareCode: string) {
    return this.request(`/trips/share/${shareCode}`)
  }

  async createTrip(data: Record<string, unknown>) {
    return this.request('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTrip(id: string, data: Record<string, unknown>) {
    return this.request(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTrip(id: string) {
    return this.request(`/trips/${id}`, {
      method: 'DELETE',
    })
  }

  // Itinerary endpoints
  async getItineraryItems(tripId: string) {
    return this.request(`/trips/${tripId}/itinerary`)
  }

  async createItineraryItem(tripId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/itinerary`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateItineraryItem(tripId: string, itemId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/itinerary/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteItineraryItem(tripId: string, itemId: string) {
    return this.request(`/trips/${tripId}/itinerary/${itemId}`, {
      method: 'DELETE',
    })
  }

  // Trip members endpoints
  async getTripMembers(tripId: string) {
    return this.request(`/trips/${tripId}/members`)
  }

  async joinTrip(shareCode: string) {
    return this.request(`/trips/join/${shareCode}`, {
      method: 'POST',
    })
  }

  async updateMemberStatus(tripId: string, memberId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async removeMember(tripId: string, memberId: string) {
    return this.request(`/trips/${tripId}/members/${memberId}`, {
      method: 'DELETE',
    })
  }

  // Checklist endpoints
  async getChecklists(tripId: string) {
    return this.request(`/trips/${tripId}/checklists`)
  }

  async createChecklist(tripId: string, data: { name: string; type: string; order?: number }) {
    return this.request(`/trips/${tripId}/checklists`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateChecklist(tripId: string, checklistId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/checklists/${checklistId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteChecklist(tripId: string, checklistId: string) {
    return this.request(`/trips/${tripId}/checklists/${checklistId}`, {
      method: 'DELETE',
    })
  }

  async createChecklistItem(tripId: string, checklistId: string, data: { content: string; order?: number }) {
    return this.request(`/trips/${tripId}/checklists/${checklistId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateChecklistItem(tripId: string, checklistId: string, itemId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/checklists/${checklistId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteChecklistItem(tripId: string, checklistId: string, itemId: string) {
    return this.request(`/trips/${tripId}/checklists/${checklistId}/items/${itemId}`, {
      method: 'DELETE',
    })
  }

  async reorderChecklistItems(tripId: string, checklistId: string, itemIds: string[]) {
    return this.request(`/trips/${tripId}/checklists/${checklistId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ item_ids: itemIds }),
    })
  }

  // Expense endpoints
  async getExpenses(tripId: string) {
    return this.request(`/trips/${tripId}/expenses`)
  }

  async createExpense(tripId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateExpense(tripId: string, expenseId: string, data: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteExpense(tripId: string, expenseId: string) {
    return this.request(`/trips/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
    })
  }

  async getExpenseSummary(tripId: string) {
    return this.request(`/trips/${tripId}/expenses/summary`)
  }

  async getSettlements(tripId: string) {
    return this.request(`/trips/${tripId}/expenses/settlements`)
  }

  async settleExpenseSplit(tripId: string, expenseId: string, splitId: string) {
    return this.request(`/trips/${tripId}/expenses/${expenseId}/settle?split_id=${splitId}`, {
      method: 'POST',
    })
  }

  // Import endpoints
  async parseImport(tripId: string, emailContent: string) {
    return this.request(`/trips/${tripId}/import/parse`, {
      method: 'POST',
      body: JSON.stringify({ email_content: emailContent }),
    })
  }

  async confirmImport(tripId: string, parsedData: Record<string, unknown>, adjustments?: Record<string, unknown>) {
    return this.request(`/trips/${tripId}/import/confirm`, {
      method: 'POST',
      body: JSON.stringify({ parsed_data: parsedData, adjustments }),
    })
  }

  async getImportHistory(tripId: string) {
    return this.request(`/trips/${tripId}/import/history`)
  }

  // Recommendations endpoints
  async getRecommendations(tripId: string, category: string = 'activities', count: number = 5) {
    return this.request(`/trips/${tripId}/recommendations?category=${category}&count=${count}`)
  }

  async addRecommendationToItinerary(tripId: string, recommendation: Record<string, unknown>, date: string, time?: string) {
    return this.request(`/trips/${tripId}/recommendations/add`, {
      method: 'POST',
      body: JSON.stringify({ recommendation, date, time }),
    })
  }

  // Guide endpoints
  async getPublicGuides(destination?: string, limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams()
    if (destination) params.append('destination', destination)
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    return this.request(`/guides?${params.toString()}`)
  }

  async getMyGuides() {
    return this.request('/guides/my')
  }

  async getGuide(id: string) {
    return this.request(`/guides/${id}`)
  }

  async getGuideByShareCode(shareCode: string) {
    return this.request(`/guides/share/${shareCode}`)
  }

  async createGuide(data: {
    title: string
    description?: string
    destination: string
    cover_image_url?: string
    visibility?: 'public' | 'private' | 'unlisted'
    tags?: string[]
    location_tags?: string[]
  }) {
    return this.request('/guides', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGuide(id: string, data: Record<string, unknown>) {
    return this.request(`/guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGuide(id: string) {
    return this.request(`/guides/${id}`, {
      method: 'DELETE',
    })
  }

  async incrementGuideViewCount(id: string) {
    return this.request(`/guides/${id}/view`, {
      method: 'POST',
    })
  }

  // Guide section endpoints
  async createGuideSection(guideId: string, data: { title: string; description?: string; order?: number }) {
    return this.request(`/guides/${guideId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGuideSection(guideId: string, sectionId: string, data: Record<string, unknown>) {
    return this.request(`/guides/${guideId}/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGuideSection(guideId: string, sectionId: string) {
    return this.request(`/guides/${guideId}/sections/${sectionId}`, {
      method: 'DELETE',
    })
  }

  async reorderGuideSections(guideId: string, sectionIds: string[]) {
    return this.request(`/guides/${guideId}/sections/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ item_ids: sectionIds }),
    })
  }

  // Guide place endpoints
  async createGuidePlace(guideId: string, sectionId: string, data: Record<string, unknown>) {
    return this.request(`/guides/${guideId}/sections/${sectionId}/places`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGuidePlace(guideId: string, sectionId: string, placeId: string, data: Record<string, unknown>) {
    return this.request(`/guides/${guideId}/sections/${sectionId}/places/${placeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGuidePlace(guideId: string, sectionId: string, placeId: string) {
    return this.request(`/guides/${guideId}/sections/${sectionId}/places/${placeId}`, {
      method: 'DELETE',
    })
  }

  async reorderGuidePlaces(guideId: string, sectionId: string, placeIds: string[]) {
    return this.request(`/guides/${guideId}/sections/${sectionId}/places/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ item_ids: placeIds }),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
