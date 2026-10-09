import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import {
  NmyUser,
  NmyRequest,
  NmyCreditRequest,
  NmyCreditLedgerEntry,
  NmyAuditLog,
  NmySettings,
  NmyService,
  NmySession,
  NmyAnnouncement
} from '../../types/nmyTypes';
import { BottomNav, NavTab } from '../common/BottomNav';
import { LogoutModal } from '../common/LogoutModal';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { BackupRecoveryCenter } from './BackupRecoveryCenter';
import { GlobalSearchAnd360 } from './GlobalSearchAnd360';
import { RevenueAndReportsCenter } from './RevenueAndReportsCenter';
import { SecurityManagement } from './SecurityManagement';
import { formatDateTimeSeconds } from '../../utils/dateUtils';
import {
  ShieldAlert,
  Database,
  Users,
  Briefcase,
  Layers,
  CreditCard,
  Settings as SettingsIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  PlusCircle,
  Phone,
  RefreshCw,
  Bell,
  Lock,
  LogOut,
  Building2,
  FileText,
  KeyRound,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Copy,
  Globe,
  HelpCircle,
  FolderOpen,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { NotificationPermissionBanner } from '../common/NotificationPermissionBanner';

interface Props {
  user: NmyUser;
  onLogout: () => void;
  onUserUpdated: (user: NmyUser) => void;
}

export const SuperAdminWorkspace: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  
  // Profile sub-views
  const [profileView, setProfileView] = useState<
    | 'menu'
    | 'settings'
    | 'security_management'
    | 'taarifa'
    | 'files'
    | 'wateja'
    | 'admins'
    | 'admin_work_history'
    | 'customer_credits'
    | 'credit_requests'
    | 'manual_credit'
    | 'credit_ledger'
    | 'work_account'
    | 'pricing'
    | 'announcements'
    | 'audit_logs'
    | 'reports'
    | 'sessions'
    | 'backup_center'
    | 'global_search'
    | 'revenue_history'
  >('menu');

  // Reject Credit Payment Modal state (eliminating prompt)
  const [rejectPaymentTarget, setRejectPaymentTarget] = useState<any | null>(null);
  const [rejectPaymentReason, setRejectPaymentReason] = useState('');

  // Overview data
  const [stats, setStats] = useState<any>({});
  const [requests, setRequests] = useState<NmyRequest[]>([]);
  const [creditRequests, setCreditRequests] = useState<NmyCreditRequest[]>([]);
  const [ledger, setLedger] = useState<NmyCreditLedgerEntry[]>([]);
  const [workBalanceTzs, setWorkBalanceTzs] = useState<number>(0);
  const [workLedger, setWorkLedger] = useState<any[]>([]);
  const [services, setServices] = useState<NmyService[]>([]);
  const [servicePriceTzs, setServicePriceTzs] = useState<number>(100);
  const [settings, setSettings] = useState<NmySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<NmyAuditLog[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [sessions, setSessions] = useState<NmySession[]>([]);

  // Real Customer Credits Breakdown & All Admin Work History States
  const [customerCreditsList, setCustomerCreditsList] = useState<any[]>([]);
  const [customerCreditsSummary, setCustomerCreditsSummary] = useState<any | null>(null);
  const [adminWorkHistoryList, setAdminWorkHistoryList] = useState<any[]>([]);
  const [adminWorkSummary, setAdminWorkSummary] = useState<any | null>(null);
  const [selectedAdminWork, setSelectedAdminWork] = useState<any | null>(null);
  const [loadingWorkHist, setLoadingWorkHist] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Sub-tabs in Huduma
  const [hudumaTab, setHudumaTab] = useState<'queue' | 'pricing'>('queue');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Work Claim / Complete modal
  const [activeReqToComplete, setActiveReqToComplete] = useState<NmyRequest | null>(null);
  const [nidaInput, setNidaInput] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeErr, setCompleteErr] = useState<string | null>(null);

  const [activeReqToReject, setActiveReqToReject] = useState<NmyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Manual Credit Modal & Phone Lookup
  const [targetCustomerId, setTargetCustomerId] = useState('');
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [lookedUpCustomer, setLookedUpCustomer] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState('1000');
  const [manualDirection, setManualDirection] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [manualReason, setManualReason] = useState('Marekebisho ya Uongozi wa Super Admin');
  const [adjustingCredit, setAdjustingCredit] = useState(false);

  // WhatsApp Number Edit state
  const [editWhatsappNum, setEditWhatsappNum] = useState('');
  const [savingWhatsappNum, setSavingWhatsappNum] = useState(false);

  // Request Timeout Edit state
  const [editTimeoutMin, setEditTimeoutMin] = useState('15');
  const [savingTimeout, setSavingTimeout] = useState(false);

  // Push Notification / FCM Gateway state
  const [fcmStatus, setFcmStatus] = useState<{
    authenticated: boolean;
    projectId: string;
    clientEmail: string;
    totalSubscriptions: number;
    fcmSubscriptions: number;
    webSubscriptions: number;
  } | null>(null);
  const [fcmJsonInput, setFcmJsonInput] = useState('');
  const [savingFcm, setSavingFcm] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Admin Work Account Payment Modal state
  const [adminToPay, setAdminToPay] = useState<any | null>(null);
  const [adminPayAmount, setAdminPayAmount] = useState<string>('');
  const [adminPayReason, setAdminPayReason] = useState<string>('Malipo ya Kazi ya NIDA (WhatsApp Manual Payment)');
  const [processingAdminPayment, setProcessingAdminPayment] = useState(false);
  const [adminPayError, setAdminPayError] = useState<string | null>(null);

  // Price adjustment form
  const [newPriceInput, setNewPriceInput] = useState('100');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  // Create Admin form
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminRegRole, setAdminRegRole] = useState<'ADMIN' | 'SUPER_ADMIN_OPERATIONS'>('ADMIN');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Announcements form (TEXT ONLY)
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTarget, setAnnTarget] = useState<'ALL' | 'ALL_CUSTOMERS' | 'ALL_ADMINS'>('ALL');
  const [annActiveState, setAnnActiveState] = useState(true);
  const [postingAnn, setPostingAnn] = useState(false);
  const [annList, setAnnList] = useState<NmyAnnouncement[]>([]);
  const [editingAnn, setEditingAnn] = useState<NmyAnnouncement | null>(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnMessage, setEditAnnMessage] = useState('');
  const [editAnnTarget, setEditAnnTarget] = useState<'ALL' | 'ALL_CUSTOMERS' | 'ALL_ADMINS'>('ALL');
  const [editAnnActive, setEditAnnActive] = useState(true);
  const [savingEditAnn, setSavingEditAnn] = useState(false);

  // Language state
  const [currentLang, setCurrentLang] = useState<'sw' | 'en'>('sw');

  // Modals & UI States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [resettingWorkBalance, setResettingWorkBalance] = useState(false);
  const [customerCategoryFilter, setCustomerCategoryFilter] = useState<
    | 'ALL'
    | 'ACTIVE_WITH_CREDIT'
    | 'ACTIVE_NO_CREDIT'
    | 'INACTIVE_WITH_CREDIT'
    | 'INACTIVE_NO_CREDIT'
    | 'DELETED_OR_MARKED'
  >('ALL');

  useEffect(() => {
    loadAllData();

    const handleRealtime = (e: any) => {
      const type = e.detail?.type;
      if (type === 'NEW_REQUEST' || type === 'REQUEST_UPDATED' || type === 'ANNOUNCEMENT_CREATED') {
        loadAllData();
      }
    };
    window.addEventListener('ravini_realtime_event', handleRealtime);
    return () => window.removeEventListener('ravini_realtime_event', handleRealtime);
  }, []);

  const loadAllData = async () => {
    try {
      const [overRes, reqsRes, workRes, servRes, setRes, usersRes, credsRes, workHistRes] = await Promise.all([
        NmyApiClient.getSuperAdminOverview(),
        NmyApiClient.getAdminRequests(),
        NmyApiClient.getAdminWorkAccount(),
        NmyApiClient.getServices(),
        NmyApiClient.getPublicConfig(),
        NmyApiClient.getSuperAdminUsers(),
        NmyApiClient.getSuperAdminCustomerCredits(),
        NmyApiClient.getSuperAdminWorkHistoryAdmins()
      ]);

      if (overRes.success && overRes.stats) {
        setStats(overRes.stats);
        if (overRes.stats.servicePriceTzs) {
          setServicePriceTzs(overRes.stats.servicePriceTzs);
          setNewPriceInput(String(overRes.stats.servicePriceTzs));
        }
      }

      if (reqsRes.success && reqsRes.requests) {
        setRequests(reqsRes.requests);
      }

      if (workRes.success) {
        setWorkBalanceTzs(workRes.balanceTzs || 0);
        setWorkLedger(workRes.ledger || []);
      }

      if (servRes.success && servRes.services) {
        setServices(servRes.services);
        const main = servRes.services.find((s: NmyService) => s.code === 'NIDA_MITANDAO_YOTE');
        if (main) {
          setServicePriceTzs(main.priceTzs);
          setNewPriceInput(String(main.priceTzs));
        }
      }

      if (setRes.success && setRes.config) {
        setSettings(setRes.config as any);
        if (setRes.config.whatsappNumber) {
          setEditWhatsappNum(setRes.config.whatsappNumber);
        }
        if (setRes.config.requestTimeoutMinutes) {
          setEditTimeoutMin(String(setRes.config.requestTimeoutMinutes));
        }
      }

      if (usersRes.success && usersRes.users) {
        setUserList(usersRes.users);
      }

      if (credsRes.success && credsRes.customers) {
        setCustomerCreditsList(credsRes.customers);
        setCustomerCreditsSummary(credsRes.summary);
      }

      if (workHistRes.success && workHistRes.admins) {
        setAdminWorkHistoryList(workHistRes.admins);
        setAdminWorkSummary(workHistRes.summary);
      }

      const annRes = await NmyApiClient.getAnnouncements();
      if (annRes.success && annRes.announcements) {
        setAnnList(annRes.announcements);
      }

      await loadPushStatus();
    } catch {
      // Ignore background refresh errors
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Claim Request (Super Admin performing Admin Work)
  const handleClaimRequest = async (requestId: string) => {
    try {
      const res = await NmyApiClient.claimRequest(requestId);
      if (res.success) {
        setToast({ type: 'success', text: `Ombi ${requestId} limechukuliwa kwa usindikaji.` });
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kuchukua ombi.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    }
  };

  // Complete Request
  const handleCompleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReqToComplete) return;

    const trimmed = nidaInput.trim();
    if (!/^\d{20}$/.test(trimmed)) {
      setCompleteErr('Namba ya NIDA lazima iwe na tarakimu 20 haswa.');
      return;
    }

    setCompleting(true);
    setCompleteErr(null);

    try {
      const res = await NmyApiClient.completeRequest(activeReqToComplete.id, trimmed);
      if (res.success) {
        setToast({
          type: 'success',
          text: `Ombi limekamilika! Mapato yameingizwa kwenye Super Admin Work Account.`
        });
        setActiveReqToComplete(null);
        setNidaInput('');
        loadAllData();
      } else {
        setCompleteErr(res.message || 'Hitilafu ya kukamilisha ombi.');
      }
    } catch {
      setCompleteErr('Hitilafu ya muunganisho wa mtandao.');
    } finally {
      setCompleting(false);
    }
  };

  // Reject Request
  const handleRejectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReqToReject) return;

    if (!rejectReason.trim()) {
      setToast({ type: 'error', text: 'Weka sababu ya kukataa ombi.' });
      return;
    }

    setRejecting(true);
    try {
      const res = await NmyApiClient.rejectRequest(activeReqToReject.id, rejectReason.trim());
      if (res.success) {
        setToast({ type: 'success', text: 'Ombi limekataliwa na mteja amerudishiwa Credit kikamilifu.' });
        setActiveReqToReject(null);
        setRejectReason('');
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kukataa ombi.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    } finally {
      setRejecting(false);
    }
  };

  // Price adjustment
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(newPriceInput, 10);
    if (isNaN(parsed) || parsed < 50) {
      setToast({ type: 'error', text: 'Bei lazima iwe angalau TSh 50.' });
      return;
    }

    setUpdatingPrice(true);
    try {
      const res = await NmyApiClient.updateServicePrice('srv_nida_mitandao_yote', parsed);
      if (res.success) {
        setServicePriceTzs(parsed);
        setToast({ type: 'success', text: `Bei ya Huduma imesasishwa kuwa TSh ${parsed.toLocaleString()} kikamilifu!` });
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kubadili bei.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Search Customer by Phone Number (Accepts 07..., 255..., +255...)
  const handleSearchCustomerByPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerSearchPhone.trim()) {
      setLookupError('Weka namba ya simu ya mteja (mfano: 07XXXXXXXX au 255XXXXXXXXX).');
      return;
    }
    setSearchingCustomer(true);
    setLookupError(null);
    try {
      const res = await NmyApiClient.lookupCustomer(customerSearchPhone.trim());
      if (res.success && res.customer) {
        setLookedUpCustomer(res.customer);
        setTargetCustomerId(res.customer.phone || res.customer.id);
      } else {
        setLookedUpCustomer(null);
        setLookupError(res.message || 'Mteja hakupatikana kwa namba ya simu uliyoweka. Tafadhali hakikisha mteja yupo kwenye mfumo.');
      }
    } catch {
      setLookupError('Hitilafu ya mtandao wakati wa kutafuta mteja.');
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Manual Credit adjustment by Phone Number (User ID NOT mandatory)
  const handleManualCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(manualAmount, 10);
    const identifier = (lookedUpCustomer ? lookedUpCustomer.phone : targetCustomerId).trim();

    if (!identifier || isNaN(amountNum) || amountNum <= 0) {
      setToast({ type: 'error', text: 'Weka namba ya simu ya mteja na kiasi halali cha Credit.' });
      return;
    }

    const finalAmount = manualDirection === 'ADD' ? amountNum : -amountNum;

    setAdjustingCredit(true);
    try {
      const res = await NmyApiClient.adjustCustomerCredit({
        phone: identifier,
        amountTzs: finalAmount,
        reason: manualReason.trim()
      });

      if (res.success) {
        setToast({ type: 'success', text: `Salio la mteja ${res.customer?.fullName || identifier} limesasishwa: ${res.message}` });
        if (lookedUpCustomer) {
          setLookedUpCustomer({
            ...lookedUpCustomer,
            currentBalanceTzs: res.newBalance
          });
        }
        setTargetCustomerId('');
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kurekebisha salio.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    } finally {
      setAdjustingCredit(false);
    }
  };

  // Save WhatsApp Payment Number (SUPER_ADMIN Only)
  const handleSaveWhatsappNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWhatsappNum.trim()) {
      setToast({ type: 'error', text: 'Weka namba sahihi ya WhatsApp.' });
      return;
    }
    setSavingWhatsappNum(true);
    try {
      const res = await NmyApiClient.updateWhatsappNumber(editWhatsappNum.trim());
      if (res.success) {
        setToast({ type: 'success', text: `Namba ya WhatsApp na Huduma imesasishwa kuwa ${res.whatsappNumber}.` });
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kusasisha namba ya WhatsApp.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kusasisha namba ya WhatsApp.' });
    } finally {
      setSavingWhatsappNum(false);
    }
  };

  // Save Request Timeout Duration (SUPER_ADMIN Only)
  const handleSaveRequestTimeout = async (newTimeout?: number) => {
    const val = newTimeout ?? Number(editTimeoutMin);
    if (!val || isNaN(val) || val < 1 || val > 1440) {
      setToast({ type: 'error', text: 'Weka muda sahihi wa dakika (kati ya 1 na 1440).' });
      return;
    }
    setSavingTimeout(true);
    try {
      const res = await NmyApiClient.updateRequestTimeout(val);
      if (res.success) {
        setToast({ type: 'success', text: `Muda wa maombi kuisha (Timeout) umesasishwa kuwa dakika ${res.requestTimeoutMinutes}.` });
        setEditTimeoutMin(String(res.requestTimeoutMinutes));
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kusasisha muda wa ombi.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kusasisha muda wa ombi.' });
    } finally {
      setSavingTimeout(false);
    }
  };

  // Push Notifications / FCM Gateway handlers
  const loadPushStatus = async () => {
    try {
      const res = await NmyApiClient.getPushStatus();
      if (res.success && res.pushStatus) {
        setFcmStatus(res.pushStatus);
      }
    } catch {}
  };

  const handleSaveFcmJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcmJsonInput.trim()) return;
    setSavingFcm(true);
    try {
      const parsed = JSON.parse(fcmJsonInput.trim());
      const res = await NmyApiClient.configureFcm(parsed);
      if (res.success) {
        setToast({ type: 'success', text: res.message || 'FCM Service Account imehifadhiwa kikamilifu!' });
        setFcmJsonInput('');
        await loadPushStatus();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kuhifadhi FCM JSON.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Maandishi si JSON halali. Hakikisha umenakili faili lote la serviceAccountKey.json kutoka Firebase Console.' });
    } finally {
      setSavingFcm(false);
    }
  };

  const handleTestPushNotification = async () => {
    setTestingPush(true);
    try {
      const res = await NmyApiClient.sendTestPush();
      if (res.success) {
        setToast({ type: 'success', text: res.message || 'Arifa ya jaribio imetumwa!' });
        await loadPushStatus();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kutuma arifa ya jaribio.' });
      }
    } catch (e: any) {
      setToast({ type: 'error', text: e.message || 'Hitilafu ya mtandao.' });
    } finally {
      setTestingPush(false);
    }
  };

  // Admin Work Account Payment (PAY / LIPA)
  const handleOpenAdminPay = (adm: any) => {
    setAdminToPay(adm);
    const bal = adm.workBalanceTzs || 0;
    setAdminPayAmount(String(bal));
    setAdminPayReason('Malipo ya Kazi ya NIDA (WhatsApp Manual Payment)');
    setAdminPayError(null);
  };

  const handleOpenAdminWhatsapp = async () => {
    if (!adminToPay) return;
    const amt = Number(adminPayAmount) || adminToPay.workBalanceTzs || 0;
    try {
      const res = await NmyApiClient.getAdminWorkPaymentLink(adminToPay.id, amt);
      if (res.success && res.whatsappUrl) {
        window.open(res.whatsappUrl, '_blank');
      } else {
        setAdminPayError(res.message || 'Hitilafu ya kupata kiunganishi cha WhatsApp.');
      }
    } catch {
      setAdminPayError('Hitilafu ya kufungua WhatsApp.');
    }
  };

  const handleAdminWorkPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToPay) return;
    const amt = Number(adminPayAmount);
    const outstanding = adminToPay.workBalanceTzs || 0;

    if (isNaN(amt) || amt <= 0) {
      setAdminPayError('Weka kiasi halali cha kulipa (zaidi ya 0).');
      return;
    }
    if (amt > outstanding) {
      setAdminPayError(`Kiasi cha malipo (TSh ${amt.toLocaleString()}) hakiwezi kuzidi salio lililopo (TSh ${outstanding.toLocaleString()}).`);
      return;
    }

    setProcessingAdminPayment(true);
    setAdminPayError(null);
    try {
      const res = await NmyApiClient.payAdminWorkBalance(adminToPay.id, {
        amount: amt,
        reason: adminPayReason.trim()
      });
      if (res.success) {
        setToast({
          type: 'success',
          text: `Malipo ya TSh ${amt.toLocaleString()} yamethibitishwa kwa ${adminToPay.fullName}. Salio lililobaki: TSh ${res.remainingBalance.toLocaleString()}.`
        });
        setAdminToPay(null);
        loadAllData();
      } else {
        setAdminPayError(res.message || 'Hitilafu ya kuthibitisha malipo.');
      }
    } catch {
      setAdminPayError('Hitilafu ya mtandao wakati wa kuthibitisha malipo.');
    } finally {
      setProcessingAdminPayment(false);
    }
  };

  // Review Credit Payment Proof
  const handleReviewCreditRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED', reasonInput?: string) => {
    try {
      const action = status === 'APPROVED' ? 'APPROVE' : 'REJECT';
      const res = await NmyApiClient.reviewCreditRequest(requestId, action, reasonInput);
      if (res.success) {
        setToast({
          type: 'success',
          text: status === 'APPROVED' ? 'Malipo yameidhinishwa na Credit zimeongezwa kwa mteja!' : 'Ombi la Credit limekataliwa.'
        });
        const credRes = await NmyApiClient.getSuperAdminCreditRequests();
        if (credRes.success && credRes.requests) setCreditRequests(credRes.requests);
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kuhakiki ombi la Credit.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    }
  };

  // Create Admin or Super Admin Operations
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPhone.trim() || !newAdminName.trim() || !newAdminPassword) {
      setToast({ type: 'error', text: 'Jaza nafasi zote zinazohitajika.' });
      return;
    }

    setCreatingAdmin(true);
    try {
      const isOps = adminRegRole === 'SUPER_ADMIN_OPERATIONS';
      const res = await NmyApiClient.createAdmin({
        fullName: newAdminName.trim(),
        phone: newAdminPhone.trim(),
        password: newAdminPassword,
        role: adminRegRole,
        departmentId: isOps ? 'dept_operations' : 'dept_nida_processing',
        permissions: isOps
          ? ['PROCESS_REQUESTS', 'APPROVE_REQUESTS', 'REJECT_REQUESTS', 'CAN_ADD_CREDIT', 'VIEW_CUSTOMER_PHONE']
          : ['PROCESS_REQUESTS', 'APPROVE_REQUESTS', 'REJECT_REQUESTS']
      });

      if (res.success) {
        setToast({
          type: 'success',
          text: `${isOps ? 'Super Admin Operations' : 'Admin'} ${newAdminName} ameundwa kikamilifu!`
        });
        setNewAdminName('');
        setNewAdminPhone('');
        setNewAdminPassword('');
        const uRes = await NmyApiClient.getSuperAdminUsers();
        if (uRes.success && uRes.users) setUserList(uRes.users);
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kuunda akaunti.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Toggle Setting
  const handleToggleSetting = async (key: keyof NmySettings, val: any) => {
    if (!settings) return;
    try {
      const res = await NmyApiClient.updateSettings({ [key]: val });
      if (res.success && res.settings) {
        setSettings(res.settings);
        setToast({ type: 'success', text: 'Mipangilio imesasishwa kikamilifu.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    }
  };

  // Post announcement (TEXT ONLY)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    setPostingAnn(true);
    try {
      const res = await NmyApiClient.createAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        targetType: annTarget,
        isActive: annActiveState
      });

      if (res.success) {
        setToast({ type: 'success', text: 'Tangazo la maandishi limechapishwa kikamilifu!' });
        setAnnTitle('');
        setAnnMessage('');
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kutuma tangazo.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya muunganisho wa mtandao.' });
    } finally {
      setPostingAnn(false);
    }
  };

  const handleToggleAnnStatus = async (ann: NmyAnnouncement) => {
    try {
      const res = await NmyApiClient.toggleAnnouncementStatus(ann.id, !ann.isActive);
      if (res.success) {
        setToast({ type: 'success', text: res.message || 'Hali ya tangazo imesasishwa.' });
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kubadili hali ya tangazo.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya kubadili hali ya tangazo.' });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await NmyApiClient.deleteAnnouncement(id);
      if (res.success) {
        setToast({ type: 'success', text: 'Tangazo limefutwa kikamilifu.' });
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kufuta tangazo.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya kufuta tangazo.' });
    }
  };

  const handleStartEditAnn = (ann: NmyAnnouncement) => {
    setEditingAnn(ann);
    setEditAnnTitle(ann.title);
    setEditAnnMessage(ann.message);
    setEditAnnTarget((ann.targetType as any) || 'ALL');
    setEditAnnActive(ann.isActive !== false);
  };

  const handleSaveEditAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !editAnnTitle.trim() || !editAnnMessage.trim()) return;

    setSavingEditAnn(true);
    try {
      const res = await NmyApiClient.updateAnnouncement(editingAnn.id, {
        title: editAnnTitle.trim(),
        message: editAnnMessage.trim(),
        targetType: editAnnTarget,
        isActive: editAnnActive
      });

      if (res.success) {
        setToast({ type: 'success', text: 'Tangazo limesasishwa kikamilifu!' });
        setEditingAnn(null);
        loadAllData();
      } else {
        setToast({ type: 'error', text: res.message || 'Hitilafu ya kuhariri tangazo.' });
      }
    } catch {
      setToast({ type: 'error', text: 'Hitilafu ya kuhariri tangazo.' });
    } finally {
      setSavingEditAnn(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    await NmyApiClient.logout();
    setLoggingOut(false);
    setShowLogoutModal(false);
    onLogout();
  };

  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  const allCustomers = userList.filter(u => u.role === 'CUSTOMER');

  const filteredCustomers = allCustomers
    .filter(u => {
      const balance = Number(u.creditBalanceTzs) || 0;
      const isActive = u.status === 'ACTIVE';
      const isDeletedOrMarked = u.status === 'DELETED' || u.status === 'MARKED_FOR_DELETION';

      if (customerCategoryFilter === 'ACTIVE_WITH_CREDIT') {
        return isActive && balance > 0;
      }
      if (customerCategoryFilter === 'ACTIVE_NO_CREDIT') {
        return isActive && balance <= 0;
      }
      if (customerCategoryFilter === 'INACTIVE_WITH_CREDIT') {
        return !isActive && !isDeletedOrMarked && balance > 0;
      }
      if (customerCategoryFilter === 'INACTIVE_NO_CREDIT') {
        return !isActive && !isDeletedOrMarked && balance <= 0;
      }
      if (customerCategoryFilter === 'DELETED_OR_MARKED') {
        return isDeletedOrMarked;
      }
      return true; // 'ALL'
    })
    .filter(u => {
      if (!customerSearch.trim()) return true;
      const q = customerSearch.toLowerCase();
      return (u.fullName || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
    });

  const adminList = userList.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN_OPERATIONS');

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-neutral-900 pb-20 font-sans selection:bg-red-100 selection:text-red-700">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <ShieldAlert className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black tracking-tight text-neutral-900 uppercase">
                  SUPER ADMIN
                </h1>
                <span className="px-1.5 py-0.2 bg-neutral-900 text-white text-[9px] font-black rounded-sm">
                  ROOT
                </span>
              </div>
              <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                RAVINI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Work Account pill with clear label */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setProfileView('work_account');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs transition-all cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Kazi:</span>
              <span className="font-black text-neutral-900">TSh {workBalanceTzs.toLocaleString()}</span>
            </button>

            {/* Quick Settings Icon button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setProfileView('settings');
              }}
              title="Settings"
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Real Push Notification Permission Guidance */}
        <NotificationPermissionBanner userRole="SUPER_ADMIN" />

        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================= TAB 1: HOME ======================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Super Admin Header Card */}
            <div className="bg-gradient-to-br from-red-600 via-red-600 to-neutral-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[9px] font-black rounded uppercase tracking-wider">
                    SUPER ADMIN • ROOT
                  </span>
                  <p className="text-[10px] text-red-200 uppercase font-bold mt-1">
                    RAVINI
                  </p>
                </div>
                <button
                  onClick={loadAllData}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-lg font-black tracking-tight mt-2">
                {user.fullName}
              </h2>
              <p className="text-xs text-red-100 font-mono">{user.phone}</p>

              {/* Financial Distinction Cards */}
              <div className="mt-4 pt-3 border-t border-white/20 space-y-2.5">
                {/* 1. SUPER ADMIN WORK ACCOUNT */}
                <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200 block">
                      SUPER ADMIN WORK ACCOUNT
                    </span>
                    <span className="text-[10px] text-red-100">Mapato ya kazi zilizokamilishwa</span>
                  </div>
                  <strong className="text-base font-black text-white">
                    TSh {workBalanceTzs.toLocaleString()}
                  </strong>
                </div>

                {/* 2. CREDIT ZA WATEJA */}
                <div
                  onClick={() => {
                    setActiveTab('profile');
                    setProfileView('customer_credits');
                  }}
                  className="flex items-center justify-between bg-black/20 hover:bg-black/35 p-2.5 rounded-xl transition-all cursor-pointer group"
                  title="Bofya hapa kuona orodha na salio la Credit za kila mteja"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200 flex items-center gap-1 group-hover:text-white transition-colors">
                      CREDIT ZA WATEJA <ChevronRight className="w-3 h-3 text-red-300 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-[10px] text-red-100">Jumla ya salio la wateja • Bofya kuona mchanganuo</span>
                  </div>
                  <strong className="text-base font-black text-white">
                    TSh {(stats.totalCustomerBalances || 0).toLocaleString()}
                  </strong>
                </div>

                {/* 3. BEI YA HUDUMA YA NIDA */}
                <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200 block">
                      BEI YA HUDUMA YA NIDA
                    </span>
                    <span className="text-[10px] text-red-100">Gharama ya sasa kwa kila ombi</span>
                  </div>
                  <strong className="text-base font-black text-white">
                    TSh {servicePriceTzs.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div
                onClick={async () => {
                  const uRes = await NmyApiClient.getSuperAdminUsers();
                  if (uRes.success && uRes.users) setUserList(uRes.users);
                  setActiveTab('profile');
                  setProfileView('wateja');
                }}
                className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-red-400 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Wateja</span>
                <p className="text-xl font-black text-neutral-900 mt-0.5">{stats.totalCustomers ?? 0}</p>
                <span className="text-[9px] text-neutral-400 font-semibold">Tazama wote & salio</span>
              </div>

              <div
                onClick={async () => {
                  const uRes = await NmyApiClient.getSuperAdminUsers();
                  if (uRes.success && uRes.users) setUserList(uRes.users);
                  setActiveTab('profile');
                  setProfileView('admins');
                }}
                className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-red-400 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Admins</span>
                <p className="text-xl font-black text-neutral-900 mt-0.5">{stats.totalAdmins ?? 0}</p>
                <span className="text-[9px] text-neutral-400 font-semibold">Dhibiti ma-admin</span>
              </div>

              <div
                onClick={async () => {
                  const credRes = await NmyApiClient.getSuperAdminCreditRequests();
                  if (credRes.success && credRes.requests) setCreditRequests(credRes.requests);
                  setActiveTab('profile');
                  setProfileView('credit_requests');
                }}
                className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-red-400 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Maombi Credit</span>
                <p className="text-xl font-black text-red-600 mt-0.5">{stats.pendingCreditRequests ?? 0}</p>
                <span className="text-[9px] text-neutral-400 font-semibold">Yanasubiri review</span>
              </div>
            </div>

            {/* HISTORIA YA KAZI YA WATU WOTE BANNER */}
            <div
              onClick={async () => {
                setLoadingWorkHist(true);
                try {
                  const res = await NmyApiClient.getSuperAdminWorkHistoryAdmins();
                  if (res.success && res.admins) {
                    setAdminWorkHistoryList(res.admins);
                    setAdminWorkSummary(res.summary);
                  }
                } finally {
                  setLoadingWorkHist(false);
                }
                setActiveTab('profile');
                setProfileView('admin_work_history');
              }}
              className="bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-4 rounded-2xl shadow-sm border border-neutral-700/80 cursor-pointer hover:border-red-500 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 stroke-[2.2px]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        HISTORIA YA KAZI YA WATU WOTE
                      </h3>
                      <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black rounded-sm">
                        LIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-300 mt-0.5">
                      Ufuatiliaji wa kazi, maombi yaliyochukuliwa, muda na mapato ya watendaji wote
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-700/60 grid grid-cols-3 gap-2 text-center">
                <div className="bg-neutral-800/80 p-2 rounded-xl border border-neutral-700/50">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Watendaji</span>
                  <strong className="text-sm font-black text-white mt-0.5 block">
                    {adminWorkSummary?.totalAdminsTracked || (stats.totalAdmins ? stats.totalAdmins + 1 : 1)}
                  </strong>
                </div>
                <div className="bg-neutral-800/80 p-2 rounded-xl border border-neutral-700/50">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Zilizokamilishwa</span>
                  <strong className="text-sm font-black text-emerald-400 mt-0.5 block">
                    {adminWorkSummary?.totalJobsCompletedAcrossAll || stats.approvedRequests || 0}
                  </strong>
                </div>
                <div className="bg-neutral-800/80 p-2 rounded-xl border border-neutral-700/50">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase block">Jumla ya Mapato</span>
                  <strong className="text-sm font-black text-amber-400 mt-0.5 block">
                    TSh {(adminWorkSummary?.totalWorkEarningsAllTzs || workBalanceTzs || 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Request Summary */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  Hali ya Maombi ya NIDA
                </h3>
                <span className="text-xs font-black text-red-600">Jumla: {stats.totalRequests ?? 0}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[9px] font-bold text-amber-800 uppercase block">Queue</span>
                  <strong className="text-amber-900 text-sm font-black">{stats.pendingRequests ?? 0}</strong>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[9px] font-bold text-blue-800 uppercase block">Inafanywa</span>
                  <strong className="text-blue-900 text-sm font-black">{stats.processingRequests ?? 0}</strong>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">Imekamilika</span>
                  <strong className="text-emerald-900 text-sm font-black">{stats.approvedRequests ?? 0}</strong>
                </div>
                <div className="p-2 bg-red-50 rounded-xl border border-red-200">
                  <span className="text-[9px] font-bold text-red-800 uppercase block">Imekataliwa</span>
                  <strong className="text-red-900 text-sm font-black">{stats.rejectedRequests ?? 0}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-150">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('huduma');
                    setHudumaTab('queue');
                  }}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>FUNGUA MAOMBI</span>
                </button>
              </div>
            </div>

            {/* Quick Super Admin Actions */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide mb-2">
                Njia za Mkato za Usimamizi
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    const credRes = await NmyApiClient.getSuperAdminCreditRequests();
                    if (credRes.success && credRes.requests) setCreditRequests(credRes.requests);
                    setActiveTab('profile');
                    setProfileView('credit_requests');
                  }}
                  className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-left font-bold text-neutral-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Kagua Malipo ya Credit</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('huduma');
                    setHudumaTab('pricing');
                  }}
                  className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-left font-bold text-neutral-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Badilisha Bei (TSh {servicePriceTzs})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setProfileView('manual_credit');
                  }}
                  className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-left font-bold text-neutral-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Ongeza Credit ya Mteja</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setProfileView('announcements');
                  }}
                  className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-left font-bold text-neutral-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Tuma Tangazo Jipya</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: HUDUMA ======================= */}
        {activeTab === 'huduma' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Sub-tabs: MAOMBI YA NIDA vs BEI & HUDUMA */}
            <div className="grid grid-cols-2 p-1 bg-white border border-neutral-200/80 rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={() => setHudumaTab('queue')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  hudumaTab === 'queue'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                MAOMBI YA NIDA
              </button>
              <button
                type="button"
                onClick={() => setHudumaTab('pricing')}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  hudumaTab === 'pricing'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                BEI & HUDUMA
              </button>
            </div>

            {/* Sub-view 1: MAOMBI YA NIDA (Queue) */}
            {hudumaTab === 'queue' && (
              <div className="space-y-3">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {(['ALL', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'] as const).map(tabKey => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setRequestFilter(tabKey)}
                      className={`px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
                        requestFilter === tabKey
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {tabKey === 'ALL' ? 'Yote' : tabKey}
                    </button>
                  ))}
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Hakuna maombi kwenye orodha hii.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map(req => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-neutral-800">{req.id}</span>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              Mteja: <strong>{req.customerName}</strong> ({req.customerPhone})
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              req.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : req.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800'
                                : req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-neutral-400 block uppercase">Namba Inayotafutiwa</span>
                            <span className="font-mono font-bold text-neutral-900 text-sm">{req.targetPhoneNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block uppercase">Gharama</span>
                            <span className="font-bold text-red-600">TSh {req.chargedPriceTzs.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Timestamps Timeline */}
                        <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-neutral-600">
                            <span>Muda Uliotumwa / Kupokelewa:</span>
                            <span className="font-mono font-bold text-neutral-800">{formatDateTimeSeconds(req.createdAt)}</span>
                          </div>
                          {req.claimedAt && (
                            <div className="flex items-center justify-between text-blue-800">
                              <span>Kuanza Kushughulikiwa:</span>
                              <span className="font-mono font-bold">{formatDateTimeSeconds(req.claimedAt)}</span>
                            </div>
                          )}
                          {req.status === 'APPROVED' && (
                            <div className="flex items-center justify-between text-emerald-800">
                              <span>Muda wa Majibu (Response):</span>
                              <span className="font-mono font-bold">{formatDateTimeSeconds(req.completedAt || req.updatedAt)}</span>
                            </div>
                          )}
                          {req.status === 'REJECTED' && (
                            <div className="flex items-center justify-between text-red-700">
                              <span>Muda Uliokataliwa:</span>
                              <span className="font-mono font-bold">{formatDateTimeSeconds(req.rejectedAt || req.updatedAt)}</span>
                            </div>
                          )}
                          {req.status === 'EXPIRED' && (
                            <div className="flex items-center justify-between text-amber-900">
                              <span>Muda Ulioisha (Expired):</span>
                              <span className="font-mono font-bold">{formatDateTimeSeconds(req.updatedAt)}</span>
                            </div>
                          )}
                          {(req.status === 'REJECTED' || req.status === 'EXPIRED') && (
                            <div className="flex items-center justify-between text-emerald-700">
                              <span>Muda wa Rejesho (Refund):</span>
                              <span className="font-mono font-bold">{formatDateTimeSeconds(req.refundedAt || req.rejectedAt || req.updatedAt)}</span>
                            </div>
                          )}
                        </div>

                        {/* If APPROVED: Show Result */}
                        {req.status === 'APPROVED' && req.nidaResult && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black uppercase text-emerald-800 block">
                                Namba ya NIDA (Tarakimu 20)
                              </span>
                              <span className="font-mono text-xs font-black text-emerald-950">
                                {req.nidaResult}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(req.nidaResult!, req.id)}
                              className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 text-[10px] font-bold flex items-center gap-1 shadow-2xs hover:bg-emerald-100 cursor-pointer"
                            >
                              {copiedId === req.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === req.id ? 'Imenakiliwa' : 'Nakili'}</span>
                            </button>
                          </div>
                        )}

                        {/* If REJECTED: Show Reason */}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                            <span className="font-bold block">Sababu ya kukataliwa:</span>
                            <p>{req.rejectionReason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-1 flex items-center gap-2">
                          {req.status === 'PENDING' && (
                            <div className="grid grid-cols-2 gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => handleClaimRequest(req.id)}
                                className="py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                SHUGHULIKIA (CLAIM)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReqToReject(req);
                                  setRejectReason('');
                                }}
                                className="py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                KATAA OMBI
                              </button>
                            </div>
                          )}

                          {req.status === 'PROCESSING' && (
                            <div className="grid grid-cols-2 gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReqToComplete(req);
                                  setNidaInput('');
                                  setCompleteErr(null);
                                }}
                                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                WEKA NIDA & KAMILISHA
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReqToReject(req);
                                  setRejectReason('');
                                }}
                                className="py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                KATAA OMBI
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-view 2: BEI & HUDUMA */}
            {hudumaTab === 'pricing' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h3 className="text-base font-black text-neutral-900 uppercase">
                        HUDUMA: HUDUMA YA NIDA
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Usimamizi wa bei na upatikanaji wa huduma
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase">
                      INAPATIKANA
                    </span>
                  </div>

                  {/* Clear Label: Bei ya Huduma */}
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                    <span className="text-[11px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                      BEI YA HUDUMA YA NIDA KWA SASA
                    </span>
                    <div className="text-2xl font-black text-neutral-900">
                      TSh {servicePriceTzs.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Kiasi hiki kinakatwa kiotomatiki kutoka kwa Credit za mteja kila anapoomba NIDA.
                    </p>
                  </div>

                  {/* Form to change price */}
                  <form onSubmit={handleUpdatePrice} className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                      Panga Bei ya Huduma ya NIDA
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Bei Mpya (TSh)
                      </label>
                      <input
                        type="number"
                        min="50"
                        step="10"
                        value={newPriceInput}
                        onChange={e => setNewPriceInput(e.target.value)}
                        placeholder="Weka bei mpya TSh"
                        className="w-full px-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:border-red-500 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updatingPrice}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {updatingPrice ? 'Inahifadhi...' : 'HIFADHI BEI MPYA'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: PROFILE ======================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Sub-view: MENU KUU YA PROFILE */}
            {profileView === 'menu' && (
              <div className="space-y-4">
                {/* Header Box */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                      BM
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base font-black text-neutral-900">{user.fullName}</h2>
                        <span className="px-2 py-0.2 bg-neutral-900 text-white rounded text-[9px] font-black uppercase">
                          SUPER_ADMIN
                        </span>
                      </div>
                      <p className="text-xs font-mono text-neutral-500 mt-0.5">{user.phone}</p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mt-0.5">
                        RAVINI
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Items */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden divide-y divide-neutral-100">
                  <button
                    type="button"
                    onClick={() => setProfileView('taarifa')}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                  >
                    <span>Taarifa za Akaunti</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                  >
                    <span>Badilisha Neno la Siri</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <div className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800">
                    <span>Badilisha Lugha</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentLang('sw')}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer ${
                          currentLang === 'sw' ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        KISWAHILI
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentLang('en')}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer ${
                          currentLang === 'en' ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        ENGLISH
                      </button>
                    </div>
                  </div>

                  {/* GLOBAL SEARCH */}
                  <button
                    type="button"
                    onClick={() => setProfileView('global_search')}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-red-600" />
                      <span>GLOBAL SEARCH (WATEJA, ADMINS, MAOMBI)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  {/* BACKUP & RECOVERY CENTER */}
                  <button
                    type="button"
                    onClick={() => setProfileView('backup_center')}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>BACKUP & RECOVERY CENTER (ULINZI WA DATA)</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                      VERIFIED
                    </span>
                  </button>

                  {/* HISTORIA YA MAPATO */}
                  <button
                    type="button"
                    onClick={() => setProfileView('revenue_history')}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>HISTORIA YA MAPATO NA RIPOTI ZA EXCEL</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  {/* SETTINGS (Dedicated button) */}
                  <button
                    type="button"
                    onClick={() => setProfileView('settings')}
                    className="w-full p-4 flex items-center justify-between text-xs font-black text-red-600 bg-red-50/50 hover:bg-red-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <SettingsIcon className="w-4 h-4 text-red-600" />
                      <span className="uppercase tracking-wider">SETTINGS (MIPANGILIO YA MFUMO)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-600" />
                  </button>

                  {/* FILES */}
                  <button
                    type="button"
                    onClick={() => setProfileView('files')}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-4 h-4 text-neutral-500" />
                      <span>FILES (USIMAMIZI WA MAFAILI)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>

                {/* Section: TOKA (LOGOUT) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-red-50 text-red-600 font-black text-xs rounded-2xl border border-neutral-200/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.2px]" />
                    <span>TOKA KWENYE AKAUNTI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-view: DEDICATED SETTINGS VIEW */}
            {profileView === 'settings' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Profile</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <SettingsIcon className="w-5 h-5 text-red-600" />
                    <h2 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                      SETTINGS
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Usimamizi mkuu wa mfumo wa RAVINI
                  </p>
                </div>

                {/* SECURITY MANAGEMENT - SINGLE ITEM ENTRY IN SETTINGS */}
                <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setProfileView('security_management')}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-red-50/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
                        <ShieldAlert className="w-5 h-5 stroke-[2.2px]" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-neutral-900 block uppercase tracking-tight">
                          SECURITY MANAGEMENT
                        </span>
                        <span className="text-[11px] font-normal text-neutral-500">
                          🔒 Funga • 🔓 Fungua • 🗑️ Futa • 🔑 Reset PIN/Password • 📁 Files • 🔐 Admin Access
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-md">
                        MAMLAKA KUU
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </button>
                </div>

                {/* Section 1: AKAUNTI NA USALAMA */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    AKAUNTI NA USALAMA
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {/* Emergency Lock Toggle */}
                    <div className="p-3.5 flex items-center justify-between text-xs bg-red-50/40">
                      <div>
                        <span className="font-black text-neutral-900 block flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-red-600" />
                          <span>Emergency Lock (Kufunga Vitendo Hatarishi)</span>
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {settings?.emergencyLockActive ? '🔒 Imewashwa: Vitendo hatarishi vimesitishwa' : '🔓 Imezimwa: Mfumo unafanya kazi kawaida'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const willLock = !settings?.emergencyLockActive;
                          const res = await NmyApiClient.toggleEmergencyLock(willLock);
                          if (res.success) {
                            setSettings(prev => prev ? { ...prev, emergencyLockActive: willLock } : prev);
                            setToast({
                              type: willLock ? 'error' : 'success',
                              text: willLock ? 'Emergency Lock Imewashwa' : 'Emergency Lock Imezimwa'
                            });
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                          settings?.emergencyLockActive
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        }`}
                      >
                        {settings?.emergencyLockActive ? 'IMEFUNGWA' : 'FUNGUA'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProfileView('backup_center')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Backup & Recovery Center (Ulinzi wa Data)</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                        VERIFIED
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileView('global_search')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-red-600" />
                        <span>Global Search & 360° Profiles</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileView('taarifa')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Akaunti ya Super Admin</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Usalama & Badilisha Password</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await NmyApiClient.getSessions();
                        if (res.success && res.sessions) setSessions(res.sessions);
                        setProfileView('sessions');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Sessions / Vifaa Vilivyoingia</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileView('announcements')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Notifications & Matangazo</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section 2: USIMAMIZI WA AKAUNTI */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    USIMAMIZI WA AKAUNTI
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={async () => {
                        const uRes = await NmyApiClient.getSuperAdminUsers();
                        if (uRes.success && uRes.users) setUserList(uRes.users);
                        setProfileView('wateja');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-neutral-600" />
                        <span>Wateja & Salio la Credit</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const uRes = await NmyApiClient.getSuperAdminUsers();
                        if (uRes.success && uRes.users) setUserList(uRes.users);
                        setProfileView('admins');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-neutral-600" />
                        <span>Admins & Tengeneza Admin Mpya</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingWorkHist(true);
                        try {
                          const res = await NmyApiClient.getSuperAdminWorkHistoryAdmins();
                          if (res.success && res.admins) {
                            setAdminWorkHistoryList(res.admins);
                            setAdminWorkSummary(res.summary);
                          }
                        } finally {
                          setLoadingWorkHist(false);
                        }
                        setProfileView('admin_work_history');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer bg-red-50/30"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-red-600" />
                        <span className="text-red-950 font-black">Historia ya Kazi ya Watu Wote</span>
                      </div>
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-sm">
                          LIVE
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </span>
                    </button>
                  </div>
                </div>

                {/* Section 3: CREDIT */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    CREDIT
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingCredits(true);
                        try {
                          const cRes = await NmyApiClient.getSuperAdminCustomerCredits();
                          if (cRes.success && cRes.customers) {
                            setCustomerCreditsList(cRes.customers);
                            setCustomerCreditsSummary(cRes.summary);
                          }
                        } finally {
                          setLoadingCredits(false);
                        }
                        setProfileView('customer_credits');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer bg-amber-50/20"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <span className="text-neutral-900 font-black">Salio & Mchanganuo wa Wateja</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const credRes = await NmyApiClient.getSuperAdminCreditRequests();
                        if (credRes.success && credRes.requests) setCreditRequests(credRes.requests);
                        setProfileView('credit_requests');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Credit Requests (Maombi ya Malipo)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileView('manual_credit')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Ongeza / Rekebisha Credit ya Mteja</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const lRes = await NmyApiClient.getSuperAdminCreditLedger();
                        if (lRes.success && lRes.ledger) setLedger(lRes.ledger);
                        setProfileView('credit_ledger');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Credit Ledger (Historia ya Miamala)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section 4: HUDUMA */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    HUDUMA
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <div className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-neutral-900 block">HUDUMA YA NIDA</span>
                        <span className="text-[11px] text-neutral-500">Huduma ya namba za NIDA</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                        INAFANYA KAZI
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('huduma');
                        setHudumaTab('pricing');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Bei za Huduma (TSh {servicePriceTzs})</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section 5: DEPARTMENTS & PERMISSIONS */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden p-4 space-y-2">
                  <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    DEPARTMENTS & PERMISSIONS
                  </h4>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                    <span className="font-bold text-neutral-800">Kitengo cha Usindikaji wa NIDA (NIDA_PROCESSING)</span>
                    <p className="text-[11px] text-neutral-500">
                      Mamlaka: PROCESS_REQUESTS, APPROVE_REQUESTS, REJECT_REQUESTS
                    </p>
                  </div>
                </div>

                {/* Section 6: SYSTEM */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden p-4 space-y-3">
                  <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    SYSTEM SETTINGS
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-800 block">Public Registration</span>
                      <span className="text-[11px] text-neutral-500">Kuruhusu watumiaji wapya kujisajili</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('publicRegistrationOpen', !settings?.publicRegistrationOpen)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black cursor-pointer ${
                        settings?.publicRegistrationOpen ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {settings?.publicRegistrationOpen ? 'WAZI' : 'IMEFUNGWA'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                    <div>
                      <span className="font-bold text-neutral-800 block">App Access</span>
                      <span className="text-[11px] text-neutral-500">Ufikiaji wa mfumo kwa umma</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSetting('appAccessOpen', !settings?.appAccessOpen)}
                      className={`px-3 py-1 rounded-full text-[11px] font-black cursor-pointer ${
                        settings?.appAccessOpen ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {settings?.appAccessOpen ? 'WAZI' : 'IMEFUNGWA'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-neutral-800 block">Muda wa Maombi Kuisha (Request Timeout)</span>
                        <span className="text-[11px] text-neutral-500">Ombi lisipojibiwa ndani ya muda huu linakuwa EXPIRED na kurudishiwa Credit</span>
                      </div>
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg text-xs">
                        Dakika {settings?.requestTimeoutMinutes || 15}
                      </span>
                    </div>

                    {/* Quick selection pills & custom input */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[5, 10, 15, 30, 60].map(min => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => {
                            setEditTimeoutMin(String(min));
                            handleSaveRequestTimeout(min);
                          }}
                          disabled={savingTimeout}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                            (settings?.requestTimeoutMinutes || 15) === min
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {min}m {min === 15 ? '(Default)' : ''}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={editTimeoutMin}
                        onChange={e => setEditTimeoutMin(e.target.value)}
                        placeholder="Weka dakika (mfano: 15)"
                        className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-xs font-bold text-neutral-900 focus:outline-none focus:border-red-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRequestTimeout()}
                        disabled={savingTimeout || !editTimeoutMin}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {savingTimeout ? 'Inahifadhi...' : 'HIFADHI TIMEOUT'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 7: CENTRAL WHATSAPP & SUPPORT SETTINGS */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                        CENTRAL WHATSAPP & SUPPORT SETTING
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        Namba kuu ya mfumo inayotumiwa na Customer Support, Payment Desk na links zote za WhatsApp
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Cloud SQL Authoritative
                    </span>
                  </div>

                  <form onSubmit={handleSaveWhatsappNumber} className="space-y-3 text-xs">
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                      <label className="font-bold text-neutral-800 block">
                        Namba Kuu ya WhatsApp (Support & Payment WhatsApp):
                      </label>
                      <p className="text-[11px] text-neutral-500">
                        Ukibadilisha namba hii, sehemu zote za RAVINI (Huduma kwa Wateja, M-PESA/Airtel/Mixx maelekezo, na links zote) zitatumia namba mpya mara moja bila kuhitaji kutengeneza APK mpya.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={editWhatsappNum}
                          onChange={e => setEditWhatsappNum(e.target.value)}
                          placeholder="255XXXXXXXXX au 07XXXXXXXX"
                          className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono font-bold text-neutral-900 focus:outline-none focus:border-red-600"
                        />
                        <button
                          type="submit"
                          disabled={savingWhatsappNum || !editWhatsappNum.trim()}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {savingWhatsappNum ? 'Inahifadhi...' : 'HIFADHI NAMBA'}
                        </button>
                      </div>
                      <div className="text-[10px] text-neutral-400 pt-1">
                        Imehifadhiwa sasa kwenye Cloud SQL: <span className="font-mono font-bold text-neutral-800">{settings?.whatsappNumber || '255748604483'}</span> (Mabadiliko yanarekodiwa kwenye Audit Log).
                      </div>
                    </div>
                  </form>
                </div>

                {/* Section: EXTERNAL ANDROID PUSH NOTIFICATIONS GATEWAY */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-red-600" />
                      <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                        EXTERNAL PUSH NOTIFICATIONS GATEWAY
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      fcmStatus?.authenticated ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                    }`}>
                      {fcmStatus?.authenticated ? '🟢 FCM Authenticated' : '🟡 Inahitaji Service Account Key'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase">FCM Project</div>
                      <div className="font-mono font-extrabold text-neutral-900 truncate">
                        {fcmStatus?.projectId || 'genuine-purpose-m07pf'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase">Vifaa vya Android</div>
                      <div className="font-mono font-extrabold text-red-600">
                        {fcmStatus?.fcmSubscriptions ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 col-span-2 sm:col-span-1">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase">Jumla ya Vifaa</div>
                      <div className="font-mono font-extrabold text-neutral-900">
                        {fcmStatus?.totalSubscriptions ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Test Push */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                    <p className="text-[11px] text-neutral-500">
                      Pima utumaji wa arifa nje ya app kwenye simu yako:
                    </p>
                    <button
                      type="button"
                      onClick={handleTestPushNotification}
                      disabled={testingPush}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {testingPush ? 'Inatuma...' : '🔔 TUMA JARIBIO LA ARIFA'}
                    </button>
                  </div>

                  {/* Service Account JSON Configuration Form */}
                  <form onSubmit={handleSaveFcmJson} className="pt-2 border-t border-neutral-100 space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-800 block">
                        Sanidi / Sasisha Firebase Service Account JSON:
                      </label>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Ili kuruhusu seva kutuma arifa moja kwa moja kwenye simu za wateja hata app ikiwa imefungwa, bandika maudhui ya faili la <strong>serviceAccountKey.json</strong> kutoka Firebase Console hapa chini:
                      </p>
                    </div>
                    <textarea
                      value={fcmJsonInput}
                      onChange={e => setFcmJsonInput(e.target.value)}
                      placeholder='Bandika JSON hapa: {"type": "service_account", "project_id": "...", "private_key": "-----BEGIN PRIVATE KEY...", ...}'
                      rows={3}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-[11px] text-neutral-900 focus:outline-none focus:border-red-600 resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-400">
                        {fcmStatus?.clientEmail ? `Imeunganishwa na: ${fcmStatus.clientEmail}` : 'Inasubiri kuwekwa kwa mara ya kwanza'}
                      </span>
                      <button
                        type="submit"
                        disabled={savingFcm || !fcmJsonInput.trim()}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {savingFcm ? 'Inathibitisha...' : 'HIFADHI SERVICE ACCOUNT'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 8: FILES */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    FILES
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setProfileView('files')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>File Management, Access & History</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section 9: REPORTS, AUDIT LOGS & SECURITY */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    REPORTS, AUDIT LOGS & SECURITY
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={async () => {
                        const rRes = await NmyApiClient.getSuperAdminReports();
                        if (rRes.success) setProfileView('reports');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Reports (Ripoti za Maombi na Mapato)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const aRes = await NmyApiClient.getSuperAdminAuditLogs();
                        if (aRes.success && aRes.logs) setAuditLogs(aRes.logs);
                        setProfileView('audit_logs');
                      }}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Audit Logs (Kumbukumbu za Mfumo)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section 10: TOKA (LOGOUT) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-red-50 text-red-600 font-black text-xs rounded-2xl border border-neutral-200/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.2px]" />
                    <span>TOKA KWENYE AKAUNTI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-view: SECURITY MANAGEMENT */}
            {profileView === 'security_management' && (
              <SecurityManagement
                currentUser={user}
                onBack={() => setProfileView('settings')}
                onShowToast={(t) => setToast({ type: t.type === 'info' ? 'success' : t.type, text: t.text })}
              />
            )}

            {/* Sub-view: WATEJA (Customers List & Credit Visibility) */}
            {profileView === 'wateja' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                {/* Summary Banner for Customers & Credits */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-neutral-900 uppercase">
                        Wateja & Salio la Credit ({filteredCustomers.length})
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Taarifa halisi kutoka kwenye Production Database
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileView('customer_credits')}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <span>Mchanganuo Kamili</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase block">Jumla Wateja</span>
                      <strong className="text-base font-black text-neutral-900 mt-0.5 block">{filteredCustomers.length}</strong>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[9px] font-bold text-emerald-700 uppercase block">Wenye Salio</span>
                      <strong className="text-base font-black text-emerald-800 mt-0.5 block">
                        {filteredCustomers.filter(c => (c.creditBalanceTzs || 0) > 0).length}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[9px] font-bold text-amber-700 uppercase block">Jumla Salio</span>
                      <strong className="text-sm font-black text-amber-900 mt-0.5 block">
                        TSh {filteredCustomers.reduce((acc, c) => acc + (c.creditBalanceTzs || 0), 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Tafuta mteja kwa jina au namba ya simu..."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white"
                  />

                  {/* Customer Grouping Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    {[
                      { key: 'ALL', label: 'Wateja Wote', count: allCustomers.length },
                      {
                        key: 'ACTIVE_WITH_CREDIT',
                        label: 'Active - Wenye Credit',
                        count: allCustomers.filter(c => c.status === 'ACTIVE' && (c.creditBalanceTzs || 0) > 0).length
                      },
                      {
                        key: 'ACTIVE_NO_CREDIT',
                        label: 'Active - Hawana Credit',
                        count: allCustomers.filter(c => c.status === 'ACTIVE' && (c.creditBalanceTzs || 0) <= 0).length
                      },
                      {
                        key: 'INACTIVE_WITH_CREDIT',
                        label: 'Inactive - Wenye Credit',
                        count: allCustomers.filter(c => c.status !== 'ACTIVE' && c.status !== 'DELETED' && c.status !== 'MARKED_FOR_DELETION' && (c.creditBalanceTzs || 0) > 0).length
                      },
                      {
                        key: 'INACTIVE_NO_CREDIT',
                        label: 'Inactive - Hawana Credit',
                        count: allCustomers.filter(c => c.status !== 'ACTIVE' && c.status !== 'DELETED' && c.status !== 'MARKED_FOR_DELETION' && (c.creditBalanceTzs || 0) <= 0).length
                      },
                      {
                        key: 'DELETED_OR_MARKED',
                        label: 'Deleted / Marked for Deletion',
                        count: allCustomers.filter(c => c.status === 'DELETED' || c.status === 'MARKED_FOR_DELETION').length
                      }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setCustomerCategoryFilter(tab.key as any)}
                        className={`px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          customerCategoryFilter === tab.key
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          customerCategoryFilter === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="py-10 text-center text-neutral-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold uppercase tracking-wider">HAKUNA WATEJA BADO</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Wateja halisi watakaojisajili wataonekana hapa.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {filteredCustomers.map(cust => (
                        <div
                          key={cust.id}
                          className="p-4 bg-neutral-50 hover:bg-neutral-100/60 rounded-2xl border border-neutral-200 space-y-3 text-xs transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-neutral-900 text-sm block">{cust.fullName}</span>
                              <span className="font-mono text-neutral-600 text-xs mt-0.5 block">{cust.phone}</span>
                              <span className="text-[10px] text-neutral-400">
                                Amejiunga: {cust.createdAt ? formatDateTimeSeconds(cust.createdAt) : 'Leo'}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                cust.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {cust.status}
                            </span>
                          </div>

                          {/* Financial Details Grid */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-neutral-200/80">
                            <div>
                              <span className="text-[9px] font-bold text-neutral-400 uppercase block">Salio la Sasa</span>
                              <strong className="text-sm font-black text-neutral-900">
                                TSh {(cust.creditBalanceTzs || 0).toLocaleString()}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-neutral-400 uppercase block">Credit Iliyoongezwa</span>
                              <span className="text-xs font-bold text-emerald-700">
                                +TSh {(cust.totalCreditAdded || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {cust.lastTransaction && (
                            <div className="text-[10px] text-neutral-500 bg-neutral-100 p-2 rounded-lg flex items-center justify-between">
                              <span>Muamala wa Mwisho:</span>
                              <span className="font-medium text-neutral-700">
                                {cust.lastTransaction.type === 'ADD' ? '+' : '-'}TSh {cust.lastTransaction.amount?.toLocaleString()} • {formatDateTimeSeconds(cust.lastTransaction.timestamp)}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-200/60">
                            <button
                              type="button"
                              onClick={async () => {
                                const isCurrentlyActive = cust.status === 'ACTIVE';
                                const targetStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
                                const actionLabel = isCurrentlyActive ? 'Kufunga (Lock/Suspend)' : 'Kufungua (Unlock/Activate)';
                                if (confirm(`Una uhakika unataka ${actionLabel} akaunti ya ${cust.fullName}? Salio na data zote zitahifadhiwa.`)) {
                                  try {
                                    const res = await NmyApiClient.updateUserStatus(cust.id, targetStatus);
                                    if (res.success) {
                                      setToast({ type: 'success', text: `Akaunti ya ${cust.fullName} sasa ni ${targetStatus === 'ACTIVE' ? 'WAZI (ACTIVE)' : 'IMEFUNGWA (SUSPENDED)'}.` });
                                      loadAllData();
                                    } else {
                                      setToast({ type: 'error', text: res.message || 'Hitilafu ya kubadili hali ya akaunti.' });
                                    }
                                  } catch {
                                    setToast({ type: 'error', text: 'Hitilafu ya mtandao.' });
                                  }
                                }
                              }}
                              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                                cust.status === 'ACTIVE'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {cust.status === 'ACTIVE' ? '🔒 Funga Akaunti' : '🔓 Fungua Akaunti'}
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Una uhakika unataka kuweka upya nenosiri la ${cust.fullName} kuwa 1234? Mtumiaji atalazimika kulibadilisha akiingia.`)) {
                                  try {
                                    const res = await NmyApiClient.resetUserPassword(cust.id, '1234');
                                    if (res.success) {
                                      setToast({ type: 'success', text: `Neno la siri la ${cust.fullName} limewekwa upya kuwa 1234.` });
                                    } else {
                                      setToast({ type: 'error', text: res.message || 'Hitilafu ya kuweka upya neno la siri.' });
                                    }
                                  } catch {
                                    setToast({ type: 'error', text: 'Hitilafu ya mtandao.' });
                                  }
                                }
                              }}
                              className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              🔑 Weka Nenosiri 1234
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`ONYO LA SUPER ADMIN: Una uhakika unataka KUFUTA KABISA akaunti ya ${cust.fullName} (${cust.phone})? Hatua hii itafuta uwezo wake wa kuingia na kurekodiwa kwenye Audit Log.`)) {
                                  try {
                                    const res = await NmyApiClient.deleteUserAccount(cust.id);
                                    if (res.success) {
                                      setToast({ type: 'success', text: `Akaunti ya ${cust.fullName} imefutwa kikamilifu.` });
                                      loadAllData();
                                    } else {
                                      setToast({ type: 'error', text: res.message || 'Hitilafu ya kufuta akaunti.' });
                                    }
                                  } catch {
                                    setToast({ type: 'error', text: 'Hitilafu ya mtandao.' });
                                  }
                                }
                              }}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              🗑️ Futa Akaunti
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setTargetCustomerId(cust.id);
                                setProfileView('manual_credit');
                              }}
                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Rekebisha Salio
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: CUSTOMER CREDITS (Mchanganuo Kamili wa Salio) */}
            {profileView === 'customer_credits' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-black text-neutral-900 uppercase">
                      Mchanganuo wa Salio la Wateja
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Ukaguzi wa kina wa fedha na historia ya Credit kwa kila mteja
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Jumla ya Salio Lililopo</span>
                      <strong className="text-lg font-black text-neutral-900 mt-1 block">
                        TSh {(customerCreditsSummary?.totalOutstandingCreditTzs || stats.totalCustomerBalances || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Jumla Iliyowekwa</span>
                      <strong className="text-lg font-black text-emerald-800 mt-1 block">
                        TSh {(customerCreditsSummary?.totalCreditAddedEverTzs || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">Jumla Iliyotumika</span>
                      <strong className="text-lg font-black text-blue-800 mt-1 block">
                        TSh {(customerCreditsSummary?.totalCreditChargedEverTzs || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
                      <span className="text-[10px] font-bold text-red-800 uppercase block">Jumla Iliyorejeshwa</span>
                      <strong className="text-lg font-black text-red-800 mt-1 block">
                        TSh {(customerCreditsSummary?.totalRefundedEverTzs || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Customers breakdown list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                      Orodha ya Wateja ({customerCreditsList.length || filteredCustomers.length})
                    </h4>

                    {(customerCreditsList.length > 0 ? customerCreditsList : filteredCustomers).map(c => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-neutral-900 block">{c.fullName}</span>
                            <span className="font-mono text-neutral-500 text-[11px]">{c.phone}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 uppercase block">Salio la Sasa</span>
                            <strong className="text-sm font-black text-neutral-900">
                              TSh {(c.currentBalanceTzs ?? c.creditBalanceTzs ?? 0).toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px] p-2 bg-white rounded-xl border border-neutral-200/60 text-center">
                          <div>
                            <span className="text-neutral-400 block">Iliyoongezwa</span>
                            <span className="font-bold text-emerald-700">TSh {(c.totalAddedTzs ?? c.totalCreditAdded ?? 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">Iliyotumika</span>
                            <span className="font-bold text-neutral-800">TSh {(c.totalChargedTzs ?? c.totalCreditCharged ?? 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block">Iliyorejeshwa</span>
                            <span className="font-bold text-red-600">TSh {(c.totalRefundedTzs ?? c.totalRefunded ?? 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-neutral-400 font-mono">ID: {c.id}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetCustomerId(c.id);
                              setProfileView('manual_credit');
                            }}
                            className="px-2.5 py-1 bg-neutral-900 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-neutral-800"
                          >
                            Badilisha Salio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: ADMINS (Admins List & Management) */}
            {profileView === 'admins' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                {/* Create Admin Form with Multiple Choice Role Selection */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900 uppercase">
                      Sajili Msimamizi Mpya
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Chagua aina ya msimamizi kisha jaza taarifa za akaunti
                    </p>
                  </div>

                  {/* Multiple Choice List View */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Sajili:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminRegRole('ADMIN')}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          adminRegRole === 'ADMIN'
                            ? 'bg-red-50/50 border-red-500 shadow-xs ring-1 ring-red-500'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            adminRegRole === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            ADM
                          </div>
                          <div>
                            <span className="font-extrabold text-neutral-900 text-xs block">
                              Admin
                            </span>
                            <span className="text-[10px] text-neutral-500 block">
                              Utekelezaji wa maombi
                            </span>
                          </div>
                        </div>
                        {adminRegRole === 'ADMIN' && (
                          <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3px]" />
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminRegRole('SUPER_ADMIN_OPERATIONS')}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          adminRegRole === 'SUPER_ADMIN_OPERATIONS'
                            ? 'bg-amber-50/50 border-amber-500 shadow-xs ring-1 ring-amber-500'
                            : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            adminRegRole === 'SUPER_ADMIN_OPERATIONS' ? 'bg-amber-600 text-white' : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            OPS
                          </div>
                          <div>
                            <span className="font-extrabold text-neutral-900 text-xs block">
                              Super Admin Operations
                            </span>
                            <span className="text-[10px] text-neutral-500 block">
                              Shughuli & Credit za wateja
                            </span>
                          </div>
                        </div>
                        {adminRegRole === 'SUPER_ADMIN_OPERATIONS' && (
                          <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs pt-1 border-t border-neutral-150">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Jina Kamili</label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={e => setNewAdminName(e.target.value)}
                        placeholder={adminRegRole === 'SUPER_ADMIN_OPERATIONS' ? 'Mfano: Juma Baraka (Operations)' : 'Mfano: Daudi John (Admin)'}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Namba ya Simu</label>
                      <input
                        type="tel"
                        value={newAdminPhone}
                        onChange={e => setNewAdminPhone(e.target.value)}
                        placeholder="07XXXXXXXX au 2557XXXXXXXX"
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={e => setNewAdminPassword(e.target.value)}
                        placeholder="Weka password ya kuingia"
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingAdmin}
                      className={`w-full py-2.5 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                        adminRegRole === 'SUPER_ADMIN_OPERATIONS'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-neutral-900 hover:bg-neutral-800'
                      }`}
                    >
                      {creatingAdmin
                        ? 'Inaunda...'
                        : adminRegRole === 'SUPER_ADMIN_OPERATIONS'
                          ? 'UNDA SUPER ADMIN OPERATIONS'
                          : 'UNDA ADMIN'}
                    </button>
                  </form>
                </div>

                {/* Admins List */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-neutral-900 uppercase">
                      Wasimamizi na Operations ({adminList.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setProfileView('admin_work_history')}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <span>Historia ya Kazi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {adminList.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-4">Bado hakuna msimamizi aliyesajiliwa.</p>
                  ) : (
                    <div className="space-y-3">
                      {adminList.map(adm => {
                        const isOps = adm.role === 'SUPER_ADMIN_OPERATIONS';
                        const isMarked = adm.status === 'MARKED_FOR_DELETION' || !!adm.markedForDeletionAt;
                        return (
                          <div key={adm.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-2.5">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-neutral-900 text-sm">{adm.fullName}</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                      isOps
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                                    }`}
                                  >
                                    {isOps ? 'SUPER ADMIN OPERATIONS' : 'ADMIN'}
                                  </span>
                                </div>
                                <span className="font-mono text-neutral-500 text-xs block mt-0.5">{adm.phone}</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  adm.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isMarked
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {isMarked ? 'FUTWA (SIKU 7)' : adm.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded-xl border border-neutral-200/60">
                              <div>
                                <span className="text-[9px] text-neutral-400 uppercase font-bold block">Salio la Kazi</span>
                                <strong className="text-xs font-black text-neutral-900">
                                  TSh {(adm.workBalanceTzs || 0).toLocaleString()}
                                </strong>
                              </div>
                              <div>
                                <span className="text-[9px] text-neutral-400 uppercase font-bold block">Kazi Zilizokamilika</span>
                                <strong className="text-xs font-black text-emerald-700">
                                  {adm.workMetrics?.completedCount || 0}
                                </strong>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenAdminPay(adm)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>LIPA SALIO LA KAZI</span>
                              </button>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Una uhakika unataka kuweka upya nenosiri la ${adm.fullName} kuwa 1234? Mtumiaji atalazimika kulibadilisha akiingia.`)) {
                                      try {
                                        const res = await NmyApiClient.resetUserPassword(adm.id, '1234');
                                        if (res.success) {
                                          setToast({ type: 'success', text: `Neno la siri la ${adm.fullName} limewekwa upya kuwa 1234.` });
                                        } else {
                                          setToast({ type: 'error', text: res.message || 'Hitilafu ya kuweka upya neno la siri.' });
                                        }
                                      } catch {
                                        setToast({ type: 'error', text: 'Hitilafu ya mtandao.' });
                                      }
                                    }
                                  }}
                                  className="text-[11px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                                >
                                  Weka Nenosiri 1234
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const newStatus = adm.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
                                    try {
                                      const res = await NmyApiClient.updateUserStatus(adm.id, newStatus);
                                      if (res.success) {
                                        setToast({ type: 'success', text: `Hali ya ${adm.fullName} imebadilishwa kuwa ${newStatus}.` });
                                        loadAllData();
                                      }
                                    } catch {
                                      setToast({ type: 'error', text: 'Hitilafu ya kubadili hali ya mtumiaji.' });
                                    }
                                  }}
                                  className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
                                >
                                  {adm.status === 'ACTIVE' ? 'Sitisha Akaunti' : 'Wezesha Akaunti'}
                                </button>

                                {isMarked ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await NmyApiClient.restoreUserFromDeletion(adm.id);
                                        if (res.success) {
                                          setToast({ type: 'success', text: `Akaunti ya ${adm.fullName} imerejeshwa!` });
                                          loadAllData();
                                        }
                                      } catch {
                                        setToast({ type: 'error', text: 'Hitilafu ya kurejesha akaunti.' });
                                      }
                                    }}
                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 underline cursor-pointer"
                                  >
                                    Rejesha Akaunti
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm(`Una uhakika unataka kufuta akaunti ya ${adm.fullName}? Akaunti itapewa siku 7 za kusubiri (grace period).`)) {
                                        try {
                                          const res = await NmyApiClient.markUserForDeletion(adm.id, 'Uamuzi wa Super Admin');
                                          if (res.success) {
                                            setToast({ type: 'success', text: `Akaunti ya ${adm.fullName} imewekwa kwenye kipindi cha siku 7 za kufutwa.` });
                                            loadAllData();
                                          }
                                        } catch {
                                          setToast({ type: 'error', text: 'Hitilafu ya kufuta akaunti.' });
                                        }
                                      }
                                    }}
                                    className="text-[11px] font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
                                  >
                                    Futa Akaunti
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAdminWork(adm);
                                    setProfileView('admin_work_history');
                                  }}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  Tazama Kazi
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: HISTORIA YA KAZI YA WATU WOTE (All Admins Work History) */}
            {profileView === 'admin_work_history' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-neutral-900 uppercase">
                          Historia ya Kazi ya Watu Wote
                        </h3>
                        <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black rounded-sm">
                          LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Rekodi kamili ya maombi yaliyochukuliwa, usindikaji na mapato
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingWorkHist(true);
                        try {
                          const res = await NmyApiClient.getSuperAdminWorkHistoryAdmins();
                          if (res.success && res.admins) {
                            setAdminWorkHistoryList(res.admins);
                            setAdminWorkSummary(res.summary);
                          }
                        } finally {
                          setLoadingWorkHist(false);
                        }
                      }}
                      className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl"
                      title="Pakia Upya"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingWorkHist ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <span className="text-[9px] font-bold text-neutral-500 uppercase block">Watendaji</span>
                      <strong className="text-base font-black text-neutral-900 mt-0.5 block">
                        {adminWorkSummary?.totalAdminsTracked || adminWorkHistoryList.length || 1}
                      </strong>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[9px] font-bold text-emerald-800 uppercase block">Zilizokamilika</span>
                      <strong className="text-base font-black text-emerald-800 mt-0.5 block">
                        {adminWorkSummary?.totalJobsCompletedAcrossAll || stats.approvedRequests || 0}
                      </strong>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                      <span className="text-[9px] font-bold text-amber-800 uppercase block">Jumla Mapato</span>
                      <strong className="text-xs font-black text-amber-900 mt-0.5 block">
                        TSh {(adminWorkSummary?.totalWorkEarningsAllTzs || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Admin Work Cards */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                      Ripoti ya Kazi kwa Kila Mtendaji
                    </h4>

                    {adminWorkHistoryList.length === 0 ? (
                      <div className="py-8 text-center text-neutral-400">
                        <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-bold uppercase">Hakuna Rekodi ya Kazi Bado</p>
                      </div>
                    ) : (
                      adminWorkHistoryList.map(worker => (
                        <div
                          key={worker.id}
                          className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-neutral-900 text-sm">{worker.fullName}</span>
                                <span className="px-1.5 py-0.2 bg-neutral-900 text-white text-[9px] font-black rounded-sm uppercase">
                                  {worker.role}
                                </span>
                              </div>
                              <span className="font-mono text-neutral-500 text-xs block mt-0.5">{worker.phone}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                worker.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                              }`}
                            >
                              {worker.status}
                            </span>
                          </div>

                          {/* Work Earnings & Metrics */}
                          <div className="grid grid-cols-4 gap-1.5 p-2 bg-white rounded-xl border border-neutral-200/80 text-center">
                            <div>
                              <span className="text-[9px] text-neutral-400 block font-bold">Zilizochukuliwa</span>
                              <strong className="text-xs font-black text-neutral-900">{worker.metrics?.totalClaimed || 0}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-emerald-600 block font-bold">Kamilifu</span>
                              <strong className="text-xs font-black text-emerald-700">{worker.metrics?.completedCount || 0}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-blue-600 block font-bold">Inafanywa</span>
                              <strong className="text-xs font-black text-blue-700">{worker.metrics?.processingCount || 0}</strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-red-600 block font-bold">Kataliwa</span>
                              <strong className="text-xs font-black text-red-700">{worker.metrics?.rejectedCount || 0}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-neutral-100/70 rounded-xl">
                            <div>
                              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Salio la Kazi Sasa</span>
                              <strong className="text-sm font-black text-neutral-900">
                                TSh {(worker.workBalanceTzs || 0).toLocaleString()}
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-neutral-500 uppercase font-bold block">Jumla ya Mapato</span>
                              <strong className="text-sm font-black text-amber-800">
                                TSh {(worker.totalWorkEarningsTzs || 0).toLocaleString()}
                              </strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenAdminPay(worker)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>LIPA SALIO LA KAZI (PAY WORK ACCOUNT)</span>
                          </button>

                          {/* Recent Jobs list for this worker */}
                          {worker.jobs && worker.jobs.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-neutral-200/80">
                              <span className="text-[10px] font-black uppercase text-neutral-500 block">
                                Kazi za Hivi Karibuni ({worker.jobs.length})
                              </span>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {worker.jobs.map((job: any) => (
                                  <div
                                    key={job.id}
                                    className="p-2 bg-white rounded-lg border border-neutral-200/60 text-[11px] space-y-1"
                                  >
                                    <div className="flex items-center justify-between font-mono">
                                      <span className="font-bold text-neutral-900">{job.targetPhoneNumber}</span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                          job.status === 'APPROVED'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : job.status === 'PROCESSING'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {job.status}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-neutral-500 space-y-0.5 pt-0.5">
                                      <div className="flex items-center justify-between">
                                        <span>Ombi:</span>
                                        <span className="font-mono text-neutral-700">{job.createdAt ? formatDateTimeSeconds(job.createdAt) : '-'}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-emerald-800">
                                        <span>Response:</span>
                                        <span className="font-mono font-bold">{formatDateTimeSeconds(job.completedAt || job.updatedAt)}</span>
                                      </div>
                                    </div>
                                    {job.nidaResult && (
                                      <p className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        NIDA: {job.nidaResult}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: CREDIT REQUESTS */}
            {profileView === 'credit_requests' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-neutral-900 uppercase">
                    Maombi ya Malipo ya Credit ({creditRequests.length})
                  </h3>
                  {creditRequests.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">Hakuna maombi ya Credit yanayosubiri.</p>
                  ) : (
                    <div className="space-y-3">
                      {creditRequests.map(cr => (
                        <div key={cr.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900">{cr.customerName}</span>
                            <strong className="text-emerald-700 text-sm font-black">+TSh {cr.amountTzs.toLocaleString()}</strong>
                          </div>
                          <p className="text-neutral-500 font-mono text-[11px]">Ref: {cr.paymentReference}</p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleReviewCreditRequest(cr.id, 'APPROVED')}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                            >
                              THIBITISHA
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectPaymentTarget(cr);
                                setRejectPaymentReason('');
                              }}
                              className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg cursor-pointer"
                            >
                              KATAA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: MANUAL CREDIT ADJUSTMENT */}
            {profileView === 'manual_credit' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900 uppercase">
                      ONGEZA / REKEBISHA CREDIT YA MTEJA
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Tafuta mteja halisi aliyesajiliwa kwenye mfumo kwa namba yake ya simu (07..., 255..., au +255...).
                    </p>
                  </div>

                  {/* STEP 1: FIND CUSTOMER BY PHONE NUMBER */}
                  <form onSubmit={handleSearchCustomerByPhone} className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-700">
                      Namba ya Simu ya Mteja (Customer Phone Number)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customerSearchPhone}
                        onChange={e => {
                          setCustomerSearchPhone(e.target.value);
                          setLookupError(null);
                        }}
                        placeholder="07XXXXXXXX au 2557XXXXXXXX"
                        className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-red-600 focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={searchingCustomer || !customerSearchPhone.trim()}
                        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {searchingCustomer ? 'Inatafuta...' : 'TAFUTA MTEJA'}
                      </button>
                    </div>
                  </form>

                  {lookupError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{lookupError}</span>
                    </div>
                  )}

                  {/* STEP 2: SHOW FOUND CUSTOMER CARD & ADJUSTMENT FORM */}
                  {lookedUpCustomer && (
                    <div className="p-4 bg-neutral-50 border-2 border-emerald-500/40 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Mteja Aliyepatikana
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 font-mono">
                          ID: {lookedUpCustomer.id}
                        </span>
                      </div>

                      {/* Required display: Name, Phone, Current Credit Balance */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-white rounded-xl border border-neutral-200/80">
                          <span className="text-[10px] text-neutral-400 font-bold block uppercase">Jina la Mteja</span>
                          <strong className="text-xs font-black text-neutral-900 truncate block">
                            {lookedUpCustomer.fullName}
                          </strong>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-neutral-200/80">
                          <span className="text-[10px] text-neutral-400 font-bold block uppercase">Namba ya Simu</span>
                          <strong className="text-xs font-mono font-black text-neutral-900 block">
                            {lookedUpCustomer.phone}
                          </strong>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-neutral-200/80">
                          <span className="text-[10px] text-neutral-400 font-bold block uppercase">Salio la Credit Sasa</span>
                          <strong className="text-xs font-black text-emerald-700 block">
                            TSh {(lookedUpCustomer.currentBalanceTzs || 0).toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      {/* Direction, Amount, Reason */}
                      <form onSubmit={handleManualCredit} className="space-y-3 text-xs pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setManualDirection('ADD')}
                            className={`py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                              manualDirection === 'ADD' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            + ONGEZA CREDIT
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualDirection('DEDUCT')}
                            className={`py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                              manualDirection === 'DEDUCT' ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            - PUNGUZA CREDIT
                          </button>
                        </div>

                        <div>
                          <label className="block font-bold text-neutral-700 mb-1">
                            Kiasi cha Credit (TSh) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={manualAmount}
                            onChange={e => setManualAmount(e.target.value)}
                            placeholder="Kiasi cha Credit"
                            className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl font-bold text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-neutral-700 mb-1">
                            Sababu ya Marekebisho *
                          </label>
                          <input
                            type="text"
                            value={manualReason}
                            onChange={e => setManualReason(e.target.value)}
                            placeholder="Mfano: Malipo ya WhatsApp yamethibitishwa"
                            className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl font-medium focus:outline-none focus:border-red-600"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={adjustingCredit || !manualAmount || !manualReason.trim()}
                          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {adjustingCredit ? 'Inasasisha kwenye Cloud SQL...' : 'THIBITISHA MAREKEBISHO YA CREDIT'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: SUPER ADMIN WORK ACCOUNT & WORK LEDGER */}
            {profileView === 'work_account' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Profile</span>
                </button>

                <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block">
                      SUPER ADMIN WORK ACCOUNT
                    </span>
                    <button
                      type="button"
                      disabled={resettingWorkBalance || workBalanceTzs === 0}
                      onClick={async () => {
                        if (!window.confirm('Je, una uhakika unataka kuweka salio la kazi la Super Admin kuwa TSh 0? Hatua hii itarekodiwa kwenye Work Ledger na Audit Log.')) {
                          return;
                        }
                        setResettingWorkBalance(true);
                        try {
                          const res = await NmyApiClient.resetSuperAdminWorkBalance();
                          if (res.success) {
                            setWorkBalanceTzs(0);
                            setToast({ type: 'success', text: res.message || 'Salio la kazi la Super Admin limewekwa kuwa TSh 0.' });
                            const accRes = await NmyApiClient.getAdminWorkAccount();
                            if (accRes.success) {
                              setWorkBalanceTzs(accRes.balanceTzs || 0);
                              setWorkLedger(accRes.ledger || []);
                            }
                          } else {
                            setToast({ type: 'error', text: res.message || 'Imeshindikana kuweka salio kuwa 0.' });
                          }
                        } catch {
                          setToast({ type: 'error', text: 'Hitilafu ya kuweka salio kuwa 0.' });
                        } finally {
                          setResettingWorkBalance(false);
                        }
                      }}
                      className="px-3 py-1 bg-white/10 hover:bg-red-600 disabled:opacity-40 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      {resettingWorkBalance ? 'Inaweka 0...' : 'WEKA SALIO KUWA 0'}
                    </button>
                  </div>
                  <div className="text-3xl font-black">TSh {workBalanceTzs.toLocaleString()}</div>
                  <p className="text-xs text-neutral-300">
                    Hiki ni salio rasmi la kazi zilizosindikwa na kuidhinishwa na Super Admin.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wide">
                    Historia ya Mapato ya Kazi (Work Ledger)
                  </h3>
                  {workLedger.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">Hakuna miamala ya kazi bado.</p>
                  ) : (
                    <div className="space-y-2">
                      {workLedger.map(l => (
                        <div key={l.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-neutral-800 block">{l.reason}</span>
                            <span className="text-[10px] text-neutral-400">{formatDateTimeSeconds(l.timestamp)}</span>
                          </div>
                          <strong className="text-emerald-600 font-bold">+TSh {l.amount.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: FILES */}
            {profileView === 'files' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Profile</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-black text-neutral-900 uppercase">
                      FILE MANAGEMENT & ACCESS
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Mafaili yote yanalindwa na mfumo wa uidhinishaji wa RAVINI. Hakuna URL za umma zisizo na ulinzi.
                  </p>
                  <div className="py-8 text-center text-neutral-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold uppercase">HAKUNA MAFAILI YALIYOHIFADHIWA BADO</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: TAARIFA ZA SUPER ADMIN */}
            {profileView === 'taarifa' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Profile</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-neutral-900 uppercase">
                    Taarifa za Super Admin
                  </h3>
                  <div className="divide-y divide-neutral-100 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-neutral-500">Jina:</span>
                      <strong className="text-neutral-900">{user.fullName}</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-neutral-500">Simu:</span>
                      <strong className="text-neutral-900 font-mono">{user.phone}</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-neutral-500">Role:</span>
                      <strong className="text-red-600 font-bold">{user.role}</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-neutral-500">Hali:</span>
                      <strong className="text-emerald-600 font-bold">{user.status}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: AUDIT LOGS */}
            {profileView === 'audit_logs' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-neutral-900 uppercase">
                    Audit Logs ({auditLogs.length})
                  </h3>
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">Hakuna audit logs bado.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {auditLogs.map(log => (
                        <div key={log.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900">{log.action}</span>
                            <span className="text-[10px] text-neutral-400">{formatDateTimeSeconds(log.timestamp)}</span>
                          </div>
                          <p className="text-neutral-600 text-[11px]">{log.details}</p>
                          <span className="text-[10px] text-neutral-400 font-mono">Actor: {log.actorName} ({log.actorRole})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: ANNOUNCEMENTS (TEXT ONLY) */}
            {profileView === 'announcements' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileView('settings')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Rudi Kwenye Settings</span>
                </button>

                {/* Form to create new text-only announcement */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-neutral-900 uppercase">
                        Matangazo ya Ndani ya Mfumo (Text Only)
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Matangazo yote ni ya maandishi/maelezo tu. Hakuna picha wala video.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Kichwa cha Tangazo (Title) *
                      </label>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={e => setAnnTitle(e.target.value)}
                        placeholder="Mfano: Matengenezo ya Mfumo Jumamosi Saa 4 Usiku"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-red-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        Maelezo ya Tangazo (Message) *
                      </label>
                      <textarea
                        value={annMessage}
                        onChange={e => setAnnMessage(e.target.value)}
                        placeholder="Andika ujumbe kamili wa tangazo unaotaka walengwa wauone..."
                        rows={3}
                        className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:border-red-600 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Walengwa (Target Audience) *
                        </label>
                        <select
                          value={annTarget}
                          onChange={e => setAnnTarget(e.target.value as any)}
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold focus:outline-none focus:border-red-600"
                        >
                          <option value="ALL">Watumiaji Wote (ALL)</option>
                          <option value="ALL_CUSTOMERS">Wateja Pekee (CUSTOMERS)</option>
                          <option value="ALL_ADMINS">Watendaji Pekee (ADMINS)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1">
                          Hali ya Tangazo (Status)
                        </label>
                        <button
                          type="button"
                          onClick={() => setAnnActiveState(!annActiveState)}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-between border transition-colors cursor-pointer ${
                            annActiveState
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-neutral-100 border-neutral-300 text-neutral-600'
                          }`}
                        >
                          <span>{annActiveState ? 'LINAONEKANA (ACTIVE)' : 'LIMEZIMWA (INACTIVE)'}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${annActiveState ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={postingAnn || !annTitle.trim() || !annMessage.trim()}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-4 h-4" />
                      <span>{postingAnn ? 'Inachapisha...' : 'CHAPISHA TANGAZO LA MAANDISHI'}</span>
                    </button>
                  </form>
                </div>

                {/* List of existing text announcements */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-neutral-900 uppercase">
                      Orodha ya Matangazo ({annList.length})
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">
                      Maandishi Pekee
                    </span>
                  </div>

                  {annList.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-400" />
                      <p className="text-xs">Hakuna matangazo yaliyochapishwa bado.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {annList.map(ann => (
                        <div
                          key={ann.id}
                          className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                            ann.isActive !== false
                              ? 'bg-neutral-50/80 border-neutral-200'
                              : 'bg-neutral-100/50 border-neutral-200/60 opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-xs font-black text-neutral-900 block">
                                {ann.title}
                              </strong>
                              <span className="text-[10px] text-neutral-400">
                                {ann.createdAt ? formatDateTimeSeconds(ann.createdAt) : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  ann.isActive !== false
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {ann.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-black uppercase">
                                {ann.targetType === 'ALL_CUSTOMERS' ? 'WATEJA' : ann.targetType === 'ALL_ADMINS' ? 'WATENDAJI' : 'WOTE'}
                              </span>
                            </div>
                          </div>

                          <p className="text-neutral-700 text-xs leading-relaxed whitespace-pre-wrap">
                            {ann.message}
                          </p>

                          {/* Action controls */}
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleToggleAnnStatus(ann)}
                              className={`font-bold hover:underline cursor-pointer ${
                                ann.isActive !== false ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              {ann.isActive !== false ? 'Zima (Weka Inactive)' : 'Washa (Weka Active)'}
                            </button>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleStartEditAnn(ann)}
                                className="font-bold text-neutral-700 hover:text-neutral-900 underline cursor-pointer"
                              >
                                Hariri (Edit)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                              >
                                Futa (Delete)
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: BACKUP & RECOVERY CENTER */}
            {profileView === 'backup_center' && (
              <BackupRecoveryCenter onBack={() => setProfileView('settings')} />
            )}

            {/* Sub-view: GLOBAL SEARCH & 360° */}
            {profileView === 'global_search' && (
              <GlobalSearchAnd360 onBack={() => setProfileView('settings')} />
            )}

            {/* Sub-view: REVENUE & REPORTS */}
            {profileView === 'revenue_history' && (
              <RevenueAndReportsCenter onBack={() => setProfileView('settings')} />
            )}
          </div>
        )}
      </main>

      {/* REJECT CREDIT PAYMENT MODAL */}
      {rejectPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-900 uppercase">
                Kataa Ombi la Malipo
              </h3>
              <button
                type="button"
                onClick={() => setRejectPaymentTarget(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Unakataa ombi la malipo ya <strong className="text-red-600">TSh {rejectPaymentTarget.amountTzs.toLocaleString()}</strong> kutoka kwa <strong>{rejectPaymentTarget.customerName}</strong> (Ref: {rejectPaymentTarget.paymentReference}).
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-700 block">
                Sababu ya Kukataa:
              </label>
              <textarea
                value={rejectPaymentReason}
                onChange={e => setRejectPaymentReason(e.target.value)}
                placeholder="Mfano: Pesa haijaonekana kwenye akaunti, namba ya muamala haipo sahihi..."
                rows={3}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs outline-none focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectPaymentTarget(null)}
                className="w-full py-2.5 bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl"
              >
                GHAIRI
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectPaymentReason.trim()) {
                    setToast({ type: 'error', text: 'Weka sababu ya kukataa malipo haya.' });
                    return;
                  }
                  handleReviewCreditRequest(rejectPaymentTarget.id, 'REJECTED', rejectPaymentReason.trim());
                  setRejectPaymentTarget(null);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                KATAA MALIPO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORK CLAIM MODAL: WEKA NIDA & KAMILISHA */}
      {activeReqToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-900 uppercase">
                Weka Namba ya NIDA
              </h3>
              <button onClick={() => setActiveReqToComplete(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Ingiza namba ya NIDA yenye <strong>tarakimu 20 haswa</strong> kwa ajili ya ombi:{' '}
              <strong className="font-mono text-neutral-900">{activeReqToComplete.id}</strong> ({activeReqToComplete.targetPhoneNumber}).
            </p>

            {completeErr && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{completeErr}</span>
              </div>
            )}

            <form onSubmit={handleCompleteRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Namba ya NIDA (Tarakimu 20)
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={nidaInput}
                  onChange={e => setNidaInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="19900101111010000123"
                  className="w-full px-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs font-black tracking-wider focus:outline-none focus:border-red-500 focus:bg-white"
                />
                <span className="text-[10px] text-neutral-400 block mt-1">
                  Tarakimu: {nidaInput.length}/20
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReqToComplete(null)}
                  className="w-full py-2.5 bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl"
                >
                  GHAIRI
                </button>
                <button
                  type="submit"
                  disabled={completing || nidaInput.length !== 20}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {completing ? 'Inakamilisha...' : 'KAMILISHA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT REQUEST MODAL */}
      {activeReqToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-900 uppercase">
                Kataa Ombi la NIDA
              </h3>
              <button onClick={() => setActiveReqToReject(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Kukataa ombi hili kutarejesha mara moja kiasi cha{' '}
              <strong className="text-red-600">TSh {activeReqToReject.chargedPriceTzs.toLocaleString()}</strong> kwenye akaunti ya mteja.
            </p>

            <form onSubmit={handleRejectRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Sababu ya Kukataa
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Mfano: Namba ya simu haijasajiliwa au taarifa hazijakamilika."
                  rows={3}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReqToReject(null)}
                  className="w-full py-2.5 bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  GHAIRI
                </button>
                <button
                  type="submit"
                  disabled={rejecting || !rejectReason.trim()}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {rejecting ? 'Inakataa...' : 'KATAA & REJESHA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN WORK ACCOUNT PAYMENT MODAL */}
      {adminToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 uppercase">
                    Malipo ya Kazi ya Admin
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Admin Work Account Payment (RAVINI Authoritative)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminToPay(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Admin Card */}
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Mtendaji (Admin)</span>
                  <strong className="text-sm font-black text-neutral-900">{adminToPay.fullName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Namba ya Simu</span>
                  <strong className="font-mono text-xs font-bold text-neutral-800">{adminToPay.phone}</strong>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">Salio la Kazi Lililopo</span>
                  <span className="text-xs text-neutral-500">Hela anayodai kwenye mfumo:</span>
                </div>
                <strong className="text-base font-black text-emerald-800">
                  TSh {(adminToPay.workBalanceTzs || 0).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminWorkPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-neutral-700">
                    Kiasi cha Kulipa (TSh) *
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAdminPayAmount(String(adminToPay.workBalanceTzs || 0))}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md cursor-pointer"
                    >
                      Lipa Yote (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminPayAmount(String(Math.floor((adminToPay.workBalanceTzs || 0) / 2)))}
                      className="text-[10px] font-bold text-neutral-700 bg-neutral-200 hover:bg-neutral-300 px-2 py-0.5 rounded-md cursor-pointer"
                    >
                      Lipa Nusu (50%)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max={adminToPay.workBalanceTzs || undefined}
                  value={adminPayAmount}
                  onChange={e => {
                    setAdminPayAmount(e.target.value);
                    setAdminPayError(null);
                  }}
                  placeholder="Kiasi cha kulipa"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl font-mono font-bold text-sm focus:outline-none focus:border-emerald-600"
                />
                {Number(adminPayAmount) > 0 && (
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Salio la kazi litakalobaki baada ya malipo haya:{' '}
                    <strong className="text-neutral-800">
                      TSh {Math.max(0, (adminToPay.workBalanceTzs || 0) - Number(adminPayAmount)).toLocaleString()}
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Sababu / Maelezo ya Malipo *
                </label>
                <input
                  type="text"
                  value={adminPayReason}
                  onChange={e => setAdminPayReason(e.target.value)}
                  placeholder="Mfano: Malipo ya kazi ya NIDA (Kupitia WhatsApp/M-Pesa)"
                  className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              {adminPayError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{adminPayError}</span>
                </div>
              )}

              {/* Step 1: Open WhatsApp to pay/notify */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <span className="text-[10px] uppercase font-black text-neutral-600 block">
                  Hatua ya 1: Mawasiliano ya Malipo (WhatsApp)
                </span>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  Fungua WhatsApp kutuma taarifa ya malipo kwa namba ya Admin ({adminToPay.phone}) yenye ujumbe ulioandaliwa tayari:
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdminWhatsapp}
                  className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>FUNGUA WHATSAPP NA UJUMBE WA MALIPO</span>
                </button>
              </div>

              {/* Step 2: Confirm Payment into PostgreSQL */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-black text-neutral-600 block">
                  Hatua ya 2: Uthibitisho Kwenye Mfumo (PostgreSQL Cloud SQL)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminToPay(null)}
                    className="py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    GHAIRI
                  </button>
                  <button
                    type="submit"
                    disabled={processingAdminPayment || !adminPayAmount || Number(adminPayAmount) <= 0 || Number(adminPayAmount) > (adminToPay.workBalanceTzs || 0)}
                    className="py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{processingAdminPayment ? 'Inathibitisha...' : 'THIBITISHA MALIPO'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-neutral-400 leading-tight text-center pt-1">
                * Kitendo hiki kinapunguza salio la Admin kwenye Cloud SQL PostgreSQL na kurekodi muamala kwenye leja ya ukaguzi (Audit Log).
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Universal 3-tab Bottom Navigation: HOME | HUDUMA | PROFILE */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={tab => {
          setActiveTab(tab);
          if (tab === 'profile') setProfileView('menu');
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />
    </div>
  );
};
