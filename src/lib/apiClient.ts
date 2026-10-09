import { 
  AdCampaign, 
  CompanyLedgerTransaction, 
  RefundRecord, 
  PlatformPricingConfig, 
  AuditLog, 
  AuthoritativeLedgers,
  SystemPersistenceStatus,
  WalletTransaction
} from '../types';

const API_BASE = (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.())
  ? 'https://ais-pre-v2rfr7fubibfmd3ktywlwp-191369523593.europe-west2.run.app/api/v1'
  : '/api/v1';
const DEFAULT_TIMEOUT_MS = 12000;

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number; // Only applied to safe GET requests
  idempotencyKey?: string;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isOffline?: boolean;
  isTimeout?: boolean;
  isServerUnreachable?: boolean;
}

/**
 * Maps raw technical errors to friendly Swahili user messages
 */
export function mapHttpErrorToFriendlyMessage(status: number, rawMessage?: string): string {
  switch (status) {
    case 0:
      return 'Hakuna muunganisho wa intaneti. Tafadhali washa Mobile Data au Wi-Fi yako, kisha ujaribu tena.';
    case 401:
      return 'Kipindi chako kimeisha au taarifa za kuingia sio sahihi. Tafadhali ingia tena.';
    case 403:
      return 'Huna idhini ya kufanya kitendo hiki kwenye mfumo wa RAVINI.';
    case 404:
      return 'Taarifa au huduma uliyoomba haikupatikana.';
    case 409:
      return 'Ombi hili tayari lipo kwenye mfumo. Hakuna muamala uliorudiwa mara mbili.';
    case 422:
      return 'Taarifa zilizowekwa hazijakamilika au si sahihi. Tafadhali hakiki na ujaribu tena.';
    case 429:
      return 'Maombi mengi kwa wakati mmoja. Tafadhali subiri sekunde chache kabla ya kujaribu tena.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Mfumo haujapatikana kwa muda. Tafadhali jaribu tena baada ya muda mfupi.';
    default:
      if (rawMessage && !rawMessage.includes('fetch') && !rawMessage.includes('Network') && !rawMessage.includes('500')) {
        return rawMessage;
      }
      return 'Tafadhali angalia muunganisho wako wa intaneti na ujaribu tena.';
  }
}

export function getAuthHeaders(customHeaders?: HeadersInit, idempotencyKey?: string): Record<string, string> {
  const currentUserId = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('ravini_current_user_id') || 'usr_baraka_mabula')
    : 'usr_baraka_mabula';
  const authToken = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('ravini_auth_token') || currentUserId)
    : currentUserId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    'Authorization': `Bearer ${authToken}`,
  };

  if (idempotencyKey) {
    headers['x-idempotency-key'] = idempotencyKey;
  }

  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((val, key) => { headers[key] = val; });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, val]) => { headers[key] = val; });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  return headers;
}

/**
 * Universal Safe Fetch with AbortController, Exponential Backoff for GET,
 * and zero raw technical error leakage.
 */
export async function safeApiFetch<T = any>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<ApiResult<T>> {
  const method = (options.method || 'GET').toUpperCase();
  const isSafeMethod = method === 'GET' || method === 'HEAD';
  const maxRetries = isSafeMethod ? (options.retries ?? 2) : 0;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  // Fast check: browser is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Hakuna muunganisho wa intaneti. Tafadhali washa Mobile Data au Wi-Fi yako, kisha ujaribu tena.',
      isOffline: true
    };
  }

  let attempt = 0;
  let delay = 1000;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchHeaders = getAuthHeaders(options.headers, options.idempotencyKey);
      const res = await fetch(url, {
        ...options,
        headers: fetchHeaders,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        let json: any = null;
        try {
          json = await res.json();
        } catch {
          json = null;
        }
        return {
          ok: true,
          status: res.status,
          data: (json?.data !== undefined ? json.data : json) as T
        };
      }

      // If server responded with 5xx error and it's a safe GET request, retry
      if (res.status >= 500 && isSafeMethod && attempt < maxRetries) {
        attempt++;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      // Read response error message if available
      let errorMsg: string | undefined;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.message || errorJson.error;
      } catch {
        // use fallback mapped message
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: mapHttpErrorToFriendlyMessage(res.status, errorMsg)
      };

    } catch (err: any) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === 'AbortError';
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      // Retry safe GET requests on network glitches
      if (!isTimeout && isSafeMethod && attempt < maxRetries && !isOffline) {
        attempt++;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      if (isTimeout) {
        return {
          ok: false,
          status: 408,
          data: null,
          error: 'Muunganisho umechelewa. RAVINI haijapata majibu kwa wakati huu. Tafadhali jaribu tena.',
          isTimeout: true
        };
      }

      if (isOffline) {
        return {
          ok: false,
          status: 0,
          data: null,
          error: 'Hakuna muunganisho wa intaneti. Tafadhali washa Mobile Data au Wi-Fi yako, kisha ujaribu tena.',
          isOffline: true
        };
      }

      // Fetch failed while navigator is online -> server unreachable
      return {
        ok: false,
        status: 503,
        data: null,
        error: 'Muunganisho wako unaonekana kuwa upo, lakini RAVINI haijaweza kupata majibu kutoka kwenye mfumo. Tafadhali jaribu tena baada ya muda mfupi.',
        isServerUnreachable: true
      };
    }
  }

  return {
    ok: false,
    status: 503,
    data: null,
    error: 'Muunganisho wako unaonekana kuwa upo, lakini RAVINI haijaweza kupata majibu kutoka kwenye mfumo. Tafadhali jaribu tena baada ya muda mfupi.',
    isServerUnreachable: true
  };
}

// ============================================================================
// TYPED API CLIENT METHODS (Server-Authoritative)
// ============================================================================

export async function fetchPersistenceStatus(): Promise<SystemPersistenceStatus | null> {
  const res = await safeApiFetch<SystemPersistenceStatus>(`${API_BASE}/system/status`);
  return res.ok ? res.data : null;
}

export async function fetchAuthoritativeLedgers(): Promise<AuthoritativeLedgers | null> {
  const res = await safeApiFetch<{ ledgers: AuthoritativeLedgers }>(`${API_BASE}/finance/ledgers`);
  return res.ok && res.data ? (res.data.ledgers || (res.data as any)) : null;
}

export async function fetchCompanyLedgerApi(): Promise<CompanyLedgerTransaction[] | null> {
  const res = await safeApiFetch<{ ledger: CompanyLedgerTransaction[] }>(`${API_BASE}/finance/company-ledger`);
  return res.ok && res.data ? (res.data.ledger || (res.data as any)) : null;
}

export async function fetchAdCampaignsApi(): Promise<AdCampaign[] | null> {
  const res = await safeApiFetch<{ campaigns: AdCampaign[] }>(`${API_BASE}/ads/campaigns`);
  return res.ok && res.data ? (res.data.campaigns || (res.data as any)) : null;
}

export async function createAdCampaignApi(payload: any): Promise<{ success: boolean; message: string; campaign?: AdCampaign }> {
  const idempotencyKey = payload.idempotencyKey || `ad_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const res = await safeApiFetch<{ campaign?: AdCampaign }>(`${API_BASE}/ads/campaigns`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, idempotencyKey }),
    idempotencyKey
  });

  return {
    success: res.ok,
    message: res.ok ? 'Tangazo limetumwa kwa ufanisi!' : (res.error || 'Imeshindikana kutuma tangazo.'),
    campaign: res.data?.campaign
  };
}

export async function approveAdCampaignApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await safeApiFetch(`${API_BASE}/ads/campaigns/${id}/approve`, {
    method: 'POST'
  });
  return {
    success: res.ok,
    message: res.ok ? 'Tangazo limeidhinishwa!' : (res.error || 'Imeshindikana kuidhinisha tangazo.')
  };
}

export async function rejectAdCampaignApi(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  const res = await safeApiFetch(`${API_BASE}/ads/campaigns/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return {
    success: res.ok,
    message: res.ok ? 'Tangazo limekataliwa.' : (res.error || 'Imeshindikana kukataa tangazo.')
  };
}

export async function pauseAdCampaignApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await safeApiFetch(`${API_BASE}/ads/campaigns/${id}/pause`, {
    method: 'POST'
  });
  return {
    success: res.ok,
    message: res.ok ? 'Tangazo limesimamishwa kwa muda.' : (res.error || 'Imeshindikana kusimamisha tangazo.')
  };
}

export async function resumeAdCampaignApi(id: string): Promise<{ success: boolean; message: string }> {
  const res = await safeApiFetch(`${API_BASE}/ads/campaigns/${id}/resume`, {
    method: 'POST'
  });
  return {
    success: res.ok,
    message: res.ok ? 'Tangazo limeendelezwa.' : (res.error || 'Imeshindikana kuendeleza tangazo.')
  };
}

export async function fetchRefundRecordsApi(): Promise<RefundRecord[] | null> {
  const res = await safeApiFetch<{ refunds: RefundRecord[] }>(`${API_BASE}/refunds`);
  return res.ok && res.data ? (res.data.refunds || (res.data as any)) : null;
}

export async function requestRefundApi(payload: {
  transactionId: string;
  service: string;
  amountRvc: number;
  reason: string;
}): Promise<{ success: boolean; message: string; refund?: RefundRecord }> {
  const idempotencyKey = `ref_req_${payload.transactionId}`;
  const res = await safeApiFetch<{ refund?: RefundRecord }>(`${API_BASE}/refunds`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, idempotencyKey }),
    idempotencyKey
  });

  return {
    success: res.ok,
    message: res.ok ? 'Ombi la refund limetumwa!' : (res.error || 'Imeshindikana kutuma ombi la refund.'),
    refund: res.data?.refund
  };
}

export async function executeRefundApi(id: string, adminNote?: string): Promise<{ success: boolean; message: string }> {
  const idempotencyKey = `ref_exec_${id}`;
  const res = await safeApiFetch(`${API_BASE}/refunds/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify({ adminNote, idempotencyKey }),
    idempotencyKey
  });

  return {
    success: res.ok,
    message: res.ok ? 'Refund imetekelezwa na fedha zimerudishwa kwenye pochi!' : (res.error || 'Imeshindikana kutekeleza refund.')
  };
}

export async function rejectRefundApi(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  const res = await safeApiFetch(`${API_BASE}/refunds/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });

  return {
    success: res.ok,
    message: res.ok ? 'Ombi la refund limekataliwa.' : (res.error || 'Imeshindikana kukataa ombi.')
  };
}

export async function fetchPlatformPricingApi(): Promise<PlatformPricingConfig | null> {
  const res = await safeApiFetch<{ pricing: PlatformPricingConfig }>(`${API_BASE}/pricing`);
  return res.ok && res.data ? (res.data.pricing || (res.data as any)) : null;
}

export async function updatePlatformPricingApi(config: PlatformPricingConfig): Promise<{ success: boolean; message: string; pricing?: PlatformPricingConfig }> {
  const res = await safeApiFetch<{ pricing?: PlatformPricingConfig }>(`${API_BASE}/pricing`, {
    method: 'PUT',
    body: JSON.stringify(config)
  });

  return {
    success: res.ok,
    message: res.ok ? 'Bei na viwango vya mfumo vimesasishwa!' : (res.error || 'Imeshindikana kusasisha bei.')
  };
}

export async function fetchAuditLogsApi(): Promise<AuditLog[] | null> {
  const res = await safeApiFetch<{ logs: AuditLog[] }>(`${API_BASE}/admin/audit-logs`);
  return res.ok && res.data ? (res.data.logs || (res.data as any)) : null;
}

export async function transferWalletApi(params: {
  recipientId: string;
  amountRvc: number;
  description: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; message: string; transaction?: WalletTransaction }> {
  const idempotencyKey = params.idempotencyKey || `tx_trf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const res = await safeApiFetch<{ transaction?: WalletTransaction }>(`${API_BASE}/wallet/transfer`, {
    method: 'POST',
    body: JSON.stringify({ ...params, idempotencyKey }),
    idempotencyKey
  });

  return {
    success: res.ok,
    message: res.ok ? 'Uhamisho umekamilika kikamilifu!' : (res.error || 'Imeshindikana kuhamisha salio.'),
    transaction: res.data?.transaction
  };
}

export async function fetchWalletBalanceApi(): Promise<number | null> {
  const res = await safeApiFetch<{ balance: number }>(`${API_BASE}/wallet/balance`);
  return res.ok && res.data ? (typeof res.data.balance === 'number' ? res.data.balance : (res.data as any)) : null;
}
