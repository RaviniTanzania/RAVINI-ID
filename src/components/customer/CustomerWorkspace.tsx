import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { NmyUser, NmyRequest, NmyCreditLedgerEntry, NmyNotification, NmySession } from '../../types/nmyTypes';
import { BottomNav, NavTab } from '../common/BottomNav';
import { LogoutModal } from '../common/LogoutModal';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { formatDateTimeSeconds, isDateInDarWindow } from '../../utils/dateUtils';
import {
  ShieldCheck,
  CreditCard,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Copy,
  Check,
  ChevronRight,
  PlusCircle,
  ArrowRight,
  Smartphone,
  Lock,
  Globe,
  Bell,
  FileText,
  HelpCircle,
  LogOut,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  History,
  Trash2
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { NotificationPermissionBanner } from '../common/NotificationPermissionBanner';
import { TextAnnouncementsList } from '../common/TextAnnouncementsList';
import { getSavedLang, saveLang, translations, formatFullTimestamp } from '../../lib/i18n';

interface Props {
  user: NmyUser;
  onLogout: () => void;
  onUserUpdated: (user: NmyUser) => void;
}

export const CustomerWorkspace: React.FC<Props> = ({ user, onLogout }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [profileSection, setProfileSection] = useState<'menu' | 'taarifa' | 'settings' | 'credit' | 'maombi' | 'files' | 'sessions'>('menu');
  const [currentLang, setCurrentLang] = useState<'sw' | 'en'>(getSavedLang);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  // Deletion modal state
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; targetPhone: string; isPending: boolean } | null>(null);
  const [deletingRequest, setDeletingRequest] = useState(false);

  // Balances & Data
  const [balanceTzs, setBalanceTzs] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(false);

  const [requests, setRequests] = useState<NmyRequest[]>([]);
  const [servicePriceTzs, setServicePriceTzs] = useState<number>(100);
  const [serviceActive, setServiceActive] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NmyNotification[]>([]);
  const [ledger, setLedger] = useState<NmyCreditLedgerEntry[]>([]);
  const [sessions, setSessions] = useState<NmySession[]>([]);
  const [supportPhone, setSupportPhone] = useState('255748604483');
  const [whatsappNumber, setWhatsappNumber] = useState('255748604483');

  // New Request Form
  const [targetPhone, setTargetPhone] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  // Buy Credit Form
  const [buyAmount, setBuyAmount] = useState<string>('500');
  const [buyMethod, setBuyMethod] = useState<string>('M-PESA');
  const [buyReference, setBuyReference] = useState('');
  const [submittingBuy, setSubmittingBuy] = useState(false);
  const [buyMessage, setBuyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Request filter
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [timeWindowFilter, setTimeWindowFilter] = useState<'LEO' | 'WIKI' | 'MWEZI' | 'YOTE'>('YOTE');

  useEffect(() => {
    loadAllData();

    const handleNav = (e: any) => {
      const url = e.detail?.url || '';
      if (url.includes('maombi')) {
        setActiveTab('huduma');
      } else if (url.includes('credit')) {
        setActiveTab('profile');
        setProfileSection('credit');
      } else if (url.includes('profile')) {
        setActiveTab('profile');
      } else if (url.includes('huduma')) {
        setActiveTab('huduma');
      } else {
        setActiveTab('home');
      }
    };

    const handleRealtime = (e: any) => {
      const type = e.detail?.type;
      if (type === 'REQUEST_UPDATED' || type === 'CREDIT_UPDATED' || type === 'ANNOUNCEMENT_CREATED') {
        loadAllData();
      }
    };

    const handleLang = (e: any) => {
      if (e.detail?.lang) setCurrentLang(e.detail.lang);
    };

    window.addEventListener('ravini_navigate', handleNav);
    window.addEventListener('ravini_realtime_event', handleRealtime);
    window.addEventListener('ravini_lang_change', handleLang);
    return () => {
      window.removeEventListener('ravini_navigate', handleNav);
      window.removeEventListener('ravini_realtime_event', handleRealtime);
      window.removeEventListener('ravini_lang_change', handleLang);
    };
  }, []);

  const handleResubmitRequest = async (reqId: string) => {
    setResubmittingId(reqId);
    try {
      const res = await NmyApiClient.resubmitCustomerRequest(reqId);
      if (res.success) {
        toast.success(currentLang === 'sw' ? 'Ombi limetumwa upya kikamilifu!' : 'Request resubmitted successfully!');
        await loadAllData();
      } else {
        toast.error(res.message || (currentLang === 'sw' ? 'Hitilafu ya kutuma tena ombi.' : 'Error resubmitting request.'));
      }
    } catch (e: any) {
      toast.error(e.message || 'Hitilafu ya mtandao.');
    } finally {
      setResubmittingId(null);
    }
  };

  const loadAllData = async () => {
    setBalanceLoading(true);
    setBalanceError(false);

    try {
      const [dashRes, creditRes, configRes] = await Promise.all([
        NmyApiClient.getCustomerDashboard(),
        NmyApiClient.getCustomerCredit(),
        NmyApiClient.getPublicConfig()
      ]);

      if (dashRes.success) {
        setRequests(dashRes.recentRequests || []);
        if (dashRes.service) {
          setServicePriceTzs(dashRes.service.priceTzs);
          setServiceActive(dashRes.service.isActive);
        }
        setNotifications(dashRes.notifications || []);
      }

      if (creditRes.success) {
        setBalanceTzs(creditRes.balanceTzs ?? 0);
        setLedger(creditRes.ledger || []);
      } else {
        setBalanceError(true);
      }

      if (configRes.success && configRes.config) {
        if (configRes.config.service) {
          setServicePriceTzs(configRes.config.service.priceTzs);
          setServiceActive(configRes.config.service.isActive);
        }
        if (configRes.config.supportPhone) {
          setSupportPhone(configRes.config.supportPhone);
        }
        if (configRes.config.whatsappNumber) {
          setWhatsappNumber(configRes.config.whatsappNumber);
        }
      }
    } catch {
      setBalanceError(true);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    await NmyApiClient.logout();
    setLoggingOut(false);
    setShowLogoutModal(false);
    onLogout();
  };

  // Submit NIDA Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setRequestSuccess(null);

    const clean = targetPhone.replace(/\D/g, '');
    if (!/^0\d{9}$/.test(clean)) {
      setRequestError('Namba ya simu lazima iwe na tarakimu 10 na ianze na 0 (mfano: 0712345678).');
      return;
    }

    if (balanceTzs !== null && balanceTzs < servicePriceTzs) {
      setRequestError(`Huna salio la kutosha (Una TSh ${balanceTzs.toLocaleString()}). Unahitaji TSh ${servicePriceTzs.toLocaleString()}. Tafadhali ongeza Credit.`);
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await NmyApiClient.submitNidaRequest(clean);
      if (res.success && res.request) {
        setRequestSuccess(`Ombi lako ${res.request.id} limepokelewa na linasubiri usindikaji!`);
        setTargetPhone('');
        setBalanceTzs(res.newBalance);
        setRequests(prev => [res.request, ...prev]);
        loadAllData();
      } else {
        setRequestError(res.message || 'Hitilafu ya kutuma ombi.');
      }
    } catch {
      setRequestError('Muunganisho wa mtandao unasumbua.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // RULE 2: Mteja anayeamua kufuta ombi lake
  const handleConfirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    setDeletingRequest(true);
    try {
      const res = await NmyApiClient.deleteCustomerRequest(requestToDelete.id);
      if (res.success) {
        toast.success(
          requestToDelete.isPending
            ? 'Ombi limefutwa na kiasi cha Credit kimerejeshwa kwenye akaunti yako!'
            : 'Ombi limefutwa kwenye orodha yako.',
          '✅ Ombi Limefutwa'
        );
        setRequestToDelete(null);
        loadAllData();
      } else {
        toast.error(res.message || 'Hitilafu ya kufuta ombi.');
      }
    } catch {
      toast.error('Hitilafu ya mtandao wakati wa kufuta ombi.');
    } finally {
      setDeletingRequest(false);
    }
  };

  // Submit Buy Credit Request
  const handleBuyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyMessage(null);

    const amount = Number(buyAmount);
    if (!amount || amount < 100) {
      setBuyMessage({ type: 'error', text: 'Kiwango cha chini ni TSh 100.' });
      return;
    }

    if (!buyReference.trim()) {
      setBuyMessage({ type: 'error', text: 'Weka namba ya muamala (Reference ID) uliyopokea kwa SMS.' });
      return;
    }

    setSubmittingBuy(true);
    try {
      const res = await NmyApiClient.buyCredit({
        amountTzs: amount,
        paymentMethod: buyMethod,
        paymentReference: buyReference.trim()
      });

      if (res.success) {
        setBuyMessage({
          type: 'success',
          text: 'Ombi lako limepokelewa! Msimamizi Mkuu atathibitisha malipo yako na Credit zitaongezwa muda mfupi ujao.'
        });
        setBuyReference('');
        loadAllData();
      } else {
        setBuyMessage({ type: 'error', text: res.message || 'Hitilafu ya kutuma ombi la Credit.' });
      }
    } catch {
      setBuyMessage({ type: 'error', text: 'Muunganisho wa mtandao unasumbua.' });
    } finally {
      setSubmittingBuy(false);
    }
  };

  const windowRequests = requests.filter(r => isDateInDarWindow(r.createdAt, timeWindowFilter));

  const customerStats = {
    total: windowRequests.length,
    completed: windowRequests.filter(r => r.status === 'APPROVED').length,
    pending: windowRequests.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length,
    rejectedOrExpired: windowRequests.filter(r => r.status === 'REJECTED' || r.status === 'EXPIRED').length,
    responsesReceived: windowRequests.filter(r => r.status === 'APPROVED' || (r.nidaResult && r.nidaResult.trim().length > 0)).length
  };

  const filteredRequests = windowRequests.filter(r => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-neutral-900 pb-20 font-sans selection:bg-red-100 selection:text-red-700">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-neutral-900 uppercase">
                  RAVINI
                </h1>
              </div>
              <p className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                {currentLang === 'sw' ? 'Akaunti ya Mteja' : 'Customer Account'}
              </p>
            </div>
          </div>

          {/* Quick Balance Badge */}
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setProfileSection('credit'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-red-600" />
            <span>
              {balanceLoading
                ? '...'
                : balanceError
                ? 'Hitilafu'
                : `TSh ${(balanceTzs ?? 0).toLocaleString()}`}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Real Push Notification Permission Guidance */}
        <NotificationPermissionBanner userRole="CUSTOMER" />

        {/* Text-Only Active System Announcements */}
        <TextAnnouncementsList />
        {/* ======================= TAB 1: HOME ======================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Action Bar with Manual Refresh */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                {currentLang === 'sw' ? 'Mwanzo' : 'Home'}
              </span>
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  await loadAllData();
                  setTimeout(() => setIsRefreshing(false), 500);
                }}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-red-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? (currentLang === 'sw' ? 'Inasasisha...' : 'Refreshing...') : (currentLang === 'sw' ? '🔄 SASISHA' : '🔄 REFRESH')}</span>
              </button>
            </div>

            {/* Greeting Hero Card */}
            <div className="bg-gradient-to-br from-red-600 via-red-600 to-red-700 rounded-3xl p-5 text-white shadow-lg shadow-red-600/15 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-red-100 uppercase">
                      Akaunti ya Mteja
                    </span>
                    <h2 className="text-lg font-black tracking-tight mt-0.5">
                      Habari, {user.fullName}!
                    </h2>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>

                {/* Real Authoritative Balance */}
                <div className="mt-4 pt-3.5 border-t border-white/15 flex items-end justify-between">
                  <div>
                    <span className="text-[11px] text-red-100 font-medium">Salio Lako la Credit:</span>
                    <div className="text-2xl font-black tracking-tight mt-0.5">
                      {balanceLoading ? (
                        <span className="text-sm font-normal text-red-200">Inapakia salio...</span>
                      ) : balanceError ? (
                        <div className="text-xs text-amber-200">
                          <span>SALIO HALIPATIKANI</span>
                          <button
                            onClick={loadAllData}
                            className="block text-[10px] font-bold underline mt-0.5 text-white"
                          >
                            Jaribu Tena
                          </button>
                        </div>
                      ) : (
                        `TSh ${(balanceTzs ?? 0).toLocaleString()}`
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('profile'); setProfileSection('credit'); }}
                    className="px-3.5 py-2 bg-white text-red-600 hover:bg-red-50 rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Ongeza Credit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Service Action Banner */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-neutral-900 uppercase">
                    {currentLang === 'sw' ? 'HUDUMA YA NIDA' : 'NIDA SERVICE'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {currentLang === 'sw' ? 'Pata namba ya NIDA kwa haraka na usalama' : 'Get NIDA number quickly and securely'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('huduma')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Fungua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Request Summary Counters */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Inasubiri</span>
                <p className="text-base font-black text-amber-600 mt-0.5">
                  {requests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Inashughulikiwa</span>
                <p className="text-base font-black text-blue-600 mt-0.5">
                  {requests.filter(r => r.status === 'PROCESSING').length}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Imekamilika</span>
                <p className="text-base font-black text-emerald-600 mt-0.5">
                  {requests.filter(r => r.status === 'APPROVED').length}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Jumla</span>
                <p className="text-base font-black text-neutral-800 mt-0.5">
                  {requests.length}
                </p>
              </div>
            </div>

            {/* Recent Requests Section */}
            <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  Maombi Yangu ya Hivi Karibuni
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('huduma')}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  Ona Yote
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-6 text-neutral-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">Bado hujaweka ombi lolote.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('huduma')}
                    className="mt-2 text-xs font-bold text-red-600 hover:underline"
                  >
                    Weka Ombi la NIDA Sasa
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.slice(0, 3).map(req => (
                    <div
                      key={req.id}
                      className="p-3 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl border border-neutral-150 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-neutral-700">{req.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : req.status === 'EXPIRED'
                              ? 'bg-neutral-200 text-neutral-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-600 space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <span>Namba: <strong className="text-neutral-900">{req.targetPhoneNumber}</strong></span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            Muda: {formatDateTimeSeconds(req.createdAt)}
                          </span>
                        </div>
                        {req.claimedAt && (
                          <div className="flex items-center justify-between text-[10px] text-blue-700">
                            <span>Kuanza Kushughulikiwa:</span>
                            <span className="font-mono">{formatDateTimeSeconds(req.claimedAt)}</span>
                          </div>
                        )}
                        {req.status === 'APPROVED' && (
                          <div className="flex items-center justify-between text-[10px] text-emerald-700">
                            <span>Muda wa Majibu (Response):</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.completedAt || req.updatedAt)}</span>
                          </div>
                        )}
                        {req.status === 'REJECTED' && (
                          <div className="flex items-center justify-between text-[10px] text-red-600">
                            <span>Muda Uliokataliwa:</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.rejectedAt || req.updatedAt)}</span>
                          </div>
                        )}
                        {req.status === 'EXPIRED' && (
                          <div className="flex items-center justify-between text-[10px] text-amber-800">
                            <span>Muda Ulioisha (Expired):</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.updatedAt)}</span>
                          </div>
                        )}
                      </div>

                      {req.nidaResult && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div className="text-xs font-mono font-bold text-emerald-900">
                            NIDA: {req.nidaResult}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.nidaResult!, req.id)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                          >
                            {copiedId === req.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedId === req.id ? 'Imenakiliwa' : 'Nakili'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Alert list */}
            {notifications.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-neutral-800 font-bold text-xs uppercase">
                  <Bell className="w-4 h-4 text-red-600" />
                  <span>Taarifa za Mfumo</span>
                </div>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map(n => (
                    <div key={n.id} className="p-2.5 bg-neutral-50 rounded-xl text-xs text-neutral-700 border border-neutral-100 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">{n.title}</span>
                        {n.createdAt && (
                          <span className="text-[10px] font-mono text-neutral-400">
                            {formatDateTimeSeconds(n.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: HUDUMA ======================= */}
        {activeTab === 'huduma' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Service Title Card */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 stroke-[2.2px]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-neutral-900 uppercase">
                      {currentLang === 'sw' ? 'HUDUMA YA NIDA' : 'NIDA SERVICE'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {currentLang === 'sw' ? 'Huduma ya uhakiki na kupata namba ya NIDA' : 'NIDA verification and number lookup service'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      serviceActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {serviceActive ? 'INAFANYA KAZI' : 'IMESITISHWA'}
                  </span>
                  <div className="text-xs font-bold text-neutral-700 mt-1">
                    Bei: <span className="text-red-600 font-black">TSh {servicePriceTzs.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Service Submission Form */}
              <form onSubmit={handleSubmitRequest} className="mt-5 pt-4 border-t border-neutral-150 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Namba ya Simu Inayotafutiwa NIDA (Tarakimu 10)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={targetPhone}
                      onChange={e => setTargetPhone(e.target.value)}
                      placeholder="0712345678"
                      className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Namba lazima iwe na tarakimu 10 na ianze na 0 (mfano: 07XXXXXXXX, 06XXXXXXXX).
                  </p>
                </div>

                {/* Balance vs Price check */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 text-[11px]">Salio Lako: </span>
                    <strong className="text-neutral-900 font-bold">
                      TSh {(balanceTzs ?? 0).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[11px]">Gharama: </span>
                    <strong className="text-red-600 font-bold">
                      TSh {servicePriceTzs.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {requestError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{requestError}</span>
                  </div>
                )}

                {requestSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{requestSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingRequest || !serviceActive}
                  className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white font-black text-xs tracking-wider rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingRequest ? 'Inatuma Ombi...' : `TUMA OMBI (TSh ${servicePriceTzs.toLocaleString()})`}
                </button>
              </form>
            </div>

            {/* Request History Section */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Takwimu / Historia Yangu
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Saa na Tarehe ya Afrika/Dar es Salaam (DD/MM/YYYY HH:mm:ss)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadAllData}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
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

              {/* Customer Statistics Grid */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase block">Jumla Maombi</span>
                  <strong className="text-lg font-black text-neutral-900 mt-0.5 block">{customerStats.total}</strong>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block">Yaliyokamilika</span>
                  <strong className="text-lg font-black text-emerald-800 mt-0.5 block">{customerStats.completed}</strong>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[9px] font-bold text-amber-700 uppercase block">Yanayosubiri</span>
                  <strong className="text-lg font-black text-amber-800 mt-0.5 block">{customerStats.pending}</strong>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-[9px] font-bold text-blue-700 uppercase block">Majibu Yaliyopokelewa</span>
                  <strong className="text-lg font-black text-blue-800 mt-0.5 block">{customerStats.responsesReceived}</strong>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {(['ALL', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED'] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setRequestFilter(tabKey)}
                    className={`px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
                      requestFilter === tabKey
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {tabKey === 'ALL' ? 'Yote' : tabKey}
                  </button>
                ))}
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Hakuna maombi kwenye orodha hii.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map(req => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-neutral-800">{req.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : req.status === 'EXPIRED'
                              ? 'bg-neutral-200 text-neutral-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-600 space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                          <span>Namba: <strong className="text-neutral-900 font-bold">{req.targetPhoneNumber}</strong></span>
                          <span>Gharama: <strong>TSh {req.chargedPriceTzs.toLocaleString()}</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5 border-t border-neutral-100">
                          <span>Muda Uliotumwa:</span>
                          <span className="font-mono font-bold text-neutral-800">{formatDateTimeSeconds(req.createdAt)}</span>
                        </div>
                        {req.claimedAt && (
                          <div className="flex items-center justify-between text-[11px] text-blue-700">
                            <span>Kuanza Kushughulikiwa:</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.claimedAt)}</span>
                          </div>
                        )}
                        {req.status === 'APPROVED' && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-800">
                            <span>Muda wa Majibu (Response):</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.completedAt || req.updatedAt)}</span>
                          </div>
                        )}
                        {req.status === 'REJECTED' && (
                          <div className="flex items-center justify-between text-[11px] text-red-700">
                            <span>Muda Uliokataliwa:</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.rejectedAt || req.updatedAt)}</span>
                          </div>
                        )}
                        {req.status === 'EXPIRED' && (
                          <div className="flex items-center justify-between text-[11px] text-amber-900">
                            <span>Muda Ulioisha (Expired):</span>
                            <span className="font-mono font-bold">{formatDateTimeSeconds(req.updatedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Result card if approved */}
                      {req.status === 'APPROVED' && req.nidaResult && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                          <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                            Namba ya NIDA Iliyopatikana:
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono font-black text-emerald-950 tracking-wider">
                              {req.nidaResult}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(req.nidaResult!, req.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedId === req.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === req.id ? 'Imenakiliwa' : 'Nakili'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Rejection / Refund note */}
                      {req.status === 'REJECTED' && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-0.5">
                          <p className="font-bold">Ombi Limekataliwa</p>
                          <p className="text-[11px]">Sababu: {req.rejectionReason || 'Taarifa hazikulingana'}</p>
                          <p className="text-[10px] text-emerald-700 font-bold mt-1">
                            ✓ Salio la TSh {req.chargedPriceTzs.toLocaleString()} limerejeshwa kwenye akaunti yako.
                          </p>
                        </div>
                      )}

                      {/* Expiration note & Resubmit Action */}
                      {req.status === 'EXPIRED' && (
                        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2 mt-2">
                          <p className="font-extrabold text-amber-900 text-xs">
                            {currentLang === 'sw' ? 'Ombi Limeisha Muda wa Kushughulikiwa' : 'Request Expired'}
                          </p>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            {currentLang === 'sw'
                              ? 'Ombi lako limeisha muda wa kushughulikiwa. Ombi hili halikushughulikiwa ndani ya muda uliowekwa. Tafadhali tuma ombi upya ikiwa bado unahitaji huduma hii ili kuepuka usumbufu au hasara.'
                              : 'Your request has expired because it was not processed within the allocated timeframe. Please resubmit if you still require this service to avoid inconvenience.'}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ✓ {currentLang === 'sw' ? 'Salio limerejeshwa kwenye akaunti yako.' : 'Balance refunded to your account.'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResubmitRequest(req.id)}
                              disabled={resubmittingId === req.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${resubmittingId === req.id ? 'animate-spin' : ''}`} />
                              <span>{resubmittingId === req.id ? (currentLang === 'sw' ? 'Inatuma...' : 'Resubmitting...') : (currentLang === 'sw' ? '🔄 TUMA TENA OMBI' : '🔄 RESUBMIT REQUEST')}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: PROFILE ======================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-neutral-900">{user.fullName}</h2>
                  <p className="text-xs font-mono text-neutral-500">{user.phone}</p>
                  <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-[10px] font-black uppercase mt-1">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-section Switcher */}
            {profileSection === 'menu' && (
              <div className="space-y-3">
                {/* Section: TAARIFA ZANGU & USALAMA */}
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
                          onClick={() => {
                            setCurrentLang('sw');
                            saveLang('sw');
                          }}
                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer ${
                            currentLang === 'sw' ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          🇹🇿 KISWAHILI
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentLang('en');
                            saveLang('en');
                          }}
                          className={`px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer ${
                            currentLang === 'en' ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          🇬🇧 ENGLISH
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

                {/* Section: CREDIT */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                    <span>CREDIT YAKO</span>
                    <span className="text-red-600 font-bold">TSh {(balanceTzs ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setProfileSection('credit')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-red-600" />
                        <span>Credit Yangu (Nunua Credit, Historia)</span>
                      </div>
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
                      <span>Files Zangu & Historia</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Section: MAOMBI YANGU */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    MAOMBI YANGU
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab('huduma')}
                      className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Orodha ya Maombi ya NIDA</span>
                      <span className="text-xs text-neutral-400 font-normal">{requests.length} ombi</span>
                    </button>
                  </div>
                </div>

                {/* Section: HUDUMA KWA WATEJA */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-50/70 border-b border-neutral-150 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                    HUDUMA KWA WATEJA
                  </div>
                  <div className="p-3.5 space-y-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await NmyApiClient.customerWhatsappAction(0);
                          if (res.success && res.whatsappUrl) {
                            window.open(res.whatsappUrl, '_blank');
                          }
                        } catch {
                          console.error('Error opening support');
                        }
                      }}
                      className="w-full flex items-center justify-between p-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Msaada wa WhatsApp</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`tel:+${supportPhone.replace(/\D/g, '') || '255748604483'}`}
                      className="flex items-center justify-between p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-neutral-600" />
                        <span>Piga Simu ya Huduma</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Section: TOKA (LOGOUT) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-red-50 text-red-600 font-bold text-xs rounded-2xl border border-neutral-200/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.2px]" />
                    <span>TOKA KWENYE AKAUNTI</span>
                  </button>
                  <div className="mt-4 text-center text-[10px] text-neutral-400 space-y-0.5">
                    <p className="font-bold text-neutral-400 uppercase tracking-wider">RAVINI</p>
                  </div>
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
                    Settings & Usalama
                  </h3>
                  <div className="divide-y divide-neutral-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setProfileSection('taarifa')}
                      className="w-full py-3 flex items-center justify-between text-neutral-800 hover:text-neutral-900"
                    >
                      <span>Akaunti (Jina na Namba ya Simu)</span>
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

            {/* Sub-view: CREDIT YAKO NA ONGEZA CREDIT */}
            {profileSection === 'credit' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                {/* Current Balance Display */}
                <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-3xl p-5 shadow-sm">
                  <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                    Salio la Sasa
                  </span>
                  <div className="text-3xl font-black tracking-tight mt-1">
                    TSh {(balanceTzs ?? 0).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Hili ndilo salio lako halisi la mfumo. Unaweza kulitumia kuweka maombi ya NIDA.
                  </p>
                </div>

                {/* Buy Credit Form */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-black text-neutral-900 uppercase">
                      Nunua / Ongeza Credit
                    </h3>
                  </div>

                  {/* WhatsApp Payment Action Card */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-emerald-950 uppercase text-[11px]">Malipo Salama kwa WhatsApp:</div>
                        <p className="text-[11px] text-emerald-800">
                          Chagua kiasi unachotaka cha Credit kisha bonyeza kitufe hapa chini kufanya malipo kwa njia ya WhatsApp.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-neutral-700">
                        Chagua au Weka Kiasi cha Credit (TSh):
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['500', '1000', '2000', '5000'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setBuyAmount(val)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              buyAmount === val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-neutral-800 border-neutral-200 hover:bg-emerald-50'
                            }`}
                          >
                            {parseInt(val, 10).toLocaleString()}
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={buyAmount}
                        onChange={e => setBuyAmount(e.target.value)}
                        placeholder="Weka kiasi kingine (Kiwango cha chini TSh 100)"
                        className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* THE AUTHORITATIVE LIPA / PAY THROUGH WHATSAPP BUTTON */}
                    <button
                      type="button"
                      onClick={async () => {
                        const amt = Number(buyAmount) || 1000;
                        try {
                          const res = await NmyApiClient.customerWhatsappAction(amt);
                          if (res.success && res.whatsappUrl) {
                            window.open(res.whatsappUrl, '_blank');
                            setBuyMessage({
                              type: 'success',
                              text: `WhatsApp imefunguliwa na ujumbe wa malipo ya TSh ${amt.toLocaleString()}. Baada ya kulipa, weka namba ya kumbukumbu (Reference) hapa chini ili Super Admin athibitishe.`
                            });
                          } else {
                            setBuyMessage({
                              type: 'error',
                              text: res.message || 'Hitilafu ya kupata kiunganishi cha WhatsApp.'
                            });
                          }
                        } catch {
                          setBuyMessage({
                            type: 'error',
                            text: 'Hitilafu ya kufungua WhatsApp.'
                          });
                        }
                      }}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>LIPA / PAY THROUGH WHATSAPP</span>
                    </button>

                    <p className="text-[10px] text-neutral-500 leading-tight">
                      * Malipo yote yanafanyika kwa mikono kupitia WhatsApp. Credit huwekwa baada ya Msimamizi Mkuu kuthibitisha muamala wako.
                    </p>
                  </div>

                  {buyMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                        buyMessage.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}
                    >
                      {buyMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <span>{buyMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleBuyCredit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Kiasi cha Credit Unachotaka (TSh)
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={buyAmount}
                        onChange={e => setBuyAmount(e.target.value)}
                        placeholder="Kiwango cha chini TSh 100"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Njia Uliyotumia Kulipa
                      </label>
                      <select
                        value={buyMethod}
                        onChange={e => setBuyMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 focus:bg-white"
                      >
                        <option value="M-PESA">M-PESA (Vodacom)</option>
                        <option value="AIRTEL_MONEY">Airtel Money</option>
                        <option value="MIXX_BY_YAS">Mixx by Yas (Tigo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Kumbukumbu ya Muamala (Reference / Transaction ID)
                      </label>
                      <input
                        type="text"
                        value={buyReference}
                        onChange={e => setBuyReference(e.target.value)}
                        placeholder="Mfano: 9JG829QW au namba ya ujumbe wa SMS"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-red-500 focus:bg-white uppercase"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBuy}
                      className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      {submittingBuy ? 'Inatuma Ombi...' : 'WASILISHA OMBI LA KUONGEZA CREDIT'}
                    </button>
                  </form>
                </div>

                {/* Credit Ledger History */}
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase">
                    Historia ya Miamala ya Credit
                  </h3>

                  {ledger.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-3 text-center">Bado hakuna miamala ya Credit.</p>
                  ) : (
                    <div className="space-y-2">
                      {ledger.map(entry => (
                        <div
                          key={entry.id}
                          className="p-3 bg-neutral-50 rounded-xl border border-neutral-150 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase mb-1 ${
                                entry.type === 'ADD'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.type === 'CHARGE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {entry.type}
                            </span>
                            <div className="font-semibold text-neutral-800 text-[11px]">{entry.reason}</div>
                            <div className="text-[10px] text-neutral-400">
                              {formatDateTimeSeconds(entry.timestamp)}
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-sm font-black ${
                                entry.type === 'ADD' || entry.type === 'REFUND'
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {entry.type === 'ADD' || entry.type === 'REFUND' ? '+' : '-'}
                              TSh {entry.amount.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-neutral-400">
                              Salio: TSh {entry.balanceAfter.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view: TAARIFA ZANGU */}
            {profileSection === 'taarifa' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Taarifa Zangu</h3>
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
                    <span className="text-neutral-400 text-[10px] block">CHEO (ROLE)</span>
                    <strong className="text-red-600 text-sm uppercase">{user.role}</strong>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-150">
                    <span className="text-neutral-400 text-[10px] block">HALI YA AKAUNTI</span>
                    <strong className="text-emerald-600 text-sm uppercase">{user.status}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: SESSIONS / VIFAA */}
            {profileSection === 'sessions' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Vifaa Vilivyoingia (Sessions)</h3>
                <p className="text-[11px] text-neutral-500">
                  Kulingana na sera ya usalama, akaunti ya mteja inaruhusiwa kifaa 1 pekee kwa wakati mmoja.
                </p>

                <div className="space-y-2.5">
                  {sessions.map(s => (
                    <div key={s.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
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

            {/* Sub-view: FILES */}
            {profileSection === 'files' && (
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setProfileSection('menu')}
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  ← Rudi Kwenye Profile
                </button>

                <h3 className="text-sm font-black text-neutral-900 uppercase">Files Zangu</h3>
                <p className="text-xs text-neutral-400 text-center py-6">
                  Hakuna faili zilizopakiwa bado. Maombi yako ya NIDA yatahifadhiwa kiotomatiki hapa.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* STRICT BOTTOM NAVIGATION: HOME | HUDUMA | PROFILE */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

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
