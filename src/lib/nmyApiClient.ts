import {
  NmyUser,
  NmySession,
  NmyRequest,
  NmyCreditLedgerEntry,
  NmyCreditRequest,
  NmyNotification,
  NmyAnnouncement,
  NmyDepartment,
  NmyFile,
  NmyAuditLog,
  NmySettings,
  NmyService
} from '../types/nmyTypes';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  code?: string;
  status?: number;
  [key: string]: any;
}

export class NmyApiClient {
  private static TOKEN_KEY = 'nmy_auth_token';
  private static USER_KEY = 'nmy_auth_user';

  public static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public static setAuth(token: string, user: NmyUser): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  public static getCurrentUser(): NmyUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static setCurrentUser(user: NmyUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public static getApiBase(): string {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      return 'https://ais-pre-v2rfr7fubibfmd3ktywlwp-191369523593.europe-west2.run.app';
    }
    return '';
  }

  private static inFlightRequests = new Map<string, Promise<ApiResponse<any>>>();

  private static async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const method = (options.method || 'GET').toUpperCase();
    const token = this.getToken();

    if (method === 'GET') {
      const dedupKey = `${token || 'anon'}:${path}`;
      if (this.inFlightRequests.has(dedupKey)) {
        return this.inFlightRequests.get(dedupKey)!;
      }
      const pendingPromise = this.executeRequest<T>(path, options, token).finally(() => {
        this.inFlightRequests.delete(dedupKey);
      });
      this.inFlightRequests.set(dedupKey, pendingPromise);
      return pendingPromise;
    }

    return this.executeRequest<T>(path, options, token);
  }

  private static async executeRequest<T = any>(
    path: string,
    options: RequestInit = {},
    token: string | null
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const fullUrl = path.startsWith('http') ? path : (this.getApiBase() + path);
      const response = await fetch(fullUrl, { ...options, headers });
      const data = await response.json();
      data.status = response.status;

      if (response.status === 401) {
        this.clearAuth();
      }

      return data;
    } catch (err: any) {
      console.error('[NMY API Client Error]:', err);
      if (!navigator.onLine) {
        return {
          success: false,
          status: 0,
          message: 'HAUNA INTERNET. Tafadhali washa Mobile Data au Wi-Fi kisha ujaribu tena.'
        };
      }
      return {
        success: false,
        status: 0,
        message: 'HUDUMA HAIPATIKANI KWA SASA. Tafadhali jaribu tena baadaye.'
      };
    }
  }

  // --- PUBLIC CONFIG & HEALTH ---
  public static async getHealth() {
    return this.request('/api/health');
  }

  public static async getPublicConfig() {
    return this.request<{
      config: {
        platformName: string;
        companyName: string;
        publicRegistrationOpen: boolean;
        appAccessOpen: boolean;
        requestTimeoutMinutes: number;
        supportPhone: string;
        whatsappNumber: string;
        paymentInstructions: string;
        paymentMethods: any[];
        service: {
          id: string;
          code: string;
          name: string;
          description: string;
          priceTzs: number;
          isActive: boolean;
        } | null;
        termsVersion: string;
        termsContent: string;
      };
    }>('/api/public/config');
  }

  // --- AUTHENTICATION ---
  public static async register(data: {
    fullName: string;
    phone: string;
    password: string;
    repeatPassword: string;
    termsAccepted: boolean;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async login(data: {
    phone: string;
    password: string;
    deviceName?: string;
  }) {
    const res = await this.request<{
      token: string;
      user: NmyUser;
      balances: {
        customerCredit: number;
        adminWorkCredit: number;
        superAdminWorkCredit: number;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.token && res.user) {
      this.setAuth(res.token, res.user);
    }
    return res;
  }

  public static async getMe() {
    const res = await this.request<{
      user: NmyUser;
      balances: {
        customerCredit: number;
        adminWorkCredit: number;
        superAdminWorkCredit: number;
      };
      unreadNotificationsCount: number;
    }>('/api/auth/me');

    if (res.success && res.user) {
      this.setCurrentUser(res.user);
    }
    return res;
  }

  public static async logout() {
    const res = await this.request('/api/auth/logout', { method: 'POST' });
    this.clearAuth();
    return res;
  }

  public static async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async setLanguage(language: 'sw' | 'en') {
    return this.request('/api/auth/language', {
      method: 'PUT',
      body: JSON.stringify({ language })
    });
  }

  public static async getSessions() {
    return this.request<{ sessions: NmySession[] }>('/api/auth/sessions');
  }

  public static async revokeSession(token: string) {
    return this.request('/api/auth/sessions/revoke', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  public static async getNotifications() {
    return this.request<{ notifications: NmyNotification[] }>('/api/notifications');
  }

  public static async markNotificationRead(id: string) {
    return this.request(`/api/notifications/${id}/read`, { method: 'PUT' });
  }

  public static async getFiles() {
    return this.request<{ files: NmyFile[] }>('/api/files');
  }

  public static async uploadFile(fileName: string, fileDataUrl: string, fileType?: string) {
    return this.request<{ success: boolean; file: NmyFile }>('/api/files/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileDataUrl, fileType })
    });
  }

  public static async deleteFile(fileId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/files/${fileId}`, {
      method: 'DELETE'
    });
  }

  // --- CUSTOMER APIS ---
  public static async getCustomerDashboard() {
    return this.request<{
      balanceTzs: number;
      counts: { pending: number; processing: number; approved: number; rejected: number; total: number };
      recentRequests: NmyRequest[];
      service: NmyService;
      notifications: NmyNotification[];
    }>('/api/customer/dashboard');
  }

  public static async getCustomerCredit() {
    return this.request<{
      balanceTzs: number;
      ledger: NmyCreditLedgerEntry[];
      startingBaseTzs?: number;
      totalAddedTzs?: number;
      totalChargedTzs?: number;
      totalRefundedTzs?: number;
      usedPercentage?: number;
      remainingPercentage?: number;
      claimTzs?: number;
    }>('/api/customer/credit');
  }

  public static async buyCredit(data: {
    amountTzs: number;
    paymentMethod: string;
    paymentReference: string;
    proofImageUrl?: string;
  }) {
    return this.request<{ creditRequest: NmyCreditRequest }>('/api/customer/credit/buy', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async getCustomerCreditRequests() {
    return this.request<{ requests: NmyCreditRequest[] }>('/api/customer/credit/requests');
  }

  public static async submitNidaRequest(targetPhoneNumber: string) {
    return this.request<{
      request: NmyRequest;
      newBalance: number;
    }>('/api/customer/requests', {
      method: 'POST',
      body: JSON.stringify({ targetPhoneNumber })
    });
  }

  public static async getCustomerRequests() {
    return this.request<{ requests: NmyRequest[] }>('/api/customer/requests');
  }

  public static async getCustomerRequest(id: string) {
    return this.request<{ request: NmyRequest }>(`/api/customer/requests/${id}`);
  }

  public static async deleteCustomerRequest(id: string) {
    return this.request(`/api/customer/requests/${id}`, {
      method: 'DELETE'
    });
  }

  public static async resubmitCustomerRequest(id: string) {
    return this.request<{
      request: NmyRequest;
      newBalance: number;
    }>(`/api/customer/requests/${id}/resubmit`, {
      method: 'POST'
    });
  }

  // --- ADMIN APIS ---
  public static async getAdminDashboard() {
    return this.request<{
      counts: { pendingQueue: number; myProcessing: number; myCompleted: number; totalInSystem: number };
      workAccountBalance: number;
      pendingRequests: NmyRequest[];
      processingRequests: NmyRequest[];
      recentCompleted: NmyRequest[];
    }>('/api/admin/dashboard');
  }

  public static async getAdminWorkAccount() {
    return this.request<{
      balanceTzs: number;
      ledger: any[];
    }>('/api/admin/work-account');
  }

  public static async getAdminRequests(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.request<{ requests: NmyRequest[] }>(`/api/admin/requests${q}`);
  }

  public static async claimRequest(id: string) {
    return this.request<{ request: NmyRequest }>(`/api/admin/requests/${id}/claim`, {
      method: 'POST'
    });
  }

  public static async completeRequest(id: string, nidaResult: string) {
    return this.request<{ request: NmyRequest }>(`/api/admin/requests/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ nidaResult })
    });
  }

  public static async rejectRequest(id: string, reason: string) {
    return this.request<{ request: NmyRequest }>(`/api/admin/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public static async getSuperAdminOverview() {
    return this.request<{
      stats: {
        totalCustomers: number;
        customersWithCreditCount?: number;
        customersWithoutCreditCount?: number;
        suspendedCustomersCount?: number;
        deletedCustomersCount?: number;
        totalAdmins: number;
        totalRequests: number;
        pendingRequests: number;
        processingRequests: number;
        approvedRequests: number;
        rejectedRequests: number;
        expiredRequests: number;
        completedPercentage?: number;
        pendingCreditRequests: number;
        totalCustomerBalances: number;
        // Real Cash Received
        approvedCashReceivedTzs?: number;
        pendingCashTzs?: number;
        rejectedCashTzs?: number;
        totalRefundsTzs?: number;
        totalChargesTzs?: number;
        // Work Balances & Debts
        superAdminWorkBalanceTzs?: number;
        adminTotalWorkBalanceTzs?: number;
        totalOutstandingWorkDebtTzs?: number;
        // Jobs details
        superAdminJobsCount?: number;
        superAdminJobsCompleted?: number;
        adminJobsCount?: number;
        adminJobsCompleted?: number;
        // Settings
        servicePriceTzs: number;
        appAccessOpen: boolean;
        publicRegistrationOpen: boolean;
      };
      recentRequests: NmyRequest[];
      recentCreditRequests: NmyCreditRequest[];
      recentLedger: NmyCreditLedgerEntry[];
    }>('/api/super-admin/overview');
  }

  public static async getSuperAdminUsers() {
    return this.request<{ users: any[] }>('/api/super-admin/users');
  }

  public static async getSuperAdminCustomerCredits() {
    return this.request<{
      customers: any[];
      summary: {
        totalCustomers: number;
        totalCustomersWithCredit: number;
        totalOutstandingCreditTzs: number;
        totalCreditAddedEverTzs: number;
        totalCreditChargedEverTzs: number;
        totalRefundedEverTzs: number;
      };
    }>('/api/super-admin/customers/credits');
  }

  public static async getSuperAdminWorkHistoryAdmins() {
    return this.request<{
      admins: any[];
      summary: {
        totalAdminsTracked: number;
        totalJobsAssignedAcrossAll: number;
        totalJobsCompletedAcrossAll: number;
        totalJobsProcessingAcrossAll: number;
        totalJobsRejectedAcrossAll: number;
        totalWorkEarningsAllTzs: number;
      };
    }>('/api/super-admin/work-history/admins');
  }

  public static async getSuperAdminWorkHistoryAll() {
    return this.request<{
      jobs: any[];
      summary: any;
    }>('/api/super-admin/work-history/all');
  }

  public static async updateUserStatus(id: string, status: string) {
    return this.request(`/api/super-admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  public static async createAdmin(data: {
    fullName: string;
    phone: string;
    password: string;
    permissions?: string[];
    departmentId?: string;
    role?: 'ADMIN' | 'SUPER_ADMIN_OPERATIONS';
  }) {
    return this.request('/api/super-admin/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async getSuperAdminCreditRequests() {
    return this.request<{ requests: NmyCreditRequest[] }>('/api/super-admin/credit/requests');
  }

  public static async reviewCreditRequest(id: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) {
    return this.request(`/api/super-admin/credit/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, rejectionReason })
    });
  }

  public static async lookupCustomer(phoneOrId: string) {
    return this.request<{ customer: any }>(`/api/super-admin/customers/lookup?phone=${encodeURIComponent(phoneOrId)}`);
  }

  public static async lookupCustomerByPhone(phoneOrId: string) {
    return this.lookupCustomer(phoneOrId);
  }

  public static async adjustCreditManual(data: {
    customerId?: string;
    phone?: string;
    amountTzs: number;
    reason: string;
  }) {
    return this.request('/api/super-admin/credit/manual-adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async adjustCustomerCredit(data: {
    customerId?: string;
    phone?: string;
    amountTzs: number;
    reason: string;
  }) {
    return this.adjustCreditManual(data);
  }

  public static async updateAdminCreditPermission(adminId: string, canAddCredit: boolean) {
    return this.request<{ success: boolean; message: string; user?: NmyUser }>(`/api/super-admin/admins/${adminId}/credit-permission`, {
      method: 'POST',
      body: JSON.stringify({ canAddCredit })
    });
  }

  public static async deleteUserAccount(userId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/super-admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  public static async markUserForDeletion(userId: string, reason?: string) {
    return this.request<{ success: boolean; message: string; user?: NmyUser }>(`/api/super-admin/users/${userId}/mark-for-deletion`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public static async restoreUserFromDeletion(userId: string) {
    return this.request<{ success: boolean; message: string; user?: NmyUser }>(`/api/super-admin/users/${userId}/restore-from-deletion`, {
      method: 'POST'
    });
  }

  public static async permanentDeleteUser(userId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/super-admin/users/${userId}/permanent`, {
      method: 'DELETE'
    });
  }

  public static async resetSuperAdminWorkBalance(reason?: string) {
    return this.request<{ success: boolean; message: string; balanceBefore: number; balanceAfter: number }>('/api/super-admin/work-account/reset-balance', {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  public static async resetUserPassword(userId: string, newPassword: string) {
    return this.request<{ success: boolean; message: string; user?: NmyUser }>(`/api/super-admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  }

  public static async updateWhatsappNumber(whatsappNumber: string) {
    return this.request<{ whatsappNumber: string }>('/api/super-admin/settings/whatsapp-number', {
      method: 'PUT',
      body: JSON.stringify({ whatsappNumber })
    });
  }

  public static async updateRequestTimeout(timeoutMinutes: number) {
    return this.request<{ requestTimeoutMinutes: number }>('/api/super-admin/settings/request-timeout', {
      method: 'PUT',
      body: JSON.stringify({ timeoutMinutes })
    });
  }

  public static async getAdminWorkPaymentLink(adminId: string, amount?: number) {
    const q = amount ? `?amount=${amount}` : '';
    return this.request<{
      whatsappUrl: string;
      prefilledMessage: string;
      admin: any;
      outstandingBalance: number;
      amountToPay: number;
      remainingBalance: number;
    }>(`/api/super-admin/admins/${adminId}/work-payment-link${q}`);
  }

  public static async payAdminWorkBalance(adminId: string, data: { amount: number; reason?: string }) {
    return this.request<{
      paidAmount: number;
      remainingBalance: number;
      ledgerEntry: any;
      admin: any;
    }>(`/api/super-admin/admins/${adminId}/work-payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async getCustomerWhatsappPaymentLink(amount?: number) {
    const q = amount ? `?amount=${amount}` : '';
    return this.request<{
      paymentUrl: string;
      amount: number;
      instructions: string;
    }>(`/api/customer/credit/whatsapp-payment-link${q}`);
  }

  public static async customerWhatsappAction(amountTzs?: number) {
    return this.request<{
      whatsappUrl: string;
      prefilledMessage: string;
      amountTzs: number;
    }>('/api/customer/credit/whatsapp-action', {
      method: 'POST',
      body: JSON.stringify({ amountTzs: amountTzs || 1000 })
    });
  }

  public static async getSuperAdminCreditLedger() {
    const res = await this.getSuperAdminOverview();
    return {
      success: res.success,
      ledger: res.recentLedger || []
    };
  }

  public static async getSuperAdminReports() {
    const res = await this.getSuperAdminOverview();
    return {
      success: res.success,
      stats: res.stats,
      recentRequests: res.recentRequests || [],
      recentCreditRequests: res.recentCreditRequests || []
    };
  }

  public static async getSuperAdminAuditLogs(limit = 100) {
    return this.getAuditLogs(limit);
  }

  public static async getServices() {
    return this.request<{ services: NmyService[] }>('/api/super-admin/services');
  }

  public static async updateServicePrice(id: string, priceTzs: number) {
    return this.request(`/api/super-admin/services/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify({ priceTzs })
    });
  }

  public static async getSettings() {
    return this.request<{ settings: NmySettings }>('/api/super-admin/settings');
  }

  public static async updateSettings(patch: Partial<NmySettings>) {
    return this.request('/api/super-admin/settings', {
      method: 'PUT',
      body: JSON.stringify(patch)
    });
  }

  public static async getActiveAnnouncements() {
    return this.request<{ announcements: NmyAnnouncement[] }>('/api/announcements/active');
  }

  public static async getAnnouncements() {
    return this.request<{ announcements: NmyAnnouncement[] }>('/api/super-admin/announcements');
  }

  public static async createAnnouncement(data: {
    title: string;
    message: string;
    targetType: string;
    targetUserId?: string;
    isActive?: boolean;
  }) {
    return this.request<{ success: boolean; announcement: NmyAnnouncement; message: string }>('/api/super-admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async updateAnnouncement(id: string, data: {
    title?: string;
    message?: string;
    targetType?: string;
    isActive?: boolean;
  }) {
    return this.request<{ success: boolean; announcement: NmyAnnouncement; message: string }>(`/api/super-admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public static async toggleAnnouncementStatus(id: string, isActive: boolean) {
    return this.request<{ success: boolean; announcement: NmyAnnouncement; message: string }>(`/api/super-admin/announcements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  public static async deleteAnnouncement(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/super-admin/announcements/${id}`, {
      method: 'DELETE'
    });
  }

  public static async getAuditLogs(limit = 100) {
    return this.request<{ logs: NmyAuditLog[] }>(`/api/super-admin/audit-logs?limit=${limit}`);
  }

  public static async getDepartments() {
    return this.request<{ departments: NmyDepartment[] }>('/api/super-admin/departments');
  }

  // Backup & Recovery Center
  public static async getBackups() {
    return this.request<{
      backups: any[];
      lastBackup: any;
      lastVerified: any;
      status: string;
    }>('/api/super-admin/backups');
  }

  public static async createBackup() {
    return this.request<{ backup: any }>('/api/super-admin/backups/create', {
      method: 'POST'
    });
  }

  public static async restoreBackup(backupId: string, confirmPhrase: string) {
    return this.request(`/api/super-admin/backups/${backupId}/restore`, {
      method: 'POST',
      body: JSON.stringify({ confirmPhrase })
    });
  }

  public static async runIntegrityCheck() {
    return this.request<{ report: any }>('/api/super-admin/integrity-check');
  }

  public static async toggleEmergencyLock(active: boolean, reason?: string) {
    return this.request('/api/super-admin/emergency-lock', {
      method: 'POST',
      body: JSON.stringify({ active, reason })
    });
  }

  public static async cleanupHistory(olderThanDays: number, category: string, confirmation: string) {
    return this.request('/api/super-admin/cleanup-history', {
      method: 'POST',
      body: JSON.stringify({ olderThanDays, category, confirmation })
    });
  }

  public static async deleteCustomerManual(customerId: string, reason: string, confirmation: string) {
    return this.request(`/api/super-admin/customers/${customerId}/delete`, {
      method: 'POST',
      body: JSON.stringify({ reason, confirmation })
    });
  }

  public static async globalSearch(query: string) {
    return this.request<{
      query: string;
      results: {
        customers: any[];
        admins: any[];
        requests: any[];
        payments: any[];
      };
    }>(`/api/super-admin/global-search?q=${encodeURIComponent(query)}`);
  }

  public static async getCustomer360(customerId: string) {
    return this.request<{
      customer: any;
      credit: any;
      requests: any[];
      payments: any[];
      activity: any[];
    }>(`/api/super-admin/customers/${customerId}/360`);
  }

  public static async getAdmin360(adminId: string) {
    return this.request<{
      admin: any;
      workAccount: any;
      workload: any;
      recentWork: any[];
      activity: any[];
    }>(`/api/super-admin/admins/${adminId}/360`);
  }

  public static async getRevenueHistory(period = 'this_month', customDates?: { startDate?: string; endDate?: string }) {
    let url = `/api/super-admin/revenue-history?period=${period}`;
    if (customDates?.startDate) {
      url += `&startDate=${encodeURIComponent(customDates.startDate)}`;
    }
    if (customDates?.endDate) {
      url += `&endDate=${encodeURIComponent(customDates.endDate)}`;
    }
    return this.request<{
      period: string;
      summary: {
        totalRevenueTzs: number;
        totalRefundsTzs: number;
        netRevenueTzs: number;
        approvedTopUpTotal: number;
        transactionCount: number;
        approvedPaymentCount: number;
      };
      transactions: any[];
    }>(url);
  }

  public static getReportDownloadUrl(type: string): string {
    const token = this.getToken();
    return `/api/super-admin/reports/export?type=${type}&token=${token || ''}`;
  }

  // --- EXTERNAL PUSH NOTIFICATIONS API ---
  public static async getPushStatus() {
    return this.request<{
      pushStatus: {
        authenticated: boolean;
        projectId: string;
        clientEmail: string;
        totalSubscriptions: number;
        fcmSubscriptions: number;
        webSubscriptions: number;
      };
    }>('/api/admin/push/status');
  }

  public static async configureFcm(serviceAccountJson: any) {
    return this.request<{ message: string }>('/api/admin/push/configure-fcm', {
      method: 'POST',
      body: JSON.stringify({ serviceAccountJson })
    });
  }

  public static async sendTestPush() {
    return this.request<{ deliveredDevices: number; message: string }>('/api/notifications/test-push', {
      method: 'POST'
    });
  }
}
