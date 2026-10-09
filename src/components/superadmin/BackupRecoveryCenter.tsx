import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { NmyBackupRecord, NmyIntegrityReport } from '../../types/nmyTypes';
import { useToast } from '../common/Toast';
import { formatDateTimeSeconds } from '../../utils/dateUtils';
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  RefreshCw,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  HardDrive,
  Trash2,
  Lock,
  ArrowLeft,
  Search,
  Activity
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const BackupRecoveryCenter: React.FC<Props> = ({ onBack }) => {
  const toast = useToast();
  const [backups, setBackups] = useState<NmyBackupRecord[]>([]);
  const [lastBackup, setLastBackup] = useState<NmyBackupRecord | null>(null);
  const [lastVerified, setLastVerified] = useState<NmyBackupRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Restore Modal
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<NmyBackupRecord | null>(null);
  const [restoreConfirmPhrase, setRestoreConfirmPhrase] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Integrity Check
  const [integrityReport, setIntegrityReport] = useState<NmyIntegrityReport | null>(null);
  const [runningIntegrity, setRunningIntegrity] = useState(false);

  // Manual Cleanup
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupCategory, setCleanupCategory] = useState<'NOTIFICATIONS' | 'SESSIONS' | 'AUDIT_LOGS'>('NOTIFICATIONS');
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleanupConfirmation, setCleanupConfirmation] = useState('');
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await NmyApiClient.getBackups();
      if (res.success) {
        setBackups(res.backups || []);
        setLastBackup(res.lastBackup || null);
        setLastVerified(res.lastVerified || null);
      }
    } catch {
      toast.error('Hitilafu ya kupata orodha ya backups.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await NmyApiClient.createBackup();
      if (res.success) {
        toast.success('Backup mpya imetengenezwa na kuthibitishwa kikamilifu (Verified Backup).', '✅ Backup Imekamilika');
        loadBackups();
      } else {
        toast.error(res.message || 'Hitilafu ya kutengeneza backup.');
      }
    } catch {
      toast.error('Hitilafu ya mtandao wakati wa kutengeneza backup.');
    } finally {
      setCreating(false);
    }
  };

  const handleRunIntegrityCheck = async () => {
    setRunningIntegrity(true);
    try {
      const res = await NmyApiClient.runIntegrityCheck();
      if (res.success && res.report) {
        setIntegrityReport(res.report);
        if (res.report.isHealthy) {
          toast.success('Data zote ziko salama na zimehakikiwa kikamilifu (No discrepancies).', '🛡️ Data Integrity: PASS');
        } else {
          toast.warning(`Uhakiki umegundua tahadhari ${res.report.discrepancies.length}. Tazama ripoti chini.`, '⚠️ Data Discrepancy');
        }
      }
    } catch {
      toast.error('Hitilafu ya kukagua data integrity.');
    } finally {
      setRunningIntegrity(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore) return;
    if (restoreConfirmPhrase !== 'THIBITISHA REJESHA') {
      toast.error('Andika neno "THIBITISHA REJESHA" haswa ili kuidhinisha urejeshaji.');
      return;
    }

    setRestoring(true);
    try {
      const res = await NmyApiClient.restoreBackup(selectedBackupForRestore.id, restoreConfirmPhrase);
      if (res.success) {
        toast.success(res.message || 'Urejeshaji salama umekamilika kikamilifu.', '✅ Mfumo Umerejeshwa');
        setSelectedBackupForRestore(null);
        setRestoreConfirmPhrase('');
        loadBackups();
      } else {
        toast.error(res.message || 'Hitilafu ya kurejesha mfumo.');
      }
    } catch {
      toast.error('Hitilafu ya mtandao wakati wa kurejesha.');
    } finally {
      setRestoring(false);
    }
  };

  const handleExecuteCleanup = async () => {
    if (cleanupConfirmation !== 'FUTA HISTORIA') {
      toast.error('Andika neno "FUTA HISTORIA" haswa ili kuthibitisha usafishaji.');
      return;
    }

    setCleaning(true);
    try {
      const res = await NmyApiClient.cleanupHistory(cleanupDays, cleanupCategory, cleanupConfirmation);
      if (res.success) {
        toast.success(res.message || 'Usafishaji umekamilika.', '✅ Usafishaji Umekamilika');
        setShowCleanupModal(false);
        setCleanupConfirmation('');
        loadBackups();
      } else {
        toast.error(res.message || 'Hitilafu ya kufanya usafishaji.');
      }
    } catch {
      toast.error('Hitilafu ya mtandao wakati wa usafishaji.');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Rudi Kwenye Settings</span>
        </button>
        <button
          type="button"
          onClick={loadBackups}
          disabled={loading}
          className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 cursor-pointer"
          title="Onyesha upya"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Title Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-black text-neutral-900 uppercase tracking-tight">
            BACKUP & RECOVERY CENTER
          </h2>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Kituo kikuu cha ulinzi na uhakiki wa data za <strong>RAVINI</strong>. Kanuni kuu: <strong>DATA INABAKI — HAKUNA FACTORY RESET — BACKUP HAIFUTI DATA</strong>.
        </p>

        {/* Quick Health Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Hali ya Backup</span>
            <span className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lastVerified ? 'VERIFIED HEALTHY' : 'PENDING CHECK'}</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Backup ya Mwisho</span>
            <span className="text-xs font-mono font-bold text-neutral-800 block truncate mt-0.5">
              {lastBackup ? formatDateTimeSeconds(lastBackup.timestamp) : 'Bado'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Jumla ya Backups</span>
            <span className="text-xs font-mono font-extrabold text-neutral-900 block mt-0.5">
              {backups.length} points
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
            <span className="text-[10px] font-bold text-neutral-400 block uppercase">Hifadhi Huru</span>
            <span className="text-xs font-bold text-neutral-800 block mt-0.5 truncate">
              data/backups/
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex-1 min-w-[160px] py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <Database className="w-4 h-4" />
            <span>{creating ? 'Inaunda & Inathibitisha...' : 'Tengeneza Backup Mpya'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunIntegrityCheck}
            disabled={runningIntegrity}
            className="flex-1 min-w-[160px] py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>{runningIntegrity ? 'Inakagua Data...' : 'Kagua Data Integrity'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCleanupModal(true)}
            className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-neutral-500" />
            <span>Usafishaji wa Historia</span>
          </button>
        </div>
      </div>

      {/* Integrity Report Card (If Generated) */}
      {integrityReport && (
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {integrityReport.isHealthy ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <h3 className="text-sm font-black text-neutral-900 uppercase">
                Matokeo ya Uhakiki wa Data (Integrity Check)
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                integrityReport.isHealthy
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {integrityReport.isHealthy ? 'PASSED 100%' : 'TAHADHARINI'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">Watumiaji</span>
              <span className="font-bold text-neutral-900">{integrityReport.totalUsers}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">Maombi (Requests)</span>
              <span className="font-bold text-neutral-900">{integrityReport.totalRequests}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">Credit Ledger</span>
              <span className="font-bold text-neutral-900">{integrityReport.totalLedgerEntries}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">Malipo</span>
              <span className="font-bold text-neutral-900">{integrityReport.totalCreditRequests}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[9px] uppercase">Audit Logs</span>
              <span className="font-bold text-neutral-900">{integrityReport.totalAuditLogs}</span>
            </div>
          </div>

          {integrityReport.discrepancies.length === 0 ? (
            <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Hakuna hitilafu yoyote iliyogunduliwa! Salio la wateja wote linaendana sawa na Credit Ledger, na hakuna miamala iliyojirudia.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {integrityReport.discrepancies.map((d, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>{d.type}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 bg-amber-200 rounded-md">{d.severity}</span>
                  </div>
                  <p className="text-neutral-700">{d.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-neutral-900 uppercase">
              Orodha ya Recovery Points & Backups
            </h3>
            <span className="text-[11px] text-neutral-500">
              Kila snapshot imehakikiwa kwa saini ya SHA-256 (CREATE → VERIFY → STORE → RECORD).
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-400">
            {backups.length} zimehifadhiwa
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 space-y-2">
            <Database className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs">Bado hakuna backup iliyorekodiwa. Bonyeza kitufe hapo juu kuunda.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {backups.map(b => (
              <div
                key={b.id}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100/70 rounded-2xl border border-neutral-200 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-neutral-900 block truncate">
                      {b.filename}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {formatDateTimeSeconds(b.timestamp)}
                      </span>
                      <span>•</span>
                      <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="font-mono text-[9px] text-neutral-400">SHA256: {b.sha256Checksum.slice(0, 12)}...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>VERIFIED</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedBackupForRestore(b)}
                      className="px-2.5 py-1 bg-white border border-neutral-300 hover:border-red-600 hover:text-red-600 text-neutral-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rejesha</span>
                    </button>
                  </div>
                </div>

                {/* Record Counts Snapshot */}
                <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] border-t border-neutral-200/60 font-mono text-neutral-600">
                  <div>Wateja: <strong>{b.recordCounts.users}</strong></div>
                  <div>Maombi: <strong>{b.recordCounts.requests}</strong></div>
                  <div>Ledger: <strong>{b.recordCounts.creditLedger}</strong></div>
                  <div>Audit: <strong>{b.recordCounts.auditLogs}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controlled Restore Modal */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center gap-2.5 text-red-600">
              <ShieldAlert className="w-6 h-6 stroke-[2.2px]" />
              <h3 className="text-base font-black text-neutral-900 uppercase">
                Urejeshaji Salama (Safe Restore)
              </h3>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Ulinzi wa Data za Sasa:</span>
              <p className="leading-relaxed">
                Mfumo utachukua <strong>Pre-Restore Snapshot</strong> ya hali ya sasa kabla ya kutekeleza urejeshaji. Hakuna data itakayofutwa bila kumbukumbu.
              </p>
            </div>

            <div className="text-xs space-y-1 text-neutral-600">
              <p>Faili la kurejesha:</p>
              <p className="font-mono font-bold text-neutral-900 p-2 bg-neutral-100 rounded-xl break-all">
                {selectedBackupForRestore.filename}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-700 block">
                Andika neno <strong>THIBITISHA REJESHA</strong> hapa chini:
              </label>
              <input
                type="text"
                value={restoreConfirmPhrase}
                onChange={e => setRestoreConfirmPhrase(e.target.value)}
                placeholder="THIBITISHA REJESHA"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-red-600"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBackupForRestore(null);
                  setRestoreConfirmPhrase('');
                }}
                disabled={restoring}
                className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoring || restoreConfirmPhrase !== 'THIBITISHA REJESHA'}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${restoring ? 'animate-spin' : ''}`} />
                <span>{restoring ? 'Inarejesha...' : 'Rejesha Sasa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center gap-2 text-neutral-900">
              <Trash2 className="w-5 h-5 text-neutral-600" />
              <h3 className="text-base font-black uppercase">
                Usafishaji wa Historia ya Mfumo
              </h3>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-neutral-900 block">Kanuni Kuu ya Ulinzi:</span>
              <p className="text-neutral-600 leading-relaxed">
                Usafishaji huu <strong>HAUGUSI</strong> akaunti za wateja, salio la Credit, miamala ya ledger, wala maombi ya wateja (requests). Inasafisha tu taarifa zisizo za kifedha.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Chagua Aina ya Data:</label>
                <select
                  value={cleanupCategory}
                  onChange={e => setCleanupCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                >
                  <option value="NOTIFICATIONS">Notifications za Zamani</option>
                  <option value="SESSIONS">Vifaa/Sessions za Zamani</option>
                  <option value="AUDIT_LOGS">Audit Logs Zilizozidi 500</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Rekodi Zilizopita Zaidi Ya:</label>
                <select
                  value={cleanupDays}
                  onChange={e => setCleanupDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                >
                  <option value={30}>Siku 30 Zilizopita</option>
                  <option value={60}>Siku 60 Zilizopita</option>
                  <option value={90}>Siku 90 Zilizopita</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Andika <strong>FUTA HISTORIA</strong> kuthibitisha:
                </label>
                <input
                  type="text"
                  value={cleanupConfirmation}
                  onChange={e => setCleanupConfirmation(e.target.value)}
                  placeholder="FUTA HISTORIA"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono font-bold"
                >
                </input>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCleanupModal(false);
                  setCleanupConfirmation('');
                }}
                disabled={cleaning}
                className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleExecuteCleanup}
                disabled={cleaning || cleanupConfirmation !== 'FUTA HISTORIA'}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{cleaning ? 'Inasafisha...' : 'Safi Sasa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
