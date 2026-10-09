import React, { useState } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { useToast } from '../common/Toast';
import { formatDateTimeSeconds } from '../../utils/dateUtils';
import {
  Search,
  Users,
  ShieldCheck,
  CreditCard,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  Trash2,
  Lock,
  UserX,
  Key,
  PlusCircle,
  Activity
} from 'lucide-react';

interface Props {
  onBack: () => void;
  initialQuery?: string;
}

export const GlobalSearchAnd360: React.FC<Props> = ({ onBack, initialQuery = '' }) => {
  const toast = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: any[];
    admins: any[];
    requests: any[];
    payments: any[];
  } | null>(null);

  // 360 Selected State
  const [activeCustomer360, setActiveCustomer360] = useState<any | null>(null);
  const [activeAdmin360, setActiveAdmin360] = useState<any | null>(null);
  const [loading360, setLoading360] = useState(false);

  // Deactivate Customer Modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await NmyApiClient.globalSearch(query.trim());
      if (res.success && res.results) {
        setResults(res.results);
      }
    } catch {
      toast.error('Hitilafu ya kufanya utafutaji.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomer360 = async (customerId: string) => {
    setLoading360(true);
    try {
      const res = await NmyApiClient.getCustomer360(customerId);
      if (res.success) {
        setActiveCustomer360(res);
        setActiveAdmin360(null);
      }
    } catch {
      toast.error('Hitilafu ya kupata taarifa za Customer 360.');
    } finally {
      setLoading360(false);
    }
  };

  const handleOpenAdmin360 = async (adminId: string) => {
    setLoading360(true);
    try {
      const res = await NmyApiClient.getAdmin360(adminId);
      if (res.success) {
        setActiveAdmin360(res);
        setActiveCustomer360(null);
      }
    } catch {
      toast.error('Hitilafu ya kupata taarifa za Admin 360.');
    } finally {
      setLoading360(false);
    }
  };

  const handleExecuteDeactivate = async () => {
    if (!activeCustomer360) return;
    if (deactivateConfirmation !== 'FUTA AKAUNTI') {
      toast.error('Andika neno "FUTA AKAUNTI" ili kuidhinisha kitendo hiki.');
      return;
    }

    setDeactivating(true);
    try {
      const res = await NmyApiClient.deleteCustomerManual(
        activeCustomer360.customer.id,
        deactivateReason || 'Kufungwa na Super Admin',
        deactivateConfirmation
      );
      if (res.success) {
        toast.success(res.message || 'Akaunti ya mteja imefungwa salama. Data za fedha zimebaki intact.');
        setShowDeactivateModal(false);
        setDeactivateConfirmation('');
        setDeactivateReason('');
        // Reload 360
        handleOpenCustomer360(activeCustomer360.customer.id);
      } else {
        toast.error(res.message || 'Hitilafu ya kufunga akaunti.');
      }
    } catch {
      toast.error('Hitilafu ya mtandao wakati wa kufunga akaunti.');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (activeCustomer360 || activeAdmin360) {
              setActiveCustomer360(null);
              setActiveAdmin360(null);
            } else {
              onBack();
            }
          }}
          className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{activeCustomer360 || activeAdmin360 ? 'Rudi Kwenye Matokeo ya Search' : 'Rudi Kwenye Settings'}</span>
        </button>
      </div>

      {/* Main View: Customer 360 */}
      {activeCustomer360 ? (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider">
                  CUSTOMER 360° PROFILE
                </span>
                <h2 className="text-lg font-black text-neutral-900">
                  {activeCustomer360.customer.fullName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
                  <span className="font-mono font-bold text-neutral-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    {activeCustomer360.customer.phone}
                  </span>
                  <span>•</span>
                  <span>User ID: <strong className="font-mono text-neutral-800">{activeCustomer360.customer.fullName} — {activeCustomer360.customer.phone}</strong></span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  activeCustomer360.customer.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {activeCustomer360.customer.status}
              </span>
            </div>

            {/* Credit Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-neutral-100">
              <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Salio la Sasa</span>
                <span className="text-base font-black text-red-600">
                  TSh {activeCustomer360.credit.currentBalance.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Jumla Iliyoongezwa</span>
                <span className="text-xs font-bold text-neutral-800">
                  TSh {activeCustomer360.credit.totalAdded.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Jumla Iliyotumika</span>
                <span className="text-xs font-bold text-neutral-800">
                  TSh {activeCustomer360.credit.totalCharged.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Marejesho (Refunds)</span>
                <span className="text-xs font-bold text-neutral-800">
                  TSh {activeCustomer360.credit.totalRefunded.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Una uhakika unataka kuweka upya nenosiri la ${activeCustomer360.customer.fullName} kuwa 1234? Mtumiaji atalazimika kulibadilisha akiingia.`)) {
                    try {
                      const res = await NmyApiClient.resetUserPassword(activeCustomer360.customer.id, '1234');
                      if (res.success) {
                        toast.success(`Neno la siri la ${activeCustomer360.customer.fullName} limewekwa upya kuwa 1234.`);
                      } else {
                        toast.error(res.message || 'Hitilafu ya kuweka upya neno la siri.');
                      }
                    } catch {
                      toast.error('Hitilafu ya mtandao.');
                    }
                  }
                }}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Weka Nenosiri 1234</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <UserX className="w-4 h-4" />
                <span>Kufunga / Kufuta Akaunti</span>
              </button>
            </div>
          </div>

          {/* Customer Requests */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-neutral-900 uppercase">
              Historia ya Maombi ya NIDA ({activeCustomer360.requests.length})
            </h3>
            {activeCustomer360.requests.length === 0 ? (
              <p className="text-xs text-neutral-400">Mteja huyu bado hajafanya ombi lolote.</p>
            ) : (
              <div className="space-y-2">
                {activeCustomer360.requests.map((r: any) => (
                  <div key={r.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-neutral-800">{r.id}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-neutral-200">{r.status}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Simu: <strong className="font-mono text-neutral-900">{r.targetPhoneNumber}</strong></span>
                      <span className="font-bold text-red-600">TSh {r.chargedPriceTzs}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-0.5 border-t border-neutral-100">
                      <span>Muda wa Ombi:</span>
                      <span className="font-mono text-neutral-800">{formatDateTimeSeconds(r.createdAt)}</span>
                    </div>
                    {(r.completedAt || r.rejectedAt || r.status === 'EXPIRED') && (
                      <div className="flex items-center justify-between text-[11px] text-neutral-600">
                        <span>Muda wa Response / Hitimisho:</span>
                        <span className="font-mono font-bold text-neutral-900">{formatDateTimeSeconds(r.completedAt || r.rejectedAt || r.updatedAt)}</span>
                      </div>
                    )}
                    {r.nidaResult && (
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-950 font-mono font-bold text-[11px]">
                        NIDA: {r.nidaResult}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Ledger */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-neutral-900 uppercase">
              Credit Ledger (Kumbukumbu Kamili ya Salio)
            </h3>
            <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto">
              {activeCustomer360.credit.ledger.map((l: any) => (
                <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900 block">{l.reason}</span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {formatDateTimeSeconds(l.timestamp)} • Ref: {l.reference}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-black ${
                        l.type === 'CHARGE' ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {l.type === 'CHARGE' ? '-' : '+'}TSh {l.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      Salio Baada: TSh {l.balanceAfter.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeAdmin360 ? (
        /* Main View: Admin 360 */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                  ADMIN 360° PROFILE
                </span>
                <h2 className="text-lg font-black text-neutral-900">
                  {activeAdmin360.admin.fullName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
                  <span className="font-mono font-bold text-neutral-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    {activeAdmin360.admin.phone}
                  </span>
                  <span>•</span>
                  <span>Wadhifa: <strong>{activeAdmin360.admin.role}</strong></span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800">
                {activeAdmin360.admin.status}
              </span>
            </div>

            {/* Work Account & Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Salio la Kazi</span>
                <span className="text-base font-black text-emerald-600">
                  TSh {activeAdmin360.workAccount.balanceTzs.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Kazi Zilizokamilika</span>
                <span className="text-xs font-bold text-neutral-800">
                  {activeAdmin360.workload.completedCount}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Kazi Zilizokataliwa</span>
                <span className="text-xs font-bold text-neutral-800">
                  {activeAdmin360.workload.rejectedCount}
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Ufanisi (Rate)</span>
                <span className="text-xs font-black text-neutral-900">
                  {activeAdmin360.workload.completionRate}%
                </span>
              </div>
            </div>

            {/* Permissions */}
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
              <span className="font-bold text-neutral-800 block mb-1">Mamlaka (Permissions):</span>
              <div className="flex flex-wrap gap-1.5">
                {activeAdmin360.admin.permissions?.map((p: string) => (
                  <span key={p} className="px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded-md text-[10px] font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Admin Action Bar */}
            <div className="flex gap-2 pt-2 border-t border-neutral-150">
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Una uhakika unataka kuweka upya nenosiri la Admin ${activeAdmin360.admin.fullName} kuwa 1234? Mtumiaji atalazimika kulibadilisha akiingia.`)) {
                    try {
                      const res = await NmyApiClient.resetUserPassword(activeAdmin360.admin.id, '1234');
                      if (res.success) {
                        toast.success(`Neno la siri la ${activeAdmin360.admin.fullName} limewekwa upya kuwa 1234.`);
                      } else {
                        toast.error(res.message || 'Hitilafu ya kuweka upya neno la siri.');
                      }
                    } catch {
                      toast.error('Hitilafu ya mtandao.');
                    }
                  }
                }}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Weka Nenosiri 1234</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Search Bar & Results */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-black text-neutral-900 uppercase">
                GLOBAL SEARCH
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Tafuta jina la mteja, namba ya simu, User ID, jina la Admin, Request ID, namba ya NIDA, au namba ya kumbukumbu ya malipo.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 pt-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Andika jina, simu, NMY-..., NIDA tarakimu 20..."
                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold outline-none focus:border-red-600"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="py-3 px-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-xs cursor-pointer"
              >
                {loading ? 'Inatafuta...' : 'Tafuta'}
              </button>
            </form>
          </div>

          {/* Results List */}
          {results && (
            <div className="space-y-4">
              {/* Customers Match */}
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-red-600" />
                    <span>Wateja ({results.customers.length})</span>
                  </h3>
                </div>

                {results.customers.length === 0 ? (
                  <p className="text-xs text-neutral-400">Hakuna mteja anayelingana na neno hili.</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {results.customers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleOpenCustomer360(c.id)}
                        className="py-3 flex items-center justify-between hover:bg-neutral-50/80 p-2 rounded-xl cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-xs text-neutral-900 block">{c.fullName}</span>
                          <span className="font-mono text-[11px] text-neutral-500">{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded-md">
                            Fungua 360°
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requests Match */}
              <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Maombi ya NIDA ({results.requests.length})</span>
                </h3>

                {results.requests.length === 0 ? (
                  <p className="text-xs text-neutral-400">Hakuna ombi linalolingana.</p>
                ) : (
                  <div className="space-y-2">
                    {results.requests.map(r => (
                      <div key={r.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-neutral-900">{r.id}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-neutral-200">{r.status}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 text-[11px]">
                          <span>Mteja: <strong>{r.customerName}</strong> ({r.customerPhone})</span>
                          <span>Inayotafutiwa: <strong className="font-mono text-neutral-900">{r.targetPhoneNumber}</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5 border-t border-neutral-100">
                          <span>Muda wa Ombi:</span>
                          <span className="font-mono text-neutral-800">{formatDateTimeSeconds(r.createdAt)}</span>
                        </div>
                        {(r.completedAt || r.rejectedAt || r.status === 'EXPIRED') && (
                          <div className="flex items-center justify-between text-[10px] text-neutral-600">
                            <span>Muda wa Response / Hitimisho:</span>
                            <span className="font-mono font-bold text-neutral-900">{formatDateTimeSeconds(r.completedAt || r.rejectedAt || r.updatedAt)}</span>
                          </div>
                        )}
                        {r.nidaResult && (
                          <div className="p-1.5 bg-emerald-50 rounded text-emerald-950 font-mono text-[11px]">
                            NIDA Result: {r.nidaResult}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admins Match */}
              {results.admins.length > 0 && (
                <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-neutral-700" />
                    <span>Admins ({results.admins.length})</span>
                  </h3>
                  <div className="divide-y divide-neutral-100">
                    {results.admins.map(a => (
                      <div
                        key={a.id}
                        onClick={() => handleOpenAdmin360(a.id)}
                        className="py-3 flex items-center justify-between hover:bg-neutral-50/80 p-2 rounded-xl cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-neutral-900 block">{a.fullName}</span>
                          <span className="font-mono text-[11px] text-neutral-500">{a.phone} • {a.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-neutral-700 uppercase bg-neutral-100 px-2 py-0.5 rounded-md">
                            Fungua 360°
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Deactivate Customer Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center gap-2 text-red-600">
              <UserX className="w-6 h-6 stroke-[2.2px]" />
              <h3 className="text-base font-black text-neutral-900 uppercase">
                Kufunga Akaunti ya Mteja
              </h3>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 space-y-1">
              <span className="font-bold block">Ulinzi wa Data za Fedha:</span>
              <p className="leading-relaxed">
                Akaunti hii itafungwa lakini kumbukumbu zote za fedha (Credit Ledger) na maombi yaliyopita <strong>HAZITAFUTWA</strong> ili kulinda uhalali wa hesabu za mapato.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Sababu ya Kufunga:</label>
                <input
                  type="text"
                  value={deactivateReason}
                  onChange={e => setDeactivateReason(e.target.value)}
                  placeholder="Mfano: Ombi la mteja mwenyewe, au usalama"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Andika <strong>FUTA AKAUNTI</strong> kuthibitisha:
                </label>
                <input
                  type="text"
                  value={deactivateConfirmation}
                  onChange={e => setDeactivateConfirmation(e.target.value)}
                  placeholder="FUTA AKAUNTI"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateConfirmation('');
                }}
                disabled={deactivating}
                className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleExecuteDeactivate}
                disabled={deactivating || deactivateConfirmation !== 'FUTA AKAUNTI'}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{deactivating ? 'Inafunga...' : 'Funga Akaunti'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
