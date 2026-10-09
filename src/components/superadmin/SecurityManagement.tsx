import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { NmyUser, NmyFile } from '../../types/nmyTypes';
import { formatDateTimeSeconds } from '../../utils/dateUtils';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  KeyRound,
  FolderOpen,
  ShieldCheck,
  Search,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Download,
  RefreshCw,
  UserCheck,
  CreditCard,
  ChevronRight,
  Clock,
  RotateCcw
} from 'lucide-react';

interface Props {
  currentUser: NmyUser;
  onBack: () => void;
  onShowToast: (toast: { type: 'success' | 'error' | 'info'; text: string }) => void;
}

type SecurityView =
  | 'list'
  | 'funga_akaunti'
  | 'fungua_akaunti'
  | 'futa_akaunti'
  | 'reset_password'
  | 'files'
  | 'admin_access';

export const SecurityManagement: React.FC<Props> = ({ currentUser, onBack, onShowToast }) => {
  const [activeView, setActiveView] = useState<SecurityView>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [executingAction, setExecutingAction] = useState(false);

  // Files state
  const [filesList, setFilesList] = useState<NmyFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileSearch, setFileSearch] = useState('');

  // Load users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await NmyApiClient.getSuperAdminUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch {
      onShowToast({ type: 'error', text: 'Imeshindikana kupakia watumiaji.' });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load files
  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await NmyApiClient.getFiles();
      if (res.success && res.files) {
        setFilesList(res.files);
      }
    } catch {
      onShowToast({ type: 'error', text: 'Imeshindikana kupakia orodha ya faili.' });
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeView === 'files') {
      loadFiles();
    }
  }, [activeView]);

  // Filter users based on search
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (u.fullName || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  // Action: Lock Account
  const handleLockAccount = async () => {
    if (!selectedUser) return;
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.updateUserStatus(selectedUser.id, 'SUSPENDED');
      if (res.success) {
        onShowToast({
          type: 'success',
          text: `Akaunti ya ${selectedUser.fullName} imefungwa (LOCKED). Sessions zote zimefungwa.`
        });
        await loadUsers();
        setSelectedUser(null);
        setActionReason('');
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kufunga akaunti.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kufunga akaunti.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Unlock Account
  const handleUnlockAccount = async () => {
    if (!selectedUser) return;
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.updateUserStatus(selectedUser.id, 'ACTIVE');
      if (res.success) {
        onShowToast({
          type: 'success',
          text: `Akaunti ya ${selectedUser.fullName} imefunguliwa na kuwezeshwa (ACTIVE).`
        });
        await loadUsers();
        setSelectedUser(null);
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kufungua akaunti.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kufungua akaunti.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Mark For Deletion (7-Day Grace Period)
  const handleMarkForDeletion = async () => {
    if (!selectedUser) return;
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.markUserForDeletion(selectedUser.id);
      if (res.success) {
        onShowToast({
          type: 'success',
          text: `Akaunti ya ${selectedUser.fullName} imewekwa MARKED_FOR_DELETION (Siku 7 Grace Period).`
        });
        await loadUsers();
        setSelectedUser(null);
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kuanzisha ufutaji wa akaunti.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kuanzisha ufutaji.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Restore User From Deletion
  const handleRestoreFromDeletion = async () => {
    if (!selectedUser) return;
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.restoreUserFromDeletion(selectedUser.id);
      if (res.success) {
        onShowToast({
          type: 'success',
          text: `Akaunti ya ${selectedUser.fullName} imerejeshwa kuwa ACTIVE kikamilifu.`
        });
        await loadUsers();
        setSelectedUser(null);
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kurejesha akaunti.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kurejesha akaunti.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Permanent Delete User
  const handlePermanentDelete = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`ONYO LA MWISHO: Je, una uhakika unataka kufuta KABISA akaunti ya ${selectedUser.fullName}? Hatua hii haiwezi kubadilishwa.`)) {
      return;
    }
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.permanentDeleteUser(selectedUser.id);
      if (res.success) {
        onShowToast({
          type: 'success',
          text: `Akaunti ya ${selectedUser.fullName} imefutwa kabisa (PERMANENT DELETION).`
        });
        await loadUsers();
        setSelectedUser(null);
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kufuta akaunti kabisa.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kufuta kabisa.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Reset Password (to 1234, mustChangePassword=true)
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.resetUserPassword(selectedUser.id, '1234');
      if (res.success) {
        onShowToast({
          type: 'success',
          text: `Nenosiri la ${selectedUser.fullName} limewekwa upya kuwa 1234. Atalazimika kulibadilisha akilogin.`
        });
        await loadUsers();
        setSelectedUser(null);
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kuweka upya nenosiri.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kubadilisha nenosiri.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Toggle Admin Credit Permission
  const handleToggleAdminCredit = async (adminId: string, currentAllowed: boolean) => {
    setExecutingAction(true);
    try {
      const res = await NmyApiClient.updateAdminCreditPermission(adminId, !currentAllowed);
      if (res.success) {
        onShowToast({
          type: 'success',
          text: res.message || (!currentAllowed ? 'Ruhusa ya Credit imetolewa.' : 'Ruhusa ya Credit imeondolewa.')
        });
        await loadUsers();
      } else {
        onShowToast({ type: 'error', text: res.message || 'Hitilafu ya kurekebisha ruhusa.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kurekebisha ruhusa.' });
    } finally {
      setExecutingAction(false);
    }
  };

  // Action: Upload File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onShowToast({ type: 'error', text: 'Ukubwa wa faili hauwezi kuzidi 10MB.' });
      return;
    }

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await NmyApiClient.uploadFile(file.name, base64Data, file.type);
        if (res.success) {
          onShowToast({ type: 'success', text: `Faili "${file.name}" limepakiwa salama!` });
          await loadFiles();
        } else {
          onShowToast({ type: 'error', text: 'Imeshindikana kupakia faili.' });
        }
        setUploadingFile(false);
      };
      reader.onerror = () => {
        onShowToast({ type: 'error', text: 'Hitilafu ya kusoma faili.' });
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya kupakia faili.' });
      setUploadingFile(false);
    }
  };

  // Action: Delete File
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Je, una uhakika unataka kufuta faili "${fileName}"?`)) return;
    try {
      const res = await NmyApiClient.deleteFile(fileId);
      if (res.success) {
        onShowToast({ type: 'success', text: `Faili "${fileName}" limefutwa kikamilifu.` });
        await loadFiles();
      } else {
        onShowToast({ type: 'error', text: res.message || 'Imeshindikana kufuta faili.' });
      }
    } catch {
      onShowToast({ type: 'error', text: 'Hitilafu ya mtandao wakati wa kufuta faili.' });
    }
  };

  // --------------------------------------------------------------------------
  // RENDER: USER SELECTOR COMPONENT (Shared by Lock, Unlock, Delete, Reset)
  // --------------------------------------------------------------------------
  const renderUserSelector = (title: string, subtitle: string, filterFn?: (u: any) => boolean) => {
    const candidateUsers = filterFn ? filteredUsers.filter(filterFn) : filteredUsers;

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">{title}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tafuta kwa jina au namba ya simu (mfano: Juma Hamisi au 2557...)"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-red-600 focus:bg-white"
            />
          </div>
        </div>

        {/* User Selection List */}
        <div className="space-y-2">
          {candidateUsers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center text-neutral-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold uppercase">Hakuna mtumiaji aliyepatikana</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Andika jina au namba sahihi ya simu kutafuta.
              </p>
            </div>
          ) : (
            candidateUsers.map(u => {
              const isSelected = selectedUser?.id === u.id;
              const isCustomer = u.role === 'CUSTOMER';
              const isSelf = u.id === currentUser.id;

              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50/60 border-red-500 shadow-xs'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-sm">{u.fullName}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 bg-neutral-100 text-neutral-600 text-[9px] font-black rounded-sm">
                            WEWE
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-neutral-600 text-xs block mt-0.5">{u.phone}</span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-black rounded-md uppercase">
                          {u.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'MARKED_FOR_DELETION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status === 'SUSPENDED' ? 'LOCKED' : u.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">Salio</span>
                      <strong className="text-xs font-black text-neutral-900">
                        {isCustomer
                          ? `TSh ${(u.creditBalanceTzs || 0).toLocaleString()}`
                          : `TSh ${(u.workBalanceTzs || 0).toLocaleString()}`}
                      </strong>
                      <button
                        type="button"
                        className={`mt-2 px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {isSelected ? 'Amechaguliwa' : 'Chagua'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER SWITCH
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (activeView === 'list') {
              onBack();
            } else {
              setActiveView('list');
              setSelectedUser(null);
            }
          }}
          className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{activeView === 'list' ? 'Rudi Kwenye Settings' : 'Rudi Kwenye Security Management'}</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. LIST VIEW OF SECURITY MANAGEMENT ITEMS                              */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'list' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                SECURITY MANAGEMENT
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Usimamizi thabiti wa usalama wa mfumo wa RAVINI (Super Admin pekee)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden divide-y divide-neutral-100">
            {/* 1. Funga Akaunti */}
            <button
              type="button"
              onClick={() => {
                setActiveView('funga_akaunti');
                setSelectedUser(null);
              }}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-neutral-900 block">🔒 Funga Akaunti</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    Sitisha ufikiaji wa Customer au Admin (Sessions zinafungwa mara moja, data na salio vinalindwa)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* 2. Fungua Akaunti */}
            <button
              type="button"
              onClick={() => {
                setActiveView('fungua_akaunti');
                setSelectedUser(null);
              }}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Unlock className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-neutral-900 block">🔓 Fungua Akaunti</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    Rejesha akaunti iliyofungwa kuwa ACTIVE (Data na salio vyote vinarudi kama kawaida)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* 3. Futa Akaunti */}
            <button
              type="button"
              onClick={() => {
                setActiveView('futa_akaunti');
                setSelectedUser(null);
              }}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-neutral-900 block">🗑️ Futa Akaunti</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    7-Day Grace Period (Ufutaji wa kisheria wenye fursa ya Restore au Permanent Delete)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* 4. Reset PIN/Password */}
            <button
              type="button"
              onClick={() => {
                setActiveView('reset_password');
                setSelectedUser(null);
              }}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-neutral-900 block">🔑 Reset PIN/Password</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    Weka upya nenosiri kuwa 1234 (Mtumiaji anashurutishwa kuweka nenosiri jipya akilogin)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* 5. Files */}
            <button
              type="button"
              onClick={() => setActiveView('files')}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-neutral-900 block">📁 Files</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    Usimamizi wa mafaili yaliyolindwa, kupakia, kupakua, na kufuta
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* 6. Admin Access */}
            <button
              type="button"
              onClick={() => setActiveView('admin_access')}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-black text-neutral-900 block">🔐 Admin Access</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    Mamlaka ya Admins na ruhusa ya Kuongeza Credit (CAN_ADD_CREDIT)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. SUBVIEW: FUNGA AKAUNTI                                              */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'funga_akaunti' && (
        <div className="space-y-4">
          {renderUserSelector(
            '🔒 FUNGA AKAUNTI (LOCK ACCOUNT)',
            'Tafuta mtumiaji wa kumfungia akaunti yake. Mtumiaji hataweza kuingia, na sessions zake zitafungwa mara moja.',
            u => u.status === 'ACTIVE'
          )}

          {selectedUser && (
            <div className="bg-red-50/80 border-2 border-red-300 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-900 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>UTHIBITISHO WA KUFUNGA AKAUNTI</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-red-200 text-xs space-y-1">
                <div><strong>Mtumiaji:</strong> {selectedUser.fullName} ({selectedUser.phone})</div>
                <div><strong>Wadhifa (Role):</strong> {selectedUser.role}</div>
                <div><strong>Hali ya Sasa:</strong> {selectedUser.status}</div>
                <p className="text-[11px] text-neutral-600 pt-1">
                  Mtumiaji huyu hataweza kuingia kwenye mfumo tena mpaka akaunti yake itakapofunguliwa. Sessions zake zote za vifaa vilivyoingia zitafutwa. <strong>Salio lake, maombi yake, na rekodi zote zitabaki salama bila kufutwa.</strong>
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Sababu ya kufunga akaunti (Hiari):
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Mfano: Hatua za usalama / ukaguzi..."
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <button
                type="button"
                onClick={handleLockAccount}
                disabled={executingAction}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>{executingAction ? 'Inafunga Akaunti...' : 'THIBITISHA KUFUNGA AKAUNTI HII'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. SUBVIEW: FUNGUA AKAUNTI                                            */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'fungua_akaunti' && (
        <div className="space-y-4">
          {renderUserSelector(
            '🔓 FUNGUA AKAUNTI (UNLOCK ACCOUNT)',
            'Tafuta mtumiaji aliyefungwa ili kumfungulia akaunti yake na kumrejeshea uwezo wa kuingia.',
            u => u.status === 'SUSPENDED' || u.status === 'DISABLED'
          )}

          {selectedUser && (
            <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>UTHIBITISHO WA KUFUNGUA AKAUNTI</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 text-xs space-y-1">
                <div><strong>Mtumiaji:</strong> {selectedUser.fullName} ({selectedUser.phone})</div>
                <div><strong>Wadhifa (Role):</strong> {selectedUser.role}</div>
                <div><strong>Hali ya Sasa:</strong> {selectedUser.status}</div>
                <p className="text-[11px] text-neutral-600 pt-1">
                  Mtumiaji atawezeshwa tena (ACTIVE) na ataweza kuingia na kutumia mfumo, salio lake, na maombi yake yote kama kawaida.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUnlockAccount}
                disabled={executingAction}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Unlock className="w-4 h-4" />
                <span>{executingAction ? 'Inafungua Akaunti...' : 'THIBITISHA KUFUNGUA AKAUNTI HII'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. SUBVIEW: FUTA AKAUNTI (7-DAY GRACE PERIOD & RESTORE)                */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'futa_akaunti' && (
        <div className="space-y-4">
          {renderUserSelector(
            '🗑️ FUTA AKAUNTI (7-DAY GRACE PERIOD)',
            'Super Admin pekee mwenye mamlaka. Akaunti ikiwekwa MARKED_FOR_DELETION inaingia kwenye Grace Period ya siku 7 na inaweza kurejeshwa (Restore) kabla ya kufutwa kabisa.'
          )}

          {selectedUser && (
            <div className="bg-white border-2 border-red-400 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-900 font-black text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>USIMAMIZI WA UFUTAJI WA AKAUNTI</span>
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-xs space-y-1.5">
                <div><strong>Mtumiaji:</strong> {selectedUser.fullName} ({selectedUser.phone})</div>
                <div><strong>Wadhifa (Role):</strong> {selectedUser.role}</div>
                <div>
                  <strong>Hali ya Akaunti:</strong>{' '}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedUser.status === 'MARKED_FOR_DELETION' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-200 text-neutral-800'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>

                {selectedUser.status === 'MARKED_FOR_DELETION' && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-[11px] text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>IPO KWENYE 7-DAY GRACE PERIOD</span>
                    </div>
                    {selectedUser.markedForDeletionAt && (
                      <div>Iliwekwa: {formatDateTimeSeconds(selectedUser.markedForDeletionAt)}</div>
                    )}
                    {selectedUser.scheduledPermanentDeletionAt && (
                      <div>Ufutaji wa Kudumu: {formatDateTimeSeconds(selectedUser.scheduledPermanentDeletionAt)}</div>
                    )}
                    {selectedUser.deletionInitiatedBy && (
                      <div>Ilianzishwa na: {selectedUser.deletionInitiatedBy}</div>
                    )}
                  </div>
                )}
              </div>

              {selectedUser.status === 'MARKED_FOR_DELETION' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleRestoreFromDeletion}
                    disabled={executingAction}
                    className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>REJESHA AKAUNTI (RESTORE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePermanentDelete}
                    disabled={executingAction}
                    className="py-3 px-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>FUTA KABISA SASA</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900 space-y-1">
                    <p className="font-bold">ONYO KALI LA UFUTAJI:</p>
                    <p>
                      Mtumiaji akiwekwa <strong>MARKED FOR DELETION</strong>:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Hataweza kuingia tena kwenye mfumo mara moja.</li>
                      <li>Sessions zake zote zinafutwa.</li>
                      <li>Anapewa Grace Period ya siku 7. Ndani ya siku 7 unaweza kuirejesha (RESTORE).</li>
                      <li>Baada ya siku 7, akaunti na data zake zitafutwa kabisa kisheria.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkForDeletion}
                    disabled={executingAction}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{executingAction ? 'Inashughulikia...' : 'WEKA KWENYE 7-DAY GRACE PERIOD'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 5. SUBVIEW: RESET PIN/PASSWORD                                         */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'reset_password' && (
        <div className="space-y-4">
          {renderUserSelector(
            '🔑 RESET PIN / PASSWORD',
            'Super Admin pekee ndiye anayeweza kuweka upya nenosiri la Customer au Admin kuwa nenosiri la muda (1234).'
          )}

          {selectedUser && (
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>UTHIBITISHO WA KU-RESET NENOSIRI</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-xs space-y-1">
                <div><strong>Mtumiaji:</strong> {selectedUser.fullName} ({selectedUser.phone})</div>
                <div><strong>Wadhifa (Role):</strong> {selectedUser.role}</div>
                <div className="pt-2 text-[11px] text-neutral-600 space-y-1">
                  <p>
                    Nenosiri litawekwa upya kuwa nenosiri la muda: <strong>1234</strong> (bcrypt secure hash).
                  </p>
                  <p className="text-amber-800 font-bold">
                    Mtumiaji akilogin kwa mara ya kwanza kwa kutumia 1234, atalazimishwa mara moja kuweka nenosiri jipya na hataweza kutumia mfumo kabla ya kubadilisha.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={executingAction}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                <span>{executingAction ? 'Ina-reset...' : 'THIBITISHA KU-RESET NENOSIRI KUWA 1234'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 6. SUBVIEW: FILES MANAGEMENT                                           */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'files' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                  📁 FILE MANAGEMENT ({filesList.length})
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mafaili yaliyohifadhiwa salama kwenye PostgreSQL Cloud SQL
                </p>
              </div>

              <label className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0">
                <Upload className="w-4 h-4" />
                <span>{uploadingFile ? 'Inapakia...' : 'Pakia Faili'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>
            </div>

            <input
              type="text"
              value={fileSearch}
              onChange={e => setFileSearch(e.target.value)}
              placeholder="Tafuta faili kwa jina au muundo..."
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-red-600 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            {filesList
              .filter(f => !fileSearch.trim() || (f.fileName || '').toLowerCase().includes(fileSearch.toLowerCase()))
              .map(file => (
                <div
                  key={file.id}
                  className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 flex items-center justify-between text-xs hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-100 text-neutral-700 rounded-xl">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block">{file.fileName || 'Faili'}</span>
                      <span className="text-[10px] text-neutral-400">
                        {((file.sizeBytes || 0) / 1024).toFixed(1)} KB • {file.fileType} • {formatDateTimeSeconds(file.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors"
                      title="Pakua au Fungua"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id, file.fileName || 'Faili')}
                      className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      title="Futa Faili"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

            {filesList.length === 0 && !loadingFiles && (
              <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center text-neutral-400">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase">Hakuna faili lililohifadhiwa bado</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Tumia kitufe cha "Pakia Faili" kuongeza faili jipya.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 7. SUBVIEW: ADMIN ACCESS (CAN_ADD_CREDIT PERMISSION)                    */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'admin_access' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                ADMIN ACCESS & PERMISSIONS
              </h3>
            </div>
            <p className="text-xs text-neutral-500">
              Usimamizi wa mamlaka ya Admins wote. Washa au zima ruhusa ya <strong>CAN_ADD_CREDIT</strong> kwa kila Admin kibinafsi.
            </p>
          </div>

          <div className="space-y-3">
            {users
              .filter(u => u.role === 'ADMIN')
              .map(admin => {
                const permissions: string[] = Array.isArray(admin.permissions) ? admin.permissions : [];
                const canAddCredit = permissions.includes('CAN_ADD_CREDIT');

                return (
                  <div
                    key={admin.id}
                    className="p-4 bg-white rounded-2xl border border-neutral-200/80 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 text-sm block">{admin.fullName}</span>
                        <span className="font-mono text-neutral-600 text-xs mt-0.5 block">{admin.phone}</span>
                        <span className="text-[10px] text-neutral-400">
                          Hali: <strong className="text-neutral-700">{admin.status}</strong>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase block">Salio la Kazi</span>
                        <strong className="text-xs font-black text-neutral-900">
                          TSh {(admin.workBalanceTzs || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-neutral-800 block text-xs">Ruhusa ya Kuongeza Credit</span>
                          <span className="text-[10px] text-neutral-500">
                            {canAddCredit
                              ? 'Admin huyu ana mamlaka ya kuongeza Credit kwa wateja'
                              : 'Admin huyu hana mamlaka ya kuongeza Credit'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleAdminCredit(admin.id, canAddCredit)}
                        disabled={executingAction}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          canAddCredit
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                        }`}
                      >
                        {canAddCredit ? 'IMEWASHWA' : 'IMEZIMWA'}
                      </button>
                    </div>
                  </div>
                );
              })}

            {users.filter(u => u.role === 'ADMIN').length === 0 && (
              <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center text-neutral-400">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase">Hakuna Admin bado</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Admins waliopo kwenye database wataonekana hapa.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
