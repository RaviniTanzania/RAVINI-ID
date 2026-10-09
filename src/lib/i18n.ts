// RAVINI - Bilingual Localization (Kiswahili 🇹🇿 / English 🇬🇧)
export type SupportedLang = 'sw' | 'en';

const STORAGE_KEY = 'ravini_lang';

export function getSavedLang(): SupportedLang {
  if (typeof window === 'undefined') return 'sw';
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'sw';
}

export function saveLang(lang: SupportedLang): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent('ravini_lang_change', { detail: { lang } }));
}

export const translations = {
  sw: {
    // Brand & Status
    appName: 'RAVINI',
    companyName: 'RAVINI',
    vision: '',
    version: '',
    refresh: 'SASISHA',
    refreshing: 'Inasasisha...',

    // Navigation
    home: 'Home',
    services: 'Huduma',
    profile: 'Profile',
    requests: 'Maombi',
    reports: 'Ripoti',
    settings: 'Mipangilio',
    audit: 'Ukaguzi',

    // Customer Home
    welcome: 'Habari',
    creditBalance: 'Salio la Credit',
    buyCredit: 'Nunua Credit',
    newRequest: 'Ombi Jipya la NIDA',
    enterPhone: 'Namba ya Simu ya Mteja (Tarakimu 10)',
    submitRequest: 'TUMA OMBI SASA',
    submitting: 'Inatuma...',
    myRequests: 'Maombi Yangu',
    noRequests: 'Bado huna maombi yoyote ya NIDA.',
    resubmit: 'TUMA TENA OMBI',
    resubmitting: 'Inatuma tena...',
    expiredNotice: 'Ombi lako limeisha muda wa kushughulikiwa. Ombi hili halikushughulikiwa ndani ya muda uliowekwa. Tafadhali tuma ombi upya ikiwa bado unahitaji huduma hii ili kuepuka usumbufu au hasara.',
    refundedNote: 'Salio limerejeshwa kwenye akaunti yako.',

    // Request Statuses
    statusPending: 'Inasubiri',
    statusProcessing: 'Inashughulikiwa',
    statusApproved: 'Imekamilika',
    statusRejected: 'Imekataliwa',
    statusExpired: 'Muda Umeisha',

    // Super Admin / Admin
    adminWorkspace: 'ADMIN WORKSPACE',
    superAdminWorkspace: 'SUPER ADMIN',
    lockedCustomers: 'WATEJA WALIOFUNGWA',
    activeCustomers: 'Wateja Hai',
    allCustomers: 'Wateja Wote',
    adminsList: 'Wasimamizi (Admins)',
    creditManagement: 'Usimamizi wa Credit',
    lockAccount: 'Funga Akaunti',
    unlockAccount: 'Fungua Akaunti',
    deleteAccount: 'Futa Akaunti',
    resetPassword: 'Weka Upya Password',
    creditPermission: 'Ruhusa ya Kuongeza Credit',
    grantCreditPermission: 'Mpe Ruhusa ya Credit',
    revokeCreditPermission: 'Ondoa Ruhusa ya Credit',
    requestTimeout: 'Muda wa Ombi Kuisha (Timeout)',
    timeoutSaved: 'Muda wa ombi umehifadhiwa.',

    // Common
    logout: 'Toka Kwenye Akaunti',
    cancel: 'Ghairi',
    confirm: 'Thibitisha',
    save: 'Hifadhi',
    close: 'Funga',
    phone: 'Namba ya Simu',
    fullName: 'Jina Kamili',
    date: 'Tarehe',
    time: 'Saa',
    status: 'Hali',
    action: 'Hatua',
    search: 'Tafuta',
    back: 'Rudi',
    error: 'Hitilafu',
    success: 'Imefanikiwa',
    loading: 'Inapakia...',

    // Financial Ledger & Work Balance
    financialLedger: 'Leja ya Fedha (Financial Ledger)',
    customerBreakdown: 'Mchanganuo wa Salio la Wateja',
    totalCustomerBalances: 'Jumla ya Salio la Wateja',
    totalCreditUsed: 'Jumla Iliyotumika',
    totalCreditRemaining: 'Jumla Iliyobaki',
    totalCreditAdded: 'Jumla Iliyoongezwa',
    totalRefunded: 'Jumla Iliyorejeshwa',
    totalExposure: 'Madeni / Salio Linalodaiwa na Wateja',
    totalTransactions: 'Jumla ya Miamala',
    usedPercentage: 'Asilimia Iliyotumika',
    remainingPercentage: 'Asilimia Iliyobaki',
    startingBalance: 'Salio la Kuanzia (100% Base)',
    currentBalance: 'Salio la Sasa',
    workBalance: 'Salio la Kazi (Work Balance)',
    superAdminWorkBalance: 'Salio la Kazi la Super Admin',
    adminWorkBalance: 'Salio la Kazi la Admin',
    totalWorkBalance: 'Jumla ya Salio la Kazi',
    startingWorkBalance: 'Salio la Kazi la Kuanzia',
    workBalanceAdded: 'Salio la Kazi Lililoongezwa',
    workBalanceUsed: 'Salio la Kazi Lililotolewa / Lipwa',
    payWorkBalance: 'Lipa Salio la Kazi',
    clearWorkBalance: 'Weka Salio Kuwa 0',

    // Security & Admins
    securityManagement: 'Usimamizi wa Usalama',
    registerAdmin: 'Sajili Mtendaji',
    selectAdminRole: 'Chagua Wadhifa wa Mtendaji',
    adminRole: 'Admin',
    superAdminOpsRole: 'Super Admin Operations',
    lockAccountNotice: 'Akaunti hii imefungwa.',
    sevenDayDeletion: 'Ufutaji wa Siku 7 (7-Day Deletion)',
    restoreAccount: 'Rejesha Akaunti',
    permanentDelete: 'Futa Kabisa',
    tempPasswordNotice: 'Nenosiri la muda ni 1234. Mtumiaji atalazimika kulibadilisha.',

    // Ads
    adsManagement: 'Matangazo (Announcements)'
  },
  en: {
    // Brand & Status
    appName: 'RAVINI',
    companyName: 'RAVINI',
    vision: '',
    version: '',
    refresh: 'REFRESH',
    refreshing: 'Refreshing...',

    // Navigation
    home: 'Home',
    services: 'Services',
    profile: 'Profile',
    requests: 'Requests',
    reports: 'Reports',
    settings: 'Settings',
    audit: 'Audit Logs',

    // Customer Home
    welcome: 'Hello',
    creditBalance: 'Credit Balance',
    buyCredit: 'Top Up Credit',
    newRequest: 'New NIDA Request',
    enterPhone: 'Customer Phone Number (10 digits)',
    submitRequest: 'SUBMIT REQUEST NOW',
    submitting: 'Submitting...',
    myRequests: 'My Requests',
    noRequests: 'You have no NIDA requests yet.',
    resubmit: 'RESUBMIT REQUEST',
    resubmitting: 'Resubmitting...',
    expiredNotice: 'Your request has expired because it was not processed within the allocated timeframe. Please resubmit if you still require this service to avoid inconvenience.',
    refundedNote: 'Credit balance has been refunded to your account.',

    // Request Statuses
    statusPending: 'Pending',
    statusProcessing: 'Processing',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusExpired: 'Expired',

    // Super Admin / Admin
    adminWorkspace: 'ADMIN WORKSPACE',
    superAdminWorkspace: 'SUPER ADMIN',
    lockedCustomers: 'LOCKED CUSTOMERS',
    activeCustomers: 'Active Customers',
    allCustomers: 'All Customers',
    adminsList: 'Administrators (Admins)',
    creditManagement: 'Credit Management',
    lockAccount: 'Lock Account',
    unlockAccount: 'Unlock Account',
    deleteAccount: 'Delete Account',
    resetPassword: 'Reset Password',
    creditPermission: 'Credit Top-Up Permission',
    grantCreditPermission: 'Grant Credit Permission',
    revokeCreditPermission: 'Revoke Credit Permission',
    requestTimeout: 'Request Expiration Timeout',
    timeoutSaved: 'Request timeout saved successfully.',

    // Common
    logout: 'Log Out',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    phone: 'Phone Number',
    fullName: 'Full Name',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    action: 'Action',
    search: 'Search',
    back: 'Back',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',

    // Financial Ledger & Work Balance
    financialLedger: 'Financial Ledger',
    customerBreakdown: 'Customer Balances & Breakdown',
    totalCustomerBalances: 'Total Customer Balances',
    totalCreditUsed: 'Total Credit Used',
    totalCreditRemaining: 'Total Credit Remaining',
    totalCreditAdded: 'Total Credit Added',
    totalRefunded: 'Total Refunded',
    totalExposure: 'Total Customer Claims (Amount Owed)',
    totalTransactions: 'Total Transactions',
    usedPercentage: 'Used Percentage',
    remainingPercentage: 'Remaining Percentage',
    startingBalance: 'Starting Credit (100% Base)',
    currentBalance: 'Current Balance',
    workBalance: 'Work Balance',
    superAdminWorkBalance: 'Super Admin Work Balance',
    adminWorkBalance: 'Admin Work Balance',
    totalWorkBalance: 'Total Work Balance',
    startingWorkBalance: 'Starting Work Balance',
    workBalanceAdded: 'Work Balance Added',
    workBalanceUsed: 'Work Balance Paid / Issued',
    payWorkBalance: 'Pay Work Balance',
    clearWorkBalance: 'Set Balance to 0',

    // Security & Admins
    securityManagement: 'Security Management',
    registerAdmin: 'Register Admin',
    selectAdminRole: 'Select Role to Create',
    adminRole: 'Admin',
    superAdminOpsRole: 'Super Admin Operations',
    lockAccountNotice: 'This account is locked.',
    sevenDayDeletion: '7-Day Deletion Grace Period',
    restoreAccount: 'Restore Account',
    permanentDelete: 'Permanently Delete',
    tempPasswordNotice: 'Temporary password is 1234. User must change upon login.',

    // Ads
    adsManagement: 'Announcements & Ads'
  }
};

export function formatFullTimestamp(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  // Format: DD/MM/YYYY, HH:mm:ss
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}
