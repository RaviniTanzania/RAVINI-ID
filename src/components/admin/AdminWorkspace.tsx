import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { NmyUser, NmyRequest, NmySession } from '../../types/nmyTypes';
import { BottomNav, NavTab } from '../common/BottomNav';
import { LogoutModal } from '../common/LogoutModal';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { NotificationPermissionBanner } from '../common/NotificationPermissionBanner';
import { TextAnnouncementsList } from '../common/TextAnnouncementsList';
import {
  ShieldCheck,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Briefcase,
  ChevronRight,
  RefreshCw,
  Lock,
  Building2,
  KeyRound,
  FileText,
  LogOut,
  Smartphone,
  Eye,
  Check,
  X,
  CreditCard,
  PlusCircle,
  Search
} from 'lucide-react';
import { formatDateTimeSeconds, isDateInDarWindow } from '../../utils/dateUtils';

interface Props {
  user: NmyUser;
  onLogout: () => void;
  onUserUpdated: (user: NmyUser) => void;
}

export const AdminWorkspace: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [profileSection, setProfileSection] = useState<'menu' | 'taarifa' | 'settings' | 'files' | 'work_account' | 'department' | 'permissions' | 'sessions'>('menu');
  const [currentLang, setCurrentLang] = useState<'sw' | 'en'>('sw');

  // Admin Dashboard data
  const [workBalanceTzs, setWorkBalanceTzs] = useState<number>(0);
  const [workLedger, setWorkLedger] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<NmyRequest[]>([]);
  const [processingRequests, setProcessingRequests] = useState<NmyRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<NmyRequest[]>([]);
  const [myAllHandled, setMyAllHandled] = useState<NmyRequest[]>([]);
  const [timeWindowFilter, setTimeWindowFilter] = useState<'LEO' | 'WIKI' | 'MWEZI' | 'YOTE'>('YOTE');
  const [loading, setLoading] = useState(false);

  // Workflow modals & inputs
  const [activeRequestToComplete, setActiveRequestToComplete] = useState<NmyRequest | null>(null);
  const [nidaInput, setNidaInput] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [activeRequestToReject, setActiveRequestToReject] = useState<NmyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [workflowMessage, setWorkflowMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessions, setSessions] = useState<NmySession[]>([]);
  const [centralWhatsapp, setCentralWhatsapp] = useState('255748604483');

  // Sub-tabs in Huduma
  const [hudumaSubTab, setHudumaSubTab] = useState<'pending' | 'processing' | 'completed'>('pending');

  // Admin Credit Top-up State (Permitted Admins and Super Admin Operations)
  const canAddCredit = user.role === 'SUPER_ADMIN_OPERATIONS' || (Array.isArray(user.permissions) && (user.permissions.includes('CAN_ADD_CREDIT') || user.permissions.includes('MANAGE_CREDIT') || user.permissions.includes('ALL')));
  const [showAdminCreditModal, setShowAdminCreditModal] = useState(false);
  const [creditCustomerPhone, setCreditCustomerPhone] = useState('');
  const [creditAmount, setCreditAmount] = useState('1000');
  const [creditReason, setCreditReason] = useState('Malipo ya Ofisini');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  const handleSearchCustomerForCredit = async () => {
    if (!creditCustomerPhone.trim()) return;
    setSearchingCustomer(true);
    setCreditError(null);
    setFoundCustomer(null);
    try {
      const res = await NmyApiClient.lookupCustomerByPhone(creditCustomerPhone.trim());
      if (res.success && res.customer) {
        setFoundCustomer(res.customer);
      } else {
        setCreditError(res.message || 'Mteja hakupatikana kwa namba hii.');
      }
    } catch (e: any) {
      setCreditError(e.message || 'Hitilafu ya kumtafuta mteja.');
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleAdminSubmitCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundCustomer) {
      setCreditError('Tafadhali tafuta na uchague mteja kwanza.');
      return;
    }
    const amt = Number(creditAmount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setCreditError('Kiasi lazima kiwe namba halisi chanya.');
      return;
    }
    if (!creditReason.trim()) {
      setCreditError('Tafadhali weka sababu ya kuongeza Credit.');
      return;
    }
    setSubmittingCredit(true);
    setCreditError(null);
    try {
      const res = await NmyApiClient.adjustCustomerCredit({
        customerId: foundCustomer.id,
        amountTzs: amt,
        reason: creditReason.trim()
      });
      if (res.success) {
        setWorkflowMessage({
          type: 'success',
          text: `Credit ya TSh ${amt.toLocaleString()} imeongezwa kikamilifu kwa ${foundCustomer.fullName}. Salio jipya: TSh ${res.newBalance.toLocaleString()}.`
        });
        setShowAdminCreditModal(false);
        setFoundCustomer(null);
        setCreditCustomerPhone('');
        setCreditAmount('1000');
        setCreditReason('Malipo ya Ofisini');
      } else {
        setCreditError(res.message || 'Hitilafu ya kuongeza credit.');
      }
    } catch (e: any) {
      setCreditError(e.message || 'Hitilafu ya kuongeza credit.');
    } finally {
      setSubmittingCredit(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    const handleRealtime = (e: any) => {
      const type = e.detail?.type;
      if (type === 'NEW_REQUEST' || type === 'REQUEST_UPDATED' || type === 'ANNOUNCEMENT_CREATED') {
        loadAdminData();
      }
    };
    window.addEventListener('ravini_realtime_event', handleRealtime);
    return () => window.removeEventListener('ravini_realtime_event', handleRealtime);
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, workRes, configRes] = await Promise.all([
        NmyApiClient.getAdminDashboard(),
        NmyApiClient.getAdminWorkAccount(),
        NmyApiClient.getPublicConfig()
      ]);

      if (configRes.success && configRes.config?.whatsappNumber) {
        setCentralWhatsapp(configRes.config.whatsappNumber);
      }

      if (dashRes.success) {
        setPendingRequests(dashRes.pendingRequests || []);
        setProcessingRequests(dashRes.processingRequests || []);
        setCompletedRequests(dashRes.recentCompleted || []);
        setMyAllHandled(dashRes.myAllHandled || dashRes.recentCompleted || []);
        setWorkBalanceTzs(dashRes.workAccountBalance || 0);
      }

      if (workRes.success) {
        setWorkBalanceTzs(workRes.balanceTzs || 0);
        setWorkLedger(workRes.ledger || []);
      }
    } catch {
      console.error('Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (requestId: string) => {
    setWorkflowMessage(null);
    try {
      const res = await NmyApiClient.claimRequest(requestId);
      if (res.success) {
        setWorkflowMessage({ type: 'success', text: `Umechukua ombi ${requestId}. Sasa liko tayari kufanyiwa kazi!` });
        setHudumaSubTab('processing');
        loadAdminData();
      } else {
        setWorkflowMessage({ type: 'error', text: res.message || 'Hitilafu ya kuchukua ombi.' });
      }
    } catch {
      setWorkflowMessage({ type: 'error', text: 'Muunganisho wa mtandao unasumbua.' });
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestToComplete) return;
    setCompleteError(null);

    const clean = nidaInput.replace(/\D/g, '');
    if (!/^\d{20}$/.test(clean)) {
      setCompleteError('Namba ya NIDA lazima iwe na tarakimu 20 haswa.');
      return;
    }

    setCompleting(true);
    try {
      const res = await NmyApiClient.completeRequest(activeRequestToComplete.id, clean);
      if (res.success) {
        setWorkflowMessage({
          type: 'success',
          text: `Ombi ${activeRequestToComplete.id} limekamilika! Mapato ya TSh ${activeRequestToComplete.chargedPriceTzs.toLocaleString()} yameingizwa kwenye Salio lako la Kazi.`
        });
        setActiveRequestToComplete(null);
        setNidaInput('');
        loadAdminData();
      } else {
        setCompleteError(res.message || 'Hitilafu ya kukamilisha ombi.');
      }
    } catch {
      setCompleteError('Muunganisho wa mtandao unasumbua.');
    } finally {
      setCompleting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestToReject) return;
    setRejectError(null);

    if (!rejectReason.trim()) {
      setRejectError('Weka sababu halisi ya kukataa ombi.');
      return;
    }

    setRejecting(true);
    try {
      const res = await NmyApiClient.rejectRequest(activeRequestToReject.id, rejectReason.trim());
      if (res.success) {
        setWorkflowMessage({
          type: 'success',
          text: `Ombi ${activeRequestToReject.id} limekataliwa na mteja amerudishiwa Credit zake.`
        });
        setActiveRequestToReject(null);
        setRejectReason('');
        loadAdminData();
      } else {
        setRejectError(res.message || 'Hitilafu ya kukataa ombi.');
      }
    } catch {
      setRejectError('Muunganisho wa mtandao unasumbua.');
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    await NmyApiClient.logout();
    setLoggingOut(false);
    setShowLogoutModal(false);
    onLogout();
  };

  const windowHandled = myAllHandled.filter(r => isDateInDarWindow(r.updatedAt || r.createdAt, timeWindowFilter));
  const windowPending = pendingRequests.filter(r => isDateInDarWindow(r.createdAt, timeWindowFilter));
  const windowProcessing = processingRequests.filter(r => isDateInDarWindow(r.createdAt, timeWindowFilter));
  const windowCompleted = completedRequests.filter(r => isDateInDarWindow(r.updatedAt || r.createdAt, timeWindowFilter));

  const adminStats = {
    handled: windowHandled.length,
    received: windowPending.length + windowProcessing.length + windowCompleted.length,
    responsesSent: windowHandled.filter(r => r.status === 'APPROVED').length,
    pending: windowPending.length,
    completed: windowCompleted.length,
    cancelledOrExpired: windowHandled.filter(r => r.status === 'REJECTED' || r.status === 'EXPIRED').length
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-neutral-900 pb-20 font-sans selection:bg-red-100 selection:text-red-700">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
              <Briefcase className="w-4 h-4 stroke-[2.2px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black tracking-tight text-neutral-900 uppercase">
                  {user.role === 'SUPER_ADMIN_OPERATIONS' ? 'OPERATIONS WORKSPACE' : 'ADMIN WORKSPACE'}
                </h1>
                <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black rounded-sm">
                  {user.role === 'SUPER_ADMIN_OPERATIONS' ? 'SUPER ADMIN OPERATIONS' : 'ADMIN'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                RAVINI
              </p>
            </div>
          </div>

          {/* Admin Work Balance Badge */}
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setProfileSection('work_account'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-neutral-700" />
            <span>TSh {workBalanceTzs.toLocaleString()}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Real Push Notification Permission Guidance */}
        <NotificationPermissionBanner userRole="ADMIN" />

        {/* Text-Only Active System Announcements */}
        <TextAnnouncementsList />

        {/* Main Alert Banner */}
        {workflowMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs ${
              workflowMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <span>{workflowMessage.text}</span>
            <button onClick={() => setWorkflowMessage(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================= TAB 1: HOME ======================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Admin Overview Hero Card */}
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
              <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                Kitengo cha Usindikaji wa Maombi
              </span>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                Karibu Kazi, {user.fullName}!
              </h2>

              <div className="mt-4 pt-3.5 border-t border-neutral-700/80 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-neutral-400 font-medium">Salio Lako la Kazi (Work Account):</span>
                  <div className="text-2xl font-black tracking-tight mt-0.5 text-emerald-400">
                    TSh {workBalanceTzs.toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setActiveTab('profile'); setProfileSection('work_account'); }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Ona Ledger
                </button>
              </div>
            </div>

            {/* Takwimu Zangu (Admin Statistics Dashboard) */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Takwimu Zangu
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Saa na Tarehe ya Afrika/Dar es Salaam (DD/MM/YYYY HH:mm:ss)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAdminData}
                  className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Time Window Pills: LEO / WIKI / MWEZI / YOTE */}
              <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 rounded-2xl">
                {(['LEO', 'WIKI', 'MWEZI', 'YOTE'] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTimeWindowFilter(w)}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                      timeWindowFilter === w
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {w === 'LEO' ? 'Leo' : w === 'WIKI' ? 'Wiki Hii' : w === 'MWEZI' ? 'Mwezi Huu' : 'Yote'}
                  </button>
                ))}
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase block">Niliyoshughulikia</span>
                  <strong className="text-base font-black text-neutral-900 mt-0.5 block">{adminStats.handled}</strong>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-[9px] font-bold text-blue-700 uppercase block">Yaliyopokelewa</span>
                  <strong className="text-base font-black text-blue-800 mt-0.5 block">{adminStats.received}</strong>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block">Majibu Niliyotuma</span>
                  <strong className="text-base font-black text-emerald-800 mt-0.5 block">{adminStats.responsesSent}</strong>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[9px] font-bold text-amber-700 uppercase block">Inasubiri</span>
                  <strong className="text-base font-black text-amber-800 mt-0.5 block">{adminStats.pending}</strong>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block">Yaliyokamilika</span>
                  <strong className="text-base font-black text-emerald-800 mt-0.5 block">{adminStats.completed}</strong>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[9px] font-bold text-rose-700 uppercase block">Yaliyofutwa/Expired</span>
                  <strong className="text-base font-black text-rose-800 mt-0.5 block">{adminStats.cancelledOrExpired}</strong>
                </div>
              </div>
            </div>

            {/* Work Queue Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div
                onClick={() => { setActiveTab('huduma'); setHudumaSubTab('pending'); }}
                className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-red-400 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Inasubiri</span>
                <p className="text-xl font-black text-amber-600 mt-0.5">{pendingRequests.length}</p>
                <span className="text-[9px] text-neutral-400 font-semibold">Bofya kuchukua</span>
              </div>
              <div
                onClick={() => { setActiveTab('huduma'); setHudumaSubTab('processing'); }}
                className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-blue-400 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Ninazofanya</span>
                <p className="text-xl font-black text-blue-600 mt-0.5">{processingRequests.length}</p>
                <span className="text-[9px] text-neutral-400 font-semibold">Tayari kuweka NIDA</span>
              </div>
              <div
                onClick={() => { setActiveTab('huduma'); setHudumaSubTab('completed'); }}
                className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs cursor-pointer hover:border-emerald-400 transition-colors"
              >
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Nilizofanikisha</span>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{completedRequests.length}</p>
                <span className="text-[9px] text-neutral-400 font-semibold">Kazi zilizolipwa</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => { setActiveTab('huduma'); setHudumaSubTab('pending'); }}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>FUNGUA MAOMBI YA WATEJA (QUEUE)</span>
            </button>

            {/* Admin Credit Top-up Card (Enabled only if Admin has permission) */}
            {canAddCredit && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
                      <CreditCard className="w-5 h-5 stroke-[2.2px]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-emerald-950 uppercase tracking-tight">
                        Ruhusa ya Kuongeza Credit
                      </h3>
                      <p className="text-[11px] text-emerald-700">
                        Umeidhinishwa na Super Admin kuongeza salio la wateja
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 text-[10px] font-black rounded-md uppercase">
                    RUKHSA
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminCreditModal(true);
                    setFoundCustomer(null);
                    setCreditCustomerPhone('');
                    setCreditAmount('1000');
                    setCreditReason('Malipo ya Ofisini');
                    setCreditError(null);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>ONGEZA CREDIT KWA MTEJA</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: HUDUMA (MAOMBI YA WATEJA) ======================= */}
        {activeTab === 'huduma' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top Sub-tabs */}
            <div className="grid grid-cols-3 p-1 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setHudumaSubTab('pending')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  hudumaSubTab === 'pending'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Inasubiri ({pendingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setHudumaSubTab('processing')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  hudumaSubTab === 'processing'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Ninazofanya ({processingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setHudumaSubTab('completed')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  hudumaSubTab === 'completed'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Nilizomaliza ({completedRequests.length})
              </button>
            </div>

            {/* SUB-VIEW 1: PENDING QUEUE */}
            {hudumaSubTab === 'pending' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-bold text-neutral-700 uppercase tracking-wide">
                    Maombi Yanayosubiri Kuchukuliwa
                  </span>
                  <button onClick={loadAdminData} className="text-neutral-400 hover:text-neutral-700">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center text-neutral-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">Hakuna maombi yanayosubiri kwa sasa.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.map(req => (
                      <div
                        key={req.id}
                        className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-neutral-700">{req.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                            {req.status}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Mteja:</span>
                            <span className="font-bold text-neutral-900">{req.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Namba ya Simu:</span>
                            <span className="font-bold font-mono text-neutral-900">{req.targetPhoneNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Muda wa Kupokelewa:</span>
                            <span className="font-bold font-mono text-[11px] text-neutral-700">{formatDateTimeSeconds(req.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Gharama / Mapato:</span>
                            <span className="font-bold text-emerald-600">TSh {req.chargedPriceTzs.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleClaim(req.id)}
                            className="py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>CHUKUA OMBI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRequestToReject(req);
                              setRejectReason('');
                              setRejectError(null);
                            }}
                            className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>KATAA OMBI</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: PROCESSING (CLAIMED BY THIS ADMIN) */}
            {hudumaSubTab === 'processing' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-neutral-700 uppercase tracking-wide px-1">
                  Maombi Unayofanyia Kazi Sasa
                </div>

                {processingRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center text-neutral-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="text-xs font-medium">Huna ombi unalofanyia kazi kwa sasa.</p>
                    <button
                      type="button"
                      onClick={() => setHudumaSubTab('pending')}
                      className="mt-2 text-xs font-bold text-red-600 hover:underline"
                    >
                      Chukua ombi jipya kutoka kwenye Queue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {processingRequests.map(req => (
                      <div
                        key={req.id}
                        className="bg-white p-4 rounded-2xl border-2 border-blue-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-neutral-900">{req.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                            INASHUGHULIKIWA
                          </span>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Namba ya Simu:</span>
                            <span className="font-bold text-sm font-mono text-neutral-900">{req.targetPhoneNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Mteja:</span>
                            <span className="font-bold text-neutral-800">{req.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Muda wa Kupokelewa:</span>
                            <span className="text-neutral-700 font-mono text-[11px] font-bold">{formatDateTimeSeconds(req.createdAt)}</span>
                          </div>
                          {req.claimedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500">Kuanza Kushughulikiwa:</span>
                              <span className="text-blue-700 font-mono text-[11px] font-bold">{formatDateTimeSeconds(req.claimedAt)}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRequestToComplete(req);
                              setNidaInput('');
                              setCompleteError(null);
                            }}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>WEKA NIDA</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRequestToReject(req);
                              setRejectReason('');
                              setRejectError(null);
                            }}
                            className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>KATAA OMBI</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 3: COMPLETED WORK */}
            {hudumaSubTab === 'completed' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-neutral-700 uppercase tracking-wide px-1">
                  Kazi Ulizokamilisha
                </div>

                {completedRequests.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 text-center text-neutral-400">
                    <p className="text-xs">Bado haujakamilisha kazi yoyote.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {completedRequests.map(req => (
                      <div
                        key={req.id}
                        className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-neutral-800">{req.id}</span>
                          <span className="text-emerald-600 font-bold">+TSh {req.chargedPriceTzs.toLocaleString()}</span>
                        </div>
                        <div className="text-neutral-600 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span>Namba: <strong className="text-neutral-900">{req.targetPhoneNumber}</strong></span>
                            <span>Mteja: <strong>{req.customerName}</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5 border-t border-neutral-100">
                            <span>Muda wa Ombi:</span>
                            <span className="font-mono text-neutral-700">{formatDateTimeSeconds(req.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-emerald-800">
                            <span>Muda wa Response / Kukamilika:</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.completedAt || req.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-mono font-bold text-xs">
                          NIDA: {req.nidaResult}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: PROFILE ======================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Admin Profile Box */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-xl">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-neutral-900">{user.fullName}</h2>
                  <p className="text-xs font-mono text-neutral-500">{user.phone}</p>
                  <span className="inline-block px-2 py-0.5 bg-neutral-900 text-white rounded-full text-[10px] font-black uppercase mt-1">
                    ADMIN
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Menu */}
            {profileSection === 'menu' && (
              <div className="space-y-3">
                {/* Section: TAARIFA & USALAMA */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    PROFILE
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setProfileSection('taarifa')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Taarifa Zangu</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Badilisha Neno la Siri</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <div className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800">
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
                    {/* SETTINGS */}
                    <button
                      type="button"
                      onClick={() => setProfileSection('settings')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Settings (Akaunti, Usalama, Sessions)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section: WORK ACCOUNT */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>WORK ACCOUNT</span>
                    <span className="text-emerald-600 font-bold">TSh {workBalanceTzs.toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setProfileSection('work_account')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Salio la Kazi & Work Ledger</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section: DEPARTMENT & PERMISSIONS */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    IDARA & MAMLAKA
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setProfileSection('department')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Idara Yangu (Department)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileSection('permissions')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Idhini Zangu (Permissions)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section: FILES */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    FILES
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setProfileSection('files')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Files Nilizoidhinishwa Kuona</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section: HUDUMA KWA WATEJA */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    HUDUMA KWA WATEJA
                  </div>
                  <div className="p-3.5">
                    <a
                      href={`https://wa.me/${centralWhatsapp.replace(/\D/g, '') || '255748604483'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 rounded-xl text-xs font-bold transition-colors"
                    >
                      <span>Mawasiliano ya Uongozi (WhatsApp {centralWhatsapp})</span>
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Section: TOKA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded-2xl border border-neutral-200/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.2px]" />
                    <span>TOKA KWENYE AKAUNTI</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-view: SETTINGS */}
            {profileSection === 'settings' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-neutral-900 uppercase">
                    Settings & Usalama wa Admin
                  </h3>
                  <div className="divide-y divide-neutral-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setProfileSection('taarifa')}
                      className="w-full py-3 flex items-center justify-between text-neutral-800 hover:text-neutral-900"
                    >
                      <span>Akaunti (Taarifa Zangu)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full py-3 flex items-center justify-between text-neutral-800 hover:text-neutral-900"
                    >
                      <span>Usalama (Badilisha Password)</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await NmyApiClient.getSessions();
                        if (res.success && res.sessions) setSessions(res.sessions);
                        setProfileSection('sessions');
                      }}
                      className="w-full py-3 flex items-center justify-between text-neutral-800 hover:text-neutral-900"
                    >
                      <span>Sessions / Vifaa Vilivyoingia</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: FILES */}
            {profileSection === 'files' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs text-center py-10 space-y-2">
                  <p className="text-xs font-black text-neutral-800 uppercase">FILES NILIZOIDHINISHWA KUONA</p>
                  <p className="text-xs text-neutral-400">Hakuna mafaili yaliyogawiwa kwako kwa sasa.</p>
                </div>
              </div>
            )}

            {/* Sub-view: WORK ACCOUNT LEDGER */}
            {profileSection === 'work_account' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-3xl p-5 shadow-sm">
                  <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                    Salio la Kazi (Admin Work Account)
                  </span>
                  <div className="text-3xl font-black tracking-tight mt-1 text-emerald-400">
                    TSh {workBalanceTzs.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Mapato yaliyopatikana kutokana na usindikaji wa maombi ya NIDA.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase">
                    Work Ledger (Historia ya Mapato)
                  </h3>

                  {workLedger.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-3 text-center">Bado hakuna mapato yaliyorekodiwa.</p>
                  ) : (
                    <div className="space-y-2">
                      {workLedger.map((w: any) => (
                        <div key={w.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-150 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[11px] font-bold text-neutral-800">{w.reason}</span>
                            <div className="text-[10px] text-neutral-400 font-mono">{w.requestId}</div>
                            <div className="text-[10px] text-neutral-400">{formatDateTimeSeconds(w.timestamp)}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-600 font-black">+TSh {w.amount.toLocaleString()}</span>
                            <div className="text-[10px] text-neutral-400">Salio: TSh {w.balanceAfter.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: TAARIFA */}
            {profileSection === 'taarifa' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Taarifa za Admin</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-150">
                    <span className="text-neutral-400 text-[10px] block">JINA KAMILI</span>
                    <strong className="text-neutral-900 text-sm">{user.fullName}</strong>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-150">
                    <span className="text-neutral-400 text-[10px] block">NAMBA YA SIMU</span>
                    <strong className="text-neutral-900 text-sm font-mono">{user.phone}</strong>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-150">
                    <span className="text-neutral-400 text-[10px] block">CHEO</span>
                    <strong className="text-red-600 text-sm uppercase">ADMIN</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: DEPARTMENT */}
            {profileSection === 'department' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Idara Yangu</h3>
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                  <div className="font-bold text-neutral-900 text-sm">Kitengo cha Usindikaji wa NIDA (NIDA_OPS)</div>
                  <p className="text-neutral-600">
                    Kitengo kinachoshughulikia upatikanaji wa namba za NIDA kwa wateja waliowasilisha maombi kupitia mtandao wowote.
                  </p>
                </div>
              </div>
            )}

            {/* Sub-view: PERMISSIONS */}
            {profileSection === 'permissions' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Idhini Zangu (Permissions)</h3>
                <div className="space-y-2 text-xs">
                  {(user.permissions || ['PROCESS_REQUESTS', 'APPROVE_REQUESTS', 'REJECT_REQUESTS']).map(p => (
                    <div key={p} className="p-3 bg-neutral-50 rounded-xl border border-neutral-150 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-neutral-800">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view: SESSIONS */}
            {profileSection === 'sessions' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Vifaa Vilivyoingia (Max 2)</h3>
                <div className="space-y-2 text-xs">
                  {sessions.map(s => (
                    <div key={s.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-neutral-900">{s.deviceName}</div>
                        <div className="text-[10px] text-neutral-400">IP: {s.ip} • Imeingia: {formatDateTimeSeconds(s.createdAt)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await NmyApiClient.revokeSession(s.token);
                          setSessions(prev => prev.filter(x => x.id !== s.id));
                        }}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold"
                      >
                        Sitisha
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* STRICT BOTTOM NAVIGATION: HOME | HUDUMA | PROFILE */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        badgeCount={pendingRequests.length}
      />

      {/* Modal: Enter 20-digit NIDA Result & Complete */}
      {activeRequestToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-neutral-900 uppercase">
                Ingiza Namba ya NIDA
              </h3>
              <button onClick={() => setActiveRequestToComplete(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1">
              <div>Namba ya Simu: <strong className="text-neutral-900 font-mono text-sm">{activeRequestToComplete.targetPhoneNumber}</strong></div>
              <div>Mteja: <strong>{activeRequestToComplete.customerName}</strong></div>
              <div>Ombi ID: <span className="font-mono text-neutral-500">{activeRequestToComplete.id}</span></div>
            </div>

            {completeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{completeError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Namba ya NIDA (Tarakimu 20 Haswa)
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={nidaInput}
                  onChange={e => setNidaInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="19900101111010000123"
                  className="w-full px-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono font-bold tracking-wider focus:outline-none focus:border-red-500 focus:bg-white"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Herufi zilizoingizwa: {nidaInput.length} / 20
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveRequestToComplete(null)}
                  className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  GHAIRI
                </button>
                <button
                  type="submit"
                  disabled={completing || nidaInput.length !== 20}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  {completing ? 'Inakamilisha...' : 'THIBITISHA APPROVAL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Request (Requires Reason) */}
      {activeRequestToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-neutral-900 uppercase">
                Kataa Ombi la Mteja
              </h3>
              <button onClick={() => setActiveRequestToReject(null)} className="p-1 text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Kukataa ombi kutamrejeshea mteja Credit zake (TSh {activeRequestToReject.chargedPriceTzs.toLocaleString()}) kiotomatiki kwenye salio lake.
            </p>

            {rejectError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Sababu ya Kukataa Ombi
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Mfano: Namba ya simu haina usajili wa NIDA au taarifa hazijakamilika."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveRequestToReject(null)}
                  className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  GHAIRI
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  {rejecting ? 'Inakataa...' : 'THIBITISHA KUKATAA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        loading={loggingOut}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
