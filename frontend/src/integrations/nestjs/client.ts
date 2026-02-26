// Client pour l'API NestJS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    roles: string[];
    migrationSource?: string;
    requiresPasswordReset: boolean;
    lastSignIn?: string;
  };
  requiresPasswordReset: boolean;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  migrationSource?: string;
  requiresPasswordReset: boolean;
  lastSignIn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  roles?: string[];
}

class NestJSApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Récupérer le token depuis localStorage au démarrage
    this.token = localStorage.getItem('nestjs_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'Une erreur est survenue',
          statusCode: response.status,
        };
      }

      return { data };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        error: 'Erreur de connexion au serveur',
        statusCode: 500,
      };
    }
  }

  // Authentification
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.access_token) {
      this.token = response.data.access_token;
      localStorage.setItem('nestjs_token', this.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('nestjs_token');
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile');
  }

  async validateToken(): Promise<ApiResponse<{ valid: boolean; user: any }>> {
    return this.request<{ valid: boolean; user: any }>('/auth/validate');
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/password-reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Gestion des utilisateurs
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    data: User[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';

    return this.request(endpoint);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: Partial<CreateUserRequest>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserRoles(id: string): Promise<ApiResponse<{ roles: string[] }>> {
    return this.request<{ roles: string[] }>(`/users/${id}/roles`);
  }

  async assignRole(userId: string, role: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async removeRole(userId: string, role: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/users/${userId}/roles/${role}`, {
      method: 'DELETE',
    });
  }

  // Méthode générique publique pour les hooks
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const finalEndpoint = queryString ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}` : endpoint;

    return this.request<T>(finalEndpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Méthodes utilitaires
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('nestjs_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ===== CONTENTIEUX MODULE =====

  // Affaires
  async getAffaires(params?: {
    page?: number;
    limit?: number;
    search?: string;
    statut?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/contentieux/affaires?${queryString}` : '/contentieux/affaires';

    return this.request(endpoint);
  }

  async getAffaire(id: string) {
    return this.request(`/contentieux/affaires/${id}`);
  }

  async createAffaire(data: any) {
    return this.request('/contentieux/affaires', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAffaire(id: string, data: any) {
    return this.request(`/contentieux/affaires/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAffaire(id: string) {
    return this.request(`/contentieux/affaires/${id}`, {
      method: 'DELETE',
    });
  }

  // Audiences
  async getAudiences(params?: {
    page?: number;
    limit?: number;
    search?: string;
    affaireId?: string;
    statut?: string;
    type?: string;
    dateDebut?: string;
    dateFin?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/contentieux/audiences?${queryString}` : '/contentieux/audiences';

    return this.request(endpoint);
  }

  async getAudience(id: string) {
    return this.request(`/contentieux/audiences/${id}`);
  }

  async createAudience(data: any) {
    return this.request('/contentieux/audiences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAudience(id: string, data: any) {
    return this.request(`/contentieux/audiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAudience(id: string) {
    return this.request(`/contentieux/audiences/${id}`, {
      method: 'DELETE',
    });
  }

  async marquerEnrolementEffectue(audienceId: string) {
    return this.request(`/contentieux/audiences/${audienceId}/enrolement`, {
      method: 'PATCH',
    });
  }

  async getAudiencesRappelEnrolement() {
    return this.request('/contentieux/audiences/rappel-enrolement');
  }

  // Honoraires
  async getHonoraires(params?: {
    page?: number;
    limit?: number;
    affaireId?: string;
    dateDebutFacturation?: string;
    dateFinFacturation?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/contentieux/honoraires?${queryString}` : '/contentieux/honoraires';

    return this.request(endpoint);
  }

  async getHonoraire(id: string) {
    return this.request(`/contentieux/honoraires/${id}`);
  }

  async createHonoraire(data: any) {
    return this.request('/contentieux/honoraires', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHonoraire(id: string, data: any) {
    return this.request(`/contentieux/honoraires/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteHonoraire(id: string) {
    return this.request(`/contentieux/honoraires/${id}`, {
      method: 'DELETE',
    });
  }

  // Paiements d'honoraires
  async getPaiementsHonoraires(honorairesId: string) {
    return this.request(`/contentieux/honoraires/${honorairesId}/paiements`);
  }

  async createPaiementHonoraires(honorairesId: string, data: any) {
    return this.request(`/contentieux/honoraires/${honorairesId}/paiements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dépenses
  async getDepenses(params?: {
    page?: number;
    limit?: number;
    affaireId?: string;
    typeDepense?: string;
    dateDebut?: string;
    dateFin?: string;
    montantMin?: number;
    montantMax?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/contentieux/depenses?${queryString}` : '/contentieux/depenses';

    return this.request(endpoint);
  }

  async getDepense(id: string) {
    return this.request(`/contentieux/depenses/${id}`);
  }

  async createDepense(data: any) {
    return this.request('/contentieux/depenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepense(id: string, data: any) {
    return this.request(`/contentieux/depenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDepense(id: string) {
    return this.request(`/contentieux/depenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistiques
  async getAffairesStats() {
    return this.request('/contentieux/affaires/statistics');
  }

  async getAudiencesStats() {
    return this.request('/contentieux/audiences/statistics');
  }

  async getHonorairesStats() {
    return this.request('/contentieux/honoraires/statistiques');
  }

  async getDepensesStats() {
    return this.request('/contentieux/depenses/statistiques');
  }

  // === RÉSULTATS D'AUDIENCES ===

  async getResultatAudience(audienceId: string) {
    return this.request(`/contentieux/audiences/${audienceId}/resultat`);
  }

  async createResultatAudience(audienceId: string, data: any) {
    return this.request(`/contentieux/audiences/${audienceId}/resultat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResultatAudience(audienceId: string, data: any) {
    return this.request(`/contentieux/audiences/${audienceId}/resultat`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteResultatAudience(audienceId: string) {
    return this.request(`/contentieux/audiences/${audienceId}/resultat`, {
      method: 'DELETE',
    });
  }

  // ===== IMMOBILIER MODULE =====

  // Propriétaires
  async getProprietaires(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    return this.get<any>('/immobilier/proprietaires', params);
  }
  async getProprietaire(id: string) {
    return this.get<any>(`/immobilier/proprietaires/${id}`);
  }
  async createProprietaire(data: { nom: string; telephone?: string; email?: string; adresse?: string }) {
    return this.post<any>('/immobilier/proprietaires', data);
  }
  async updateProprietaire(id: string, data: { nom?: string; telephone?: string; email?: string; adresse?: string }) {
    return this.patch<any>(`/immobilier/proprietaires/${id}`, data);
  }
  async deleteProprietaire(id: string) {
    return this.delete<any>(`/immobilier/proprietaires/${id}`);
  }
  async getProprietairesStatistics() {
    return this.get<any>('/immobilier/proprietaires/statistics');
  }

  // Immeubles
  async getImmeubles(params?: { page?: number; limit?: number; search?: string; proprietaireId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    return this.get<any>('/immobilier/immeubles', params);
  }
  async getImmeuble(id: string) {
    return this.get<any>(`/immobilier/immeubles/${id}`);
  }
  async createImmeuble(data: { proprietaireId: string; nom: string; adresse: string; tauxCommissionCapco: number; notes?: string }) {
    return this.post<any>('/immobilier/immeubles', data);
  }
  async updateImmeuble(id: string, data: { nom?: string; adresse?: string; tauxCommissionCapco?: number; notes?: string }) {
    return this.patch<any>(`/immobilier/immeubles/${id}`, data);
  }
  async deleteImmeuble(id: string) {
    return this.delete<any>(`/immobilier/immeubles/${id}`);
  }
  async getImmeublesStatistics() {
    return this.get<any>('/immobilier/immeubles/statistics');
  }

  // Lots
  async getLotsByImmeuble(immeubleId: string) {
    return this.get<any>(`/immobilier/lots/immeuble/${immeubleId}`);
  }
  async getLot(id: string) {
    return this.get<any>(`/immobilier/lots/${id}`);
  }
  async createLot(data: { immeubleId: string; numero: string; etage?: string; type?: string; loyerMensuelAttendu?: number; statut?: string; locataireId?: string }) {
    return this.post<any>('/immobilier/lots', data);
  }
  async updateLot(id: string, data: { numero?: string; etage?: string; type?: string; loyerMensuelAttendu?: number; statut?: string; locataireId?: string | null }) {
    return this.patch<any>(`/immobilier/lots/${id}`, data);
  }
  async deleteLot(id: string) {
    return this.delete<any>(`/immobilier/lots/${id}`);
  }

  // Locataires
  async getLocataires(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    return this.get<any>('/immobilier/locataires', params);
  }
  async getLocataire(id: string) {
    return this.get<any>(`/immobilier/locataires/${id}`);
  }
  async createLocataire(data: { nom: string; telephone?: string; email?: string }) {
    return this.post<any>('/immobilier/locataires', data);
  }
  async updateLocataire(id: string, data: { nom?: string; telephone?: string; email?: string }) {
    return this.patch<any>(`/immobilier/locataires/${id}`, data);
  }
  async deleteLocataire(id: string) {
    return this.delete<any>(`/immobilier/locataires/${id}`);
  }

  // Baux
  async getBauxByLot(lotId: string) {
    return this.get<any>(`/immobilier/lots/${lotId}/baux`);
  }
  async getBauxByLocataire(locataireId: string) {
    return this.get<any>(`/immobilier/locataires/${locataireId}/baux`);
  }
  async getBail(id: string) {
    return this.get<any>(`/immobilier/baux/${id}`);
  }
  async createBail(data: { lotId: string; locataireId: string; dateDebut: string; dateFin?: string; montantLoyer: number; jourPaiementPrevu?: number; statut?: string }) {
    return this.post<any>('/immobilier/baux', data);
  }
  async updateBail(id: string, data: { dateDebut?: string; dateFin?: string; montantLoyer?: number; jourPaiementPrevu?: number; statut?: string }) {
    return this.patch<any>(`/immobilier/baux/${id}`, data);
  }
  async deleteBail(id: string) {
    return this.delete<any>(`/immobilier/baux/${id}`);
  }

  // Encaissements de loyers
  async getEncaissementsByLot(lotId: string) {
    return this.get<any>(`/immobilier/lots/${lotId}/encaissements`);
  }
  async getEncaissementsByImmeuble(immeubleId: string) {
    return this.get<any>(`/immobilier/encaissements/immeuble/${immeubleId}`);
  }
  async getEncaissement(id: string) {
    return this.get<any>(`/immobilier/encaissements/${id}`);
  }
  async createEncaissement(data: { lotId: string; moisConcerne: string; dateEncaissement: string; montantEncaisse: number; modePaiement: string; observation?: string }) {
    return this.post<any>('/immobilier/encaissements', data);
  }
  async updateEncaissement(id: string, data: { moisConcerne?: string; dateEncaissement?: string; montantEncaisse?: number; modePaiement?: string; observation?: string }) {
    return this.patch<any>(`/immobilier/encaissements/${id}`, data);
  }
  async deleteEncaissement(id: string) {
    return this.delete<any>(`/immobilier/encaissements/${id}`);
  }
  async getEncaissementsStatistics(params?: { immeubleId?: string; moisConcerne?: string }) {
    return this.get<any>('/immobilier/encaissements/statistics', params);
  }

  // Dépenses immeubles
  async getDepensesByImmeuble(immeubleId: string) {
    return this.get<any>(`/immobilier/depenses/immeuble/${immeubleId}`);
  }
  async getDepenseImmeuble(id: string) {
    return this.get<any>(`/immobilier/depenses/${id}`);
  }
  async createDepenseImmeuble(data: { immeubleId: string; date: string; nature: string; description?: string; montant: number; typeDepense?: string; justificatif?: string }) {
    return this.post<any>('/immobilier/depenses', data);
  }
  async updateDepenseImmeuble(id: string, data: { date?: string; nature?: string; description?: string; montant?: number; typeDepense?: string; justificatif?: string }) {
    return this.patch<any>(`/immobilier/depenses/${id}`, data);
  }
  async deleteDepenseImmeuble(id: string) {
    return this.delete<any>(`/immobilier/depenses/${id}`);
  }

  // Rapports de gestion
  async getRapportsByImmeuble(immeubleId: string) {
    return this.get<any>(`/immobilier/rapports/immeuble/${immeubleId}`);
  }
  async getRapport(id: string) {
    return this.get<any>(`/immobilier/rapports/${id}`);
  }
  async generateRapport(data: { immeubleId: string; periodeDebut: string; periodeFin: string }) {
    return this.post<any>('/immobilier/rapports', data);
  }
  async updateRapportStatut(id: string, statut: string) {
    return this.patch<any>(`/immobilier/rapports/${id}/statut`, { statut });
  }
  async deleteRapport(id: string) {
    return this.delete<any>(`/immobilier/rapports/${id}`);
  }

  // Tableau de bord immobilier
  async getImmobilierDashboard() {
    return this.get<any>('/immobilier/dashboard');
  }
}

export const nestjsApi = new NestJSApiClient();