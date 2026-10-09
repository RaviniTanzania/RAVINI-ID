import {
  CleanUser,
  BusinessApplication,
  SokoniProduct,
  WingaAd,
  MovieItem,
  FundiListing,
  CreditTransaction,
  NotificationItem,
  SystemConfig,
  AdminPermission
} from '../types/cleanTypes';

const TOKEN_KEY = 'ravini_clean_auth_token';
const USER_KEY = 'ravini_clean_auth_user';

export class CleanApiClient {
  private static token: string | null = null;
  private static currentUser: CleanUser | null = null;

  public static init() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
      const userRaw = localStorage.getItem(USER_KEY);
      if (userRaw) {
        this.currentUser = JSON.parse(userRaw);
      }
    } catch (e) {
      console.error('[RAVINI API] Failed to load cached credentials', e);
    }
  }

  public static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public static getCurrentUser(): CleanUser | null {
    if (!this.currentUser) {
      const userRaw = localStorage.getItem(USER_KEY);
      if (userRaw) {
        try {
          this.currentUser = JSON.parse(userRaw);
        } catch {
          this.currentUser = null;
        }
      }
    }
    return this.currentUser;
  }

  public static setAuth(token: string, user: CleanUser) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public static clearAuth() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private static async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; message?: string; data?: T; [key: string]: any }> {
    const token = this.getToken();
    const user = this.getCurrentUser();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user?.id) {
      headers['x-user-id'] = user.id;
    }

    try {
      const res = await fetch(path, {
        ...options,
        headers
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        let msg = json?.message || 'Hitilafu ya mawasiliano na seva.';
        if (res.status === 401) {
          msg = json?.message || 'Kipindi chako kimekwisha. Tafadhali ingia upya.';
          this.clearAuth();
        } else if (res.status === 403) {
          msg = json?.message || 'Ruksa imezuiliwa. Huna mamlaka ya kutekeleza kitendo hiki.';
        } else if (res.status === 402) {
          msg = json?.message || 'Salio la credits halitoshi.';
        } else if (res.status >= 500) {
          msg = 'Seva ya RAVINI inashughulikia ombi lako kwa sasa. Tafadhali jaribu tena baada ya muda mfupi.';
        }
        return {
          success: false,
          status: res.status,
          message: msg,
          ...json
        };
      }

      return json || { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: 'Hakuna mtandao. Tafadhali angalia muunganisho wako wa intaneti na ujaribu tena.'
      };
    }
  }

  // --- PUBLIC & AUTH ---
  public static async getConfig(): Promise<{ success: boolean; config?: SystemConfig }> {
    return this.request('/api/public/config', { method: 'GET' });
  }

  public static async login(phone: string, password: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
    if (res.success && res.token && res.user) {
      this.setAuth(res.token, res.user);
    }
    return res;
  }

  public static async register(data: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    businessName?: string;
  }) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.success && res.token && res.user) {
      this.setAuth(res.token, res.user);
    }
    return res;
  }

  public static async getMe() {
    const res = await this.request('/api/auth/me', { method: 'GET' });
    if (res.success && res.user) {
      this.currentUser = res.user;
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  }

  // --- CUSTOMER APIS ---
  public static async getCustomerHome() {
    return this.request('/api/customer/home', { method: 'GET' });
  }

  public static async searchCustomer(query: string, category: string = 'yote') {
    const params = new URLSearchParams({ q: query, category });
    return this.request(`/api/customer/search?${params.toString()}`, { method: 'GET' });
  }

  public static async getCustomerDashboard() {
    return this.request('/api/customer/dashboard', { method: 'GET' });
  }

  public static async submitBusinessApplication(data: {
    category: 'fundi' | 'sokoni' | 'movies' | 'winga';
    businessName: string;
    description: string;
    servicesOrProducts: string;
    contactPhone?: string;
    location?: string;
  }) {
    return this.request('/api/customer/business-application', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async getMyApplications() {
    return this.request('/api/customer/my-applications', { method: 'GET' });
  }

  public static async publishProduct(data: {
    title: string;
    description: string;
    priceTzs: number;
    category: string;
    images: string[];
  }) {
    return this.request('/api/customer/publish/product', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async publishWingaAd(data: {
    title: string;
    adType: string;
    description: string;
    priceTzs: number;
    location: string;
    images: string[];
  }) {
    return this.request('/api/customer/publish/ad', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async publishMovie(data: {
    title: string;
    genre: string;
    durationMinutes: number;
    description: string;
    posterUrl?: string;
    videoUrl: string;
  }) {
    return this.request('/api/customer/publish/movie', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async authorizeMovieStream(movieId: string) {
    return this.request(`/api/customer/movies/${movieId}/authorize`, {
      method: 'POST'
    });
  }

  public static async getNotifications() {
    return this.request('/api/customer/notifications', { method: 'GET' });
  }

  public static async markNotificationRead(id: string) {
    return this.request(`/api/customer/notifications/${id}/read`, { method: 'PUT' });
  }

  // --- ADMIN APIS ---
  public static async getAdminOverview() {
    return this.request('/api/admin/overview', { method: 'GET' });
  }

  public static async getAdminApplications(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/admin/applications${query}`, { method: 'GET' });
  }

  public static async approveApplication(id: string) {
    return this.request(`/api/admin/applications/${id}/approve`, { method: 'POST' });
  }

  public static async rejectApplication(id: string, reason: string) {
    return this.request(`/api/admin/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public static async getAdminContentReview() {
    return this.request('/api/admin/content-review', { method: 'GET' });
  }

  public static async moderateContent(type: 'product' | 'ad' | 'movie', id: string, action: 'approve' | 'reject', reason?: string) {
    return this.request(`/api/admin/content-review/${type}/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public static async getAdminReports() {
    return this.request('/api/admin/reports', { method: 'GET' });
  }

  // --- SUPER ADMIN APIS ---
  public static async getSuperAdminOverview() {
    return this.request('/api/super-admin/overview', { method: 'GET' });
  }

  public static async getSuperAdminUsers(query?: string, role?: string) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (role) params.set('role', role);
    return this.request(`/api/super-admin/users?${params.toString()}`, { method: 'GET' });
  }

  public static async updateUserStatus(userId: string, status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED') {
    return this.request(`/api/super-admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  public static async resetUserPassword(userId: string, newPassword?: string) {
    return this.request(`/api/super-admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  }

  public static async deleteUser(userId: string) {
    return this.request(`/api/super-admin/users/${userId}`, { method: 'DELETE' });
  }

  public static async getSuperAdminAdmins() {
    return this.request('/api/super-admin/admins', { method: 'GET' });
  }

  public static async createAdmin(data: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    permissions: AdminPermission[];
  }) {
    return this.request('/api/super-admin/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async updateAdminPermissions(adminId: string, permissions: AdminPermission[]) {
    return this.request(`/api/super-admin/admins/${adminId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    });
  }

  public static async getCreditBalances() {
    return this.request('/api/super-admin/credits/balances', { method: 'GET' });
  }

  public static async manualCreditTopup(data: {
    userId: string;
    amountCredits: number;
    paymentMethod?: string;
    paymentReference?: string;
    notes?: string;
  }) {
    return this.request('/api/super-admin/credits/manual-topup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async getCreditLedger() {
    return this.request('/api/super-admin/credits/ledger', { method: 'GET' });
  }

  public static async getCreditConfig() {
    return this.request('/api/super-admin/credits/config', { method: 'GET' });
  }

  public static async updateCreditConfig(data: Partial<SystemConfig>) {
    return this.request('/api/super-admin/credits/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public static async getAuditLogs(limit: number = 200) {
    return this.request(`/api/super-admin/audit-logs?limit=${limit}`, { method: 'GET' });
  }

  public static async getSuperAdminReports() {
    return this.request('/api/super-admin/reports', { method: 'GET' });
  }
}

CleanApiClient.init();
