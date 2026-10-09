import { User } from '../types';

export interface RaviniFile {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  serviceName: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  icon?: string;
  createdAt: string;
  requiredFields?: { key: string; label: string; type: string; placeholder?: string; required?: boolean }[];
}

export interface RaviniFileGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface FileAssignment {
  id: string;
  fileId: string;
  userId: string;
  userRole?: string;
  userName?: string;
  assignedBy: string;
  assignedAt: string;
  status: 'ACTIVE' | 'REVOKED';
  permissions?: string[]; // e.g. ['VIEW', 'SUBMIT', 'PROCESS', 'APPROVE']
}

export interface FileApplication {
  id: string;
  fileId: string;
  fileName: string;
  groupId: string;
  groupName: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerRaviniId?: string;
  title: string;
  description?: string;
  submittedData: Record<string, any>;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION' | 'COMPLETED' | 'PROCESSING';
  cost?: number;
  applicationNumber?: string;
  referenceNumber?: string;
  rejectionReason?: string;
  correctionNote?: string;
  resultData?: {
    summary?: string;
    documentUrl?: string;
    referenceNumber?: string;
    completedAt?: string;
    processedBy?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type RaviniApplication = FileApplication;

const FILES_STORAGE_KEY = 'ravini_files_v1';
const GROUPS_STORAGE_KEY = 'ravini_file_groups_v1';
const ASSIGNMENTS_STORAGE_KEY = 'ravini_file_assignments_v1';
const APPLICATIONS_STORAGE_KEY = 'ravini_file_applications_v1';

// Seed Initial Groups
const DEFAULT_GROUPS: RaviniFileGroup[] = [
  {
    id: 'grp_nida',
    name: 'NIDA',
    description: 'Vitambulisho vya Taifa, Uhakiki wa Laini na Namba za NIDA',
    icon: 'ShieldCheck'
  },
  {
    id: 'grp_uwakala',
    name: 'UWAKALA',
    description: 'Miamala ya Mitandao ya Simu na Huduma za Kifedha (Mobile Money)',
    icon: 'Wallet'
  },
  {
    id: 'grp_serikali',
    name: 'SERIKALI & NYARAKA',
    description: 'BRELA, RITA, TRA, Leseni za Biashara na Nyaraka Rasmi',
    icon: 'FileText'
  }
];

// Seed Initial Files
const DEFAULT_FILES: RaviniFile[] = [
  {
    id: 'file_nida_mitandao',
    name: 'Huduma ya NIDA',
    groupId: 'grp_nida',
    groupName: 'NIDA',
    serviceName: 'NIDA kupitia SIM',
    description: 'Kupata au kuhakiki namba ya NIDA iliyosajiliwa kwenye laini zote za simu Tanzania.',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    requiredFields: [
      { key: 'phone_number', label: 'Namba ya Simu', type: 'tel', placeholder: 'Mfano: 0712345678', required: true },
      { key: 'carrier', label: 'Mtandao', type: 'select', placeholder: 'Vodacom / Tigo / Airtel / Halotel', required: true },
      { key: 'notes', label: 'Maelezo ya Ziada', type: 'text', placeholder: 'Maelezo mafupi...' }
    ]
  },
  {
    id: 'file_nida_majina',
    name: 'NIDA KUPITIA MAJINA',
    groupId: 'grp_nida',
    groupName: 'NIDA',
    serviceName: 'NIDA kupitia Majina Kamili',
    description: 'Kutafuta namba ya NIDA kwa kutumia majina kamili, mwaka wa kuzaliwa na mkoa.',
    status: 'ACTIVE',
    createdAt: '2026-01-02T00:00:00.000Z',
    requiredFields: [
      { key: 'full_name', label: 'Majina Matatu Kamili', type: 'text', placeholder: 'Mfano: Juma Ally Mussa', required: true },
      { key: 'birth_year', label: 'Mwaka wa Kuzaliwa', type: 'number', placeholder: 'Mfano: 1995', required: true },
      { key: 'region', label: 'Mkoa wa Kuzaliwa', type: 'text', placeholder: 'Mfano: Dar es Salaam', required: true }
    ]
  },
  {
    id: 'file_uwakala_mpesa',
    name: 'UWAKALA M-PESA',
    groupId: 'grp_uwakala',
    groupName: 'UWAKALA',
    serviceName: 'Vodacom M-Pesa Wakala',
    description: 'Huduma na ukaguzi wa float, miamala na akaunti ya uwakala Vodacom.',
    status: 'ACTIVE',
    createdAt: '2026-01-03T00:00:00.000Z',
    requiredFields: [
      { key: 'agent_code', label: 'Namba ya Wakala (Till Number)', type: 'text', placeholder: 'Mfano: 123456', required: true },
      { key: 'request_type', label: 'Aina ya Huduma', type: 'text', placeholder: 'Mfano: Float Top-up / Reconciliation', required: true }
    ]
  },
  {
    id: 'file_uwakala_tigo',
    name: 'UWAKALA TIGO PESA',
    groupId: 'grp_uwakala',
    groupName: 'UWAKALA',
    serviceName: 'Tigo Pesa Wakala',
    description: 'Huduma za miamala, float na akaunti ya uwakala Mixx / Tigo Pesa.',
    status: 'ACTIVE',
    createdAt: '2026-01-04T00:00:00.000Z',
    requiredFields: [
      { key: 'agent_code', label: 'Namba ya Wakala (Tigo Till)', type: 'text', placeholder: 'Mfano: 654321', required: true }
    ]
  },
  {
    id: 'file_uwakala_airtel',
    name: 'UWAKALA AIRTEL MONEY',
    groupId: 'grp_uwakala',
    groupName: 'UWAKALA',
    serviceName: 'Airtel Money Wakala',
    description: 'Huduma za miamala na float za Airtel Money Wakala.',
    status: 'ACTIVE',
    createdAt: '2026-01-05T00:00:00.000Z',
    requiredFields: [
      { key: 'agent_code', label: 'Namba ya Wakala (Airtel Till)', type: 'text', placeholder: 'Mfano: 789012', required: true }
    ]
  },
  {
    id: 'file_rita',
    name: 'RITA / VYETI VYA KUZALIWA',
    groupId: 'grp_serikali',
    groupName: 'SERIKALI & NYARAKA',
    serviceName: 'RITA e-Services',
    description: 'Uhakiki na maombi ya vyeti vya kuzaliwa na vifo kupitia RITA.',
    status: 'ACTIVE',
    createdAt: '2026-01-06T00:00:00.000Z',
    requiredFields: [
      { key: 'child_name', label: 'Jina la Mtoto / Mhusika', type: 'text', placeholder: 'Jina Kamili', required: true },
      { key: 'parent_name', label: 'Jina la Mzazi', type: 'text', placeholder: 'Jina la Mzazi', required: true }
    ]
  },
  {
    id: 'file_brela',
    name: 'BRELA / USAJILI WA BIASHARA',
    groupId: 'grp_serikali',
    groupName: 'SERIKALI & NYARAKA',
    serviceName: 'BRELA ORS',
    description: 'Usajili na uhakiki wa majina ya biashara na makampuni Tanzania.',
    status: 'ACTIVE',
    createdAt: '2026-01-07T00:00:00.000Z',
    requiredFields: [
      { key: 'business_name', label: 'Jina la Biashara Linalopendekezwa', type: 'text', placeholder: 'Mfano: Kibo Logistics Enterprise', required: true },
      { key: 'owner_nida', label: 'NIDA ya Mmiliki', type: 'text', placeholder: 'Namba ya NIDA', required: true }
    ]
  },
  {
    id: 'file_tra',
    name: 'TRA / TIN NUMBER',
    groupId: 'grp_serikali',
    groupName: 'SERIKALI & NYARAKA',
    serviceName: 'TRA e-Tax',
    description: 'Kupata au kuhakiki namba ya mlipakodi (TIN) binafsi au biashara.',
    status: 'ACTIVE',
    createdAt: '2026-01-08T00:00:00.000Z',
    requiredFields: [
      { key: 'nida_number', label: 'Namba ya NIDA', type: 'text', placeholder: 'Namba ya NIDA', required: true }
    ]
  }
];

// Helper to broadcast custom event across browser windows & react state
function notifyStorageChange(eventName: string, payload?: any) {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Ignore in non-browser env
  }
}

// ----------------- GROUPS -----------------
export function getFileGroups(): RaviniFileGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(DEFAULT_GROUPS));
      return DEFAULT_GROUPS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_GROUPS;
  }
}

export function saveFileGroup(group: RaviniFileGroup): RaviniFileGroup {
  const groups = getFileGroups();
  const existingIndex = groups.findIndex(g => g.id === group.id);
  if (existingIndex >= 0) {
    groups[existingIndex] = group;
  } else {
    groups.push(group);
  }
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  notifyStorageChange('RAVINI_GROUPS_UPDATED', group);
  return group;
}

// ----------------- FILES -----------------
export function getPermanentFiles(): RaviniFile[] {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(DEFAULT_FILES));
      return DEFAULT_FILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FILES;
  } catch {
    return DEFAULT_FILES;
  }
}

export function getFileById(fileId: string): RaviniFile | undefined {
  const files = getPermanentFiles();
  return files.find(f => f.id === fileId);
}

export function saveFile(file: RaviniFile): RaviniFile {
  const files = getPermanentFiles();
  const existingIndex = files.findIndex(f => f.id === file.id);
  if (existingIndex >= 0) {
    files[existingIndex] = file;
  } else {
    files.unshift(file);
  }
  localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(files));
  notifyStorageChange('RAVINI_FILES_UPDATED', file);
  return file;
}

export function deleteFile(fileId: string): boolean {
  const files = getPermanentFiles();
  const filtered = files.filter(f => f.id !== fileId);
  localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(filtered));
  notifyStorageChange('RAVINI_FILES_UPDATED', { deletedId: fileId });
  return true;
}

// ----------------- ASSIGNMENTS -----------------
export function getFileAssignments(userId?: string): FileAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    const assignments: FileAssignment[] = raw ? JSON.parse(raw) : [];
    if (!userId) {
      return assignments.filter(a => a.status === 'ACTIVE');
    }
    return assignments.filter(a => a.userId === userId && a.status === 'ACTIVE');
  } catch {
    return [];
  }
}

// Get files specifically assigned to a user (Customer, Admin, or Supervisor)
export function getUserAssignedFiles(userId: string, isSuperAdmin = false): RaviniFile[] {
  const allFiles = getPermanentFiles();
  if (isSuperAdmin || userId === 'usr_baraka_mabula') {
    return allFiles.filter(f => f.status === 'ACTIVE');
  }
  const assignments = getFileAssignments(userId);
  const assignedFileIds = new Set(assignments.map(a => a.fileId));
  return allFiles.filter(f => assignedFileIds.has(f.id) && f.status === 'ACTIVE');
}

export function assignFileToUser(
  fileId: string, 
  userId: string, 
  assignedBy: string,
  userRole?: string,
  userName?: string
): { success: boolean; message: string; assignment?: FileAssignment } {
  const file = getFileById(fileId);
  if (!file) {
    return { success: false, message: 'File halikupatikana.' };
  }

  const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  let assignments: FileAssignment[] = raw ? JSON.parse(raw) : [];

  // Check if already assigned
  const existing = assignments.find(a => a.fileId === fileId && a.userId === userId && a.status === 'ACTIVE');
  if (existing) {
    return { success: false, message: 'Mtumiaji tayari amepewa File hili.' };
  }

  const newAssignment: FileAssignment = {
    id: `asgn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    fileId,
    userId,
    userRole,
    userName,
    assignedBy,
    assignedAt: new Date().toISOString(),
    status: 'ACTIVE'
  };

  assignments.push(newAssignment);
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  notifyStorageChange('RAVINI_FILE_ASSIGNMENTS_UPDATED', newAssignment);

  return { 
    success: true, 
    message: `File "${file.name}" limekabidhiwa kikamilifu!`,
    assignment: newAssignment
  };
}

export function removeFileFromUser(fileId: string, userId: string): { success: boolean; message: string } {
  const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  let assignments: FileAssignment[] = raw ? JSON.parse(raw) : [];

  let found = false;
  assignments = assignments.map(a => {
    if (a.fileId === fileId && a.userId === userId && a.status === 'ACTIVE') {
      found = true;
      return { ...a, status: 'REVOKED' as const };
    }
    return a;
  });

  if (!found) {
    return { success: false, message: 'File halikuwepo kwenye orodha ya mtumiaji huyu.' };
  }

  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  notifyStorageChange('RAVINI_FILE_ASSIGNMENTS_UPDATED', { removedFileId: fileId, userId });

  return { success: true, message: 'File limeondolewa kikamilifu kutoka kwa mtumiaji.' };
}

// ----------------- APPLICATIONS (QUEUE / RECORDS) -----------------
export function getFileApplications(fileId?: string, customerId?: string): FileApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    let apps: FileApplication[] = raw ? JSON.parse(raw) : [];
    if (fileId) {
      apps = apps.filter(a => a.fileId === fileId);
    }
    if (customerId) {
      apps = apps.filter(a => a.customerId === customerId);
    }
    return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function getApplicationById(id: string): FileApplication | undefined {
  const apps = getFileApplications();
  return apps.find(a => a.id === id);
}

export function getUserApplications(customerId: string): FileApplication[] {
  return getFileApplications(undefined, customerId);
}

export function submitFileApplication(
  fileId: string,
  customer: User,
  title: string,
  submittedData: Record<string, any>,
  description?: string
): FileApplication {
  const file = getFileById(fileId);
  const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const apps: FileApplication[] = raw ? JSON.parse(raw) : [];

  const newApp: FileApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    fileId,
    fileName: file?.name || 'File Rasmi',
    groupId: file?.groupId || 'grp_general',
    groupName: file?.groupName || 'HUDUMA',
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerRaviniId: customer.raviniId || customer.id,
    title: title || `${file?.name} - Ombi #${apps.length + 1}`,
    description,
    submittedData,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  apps.unshift(newApp);
  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
  notifyStorageChange('RAVINI_APPLICATIONS_UPDATED', newApp);

  return newApp;
}

export function updateApplicationStatus(
  applicationId: string,
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION',
  actorName: string,
  options?: {
    rejectionReason?: string;
    correctionNote?: string;
    resultSummary?: string;
    documentUrl?: string;
    referenceNumber?: string;
  }
): { success: boolean; message: string; application?: FileApplication } {
  const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
  const apps: FileApplication[] = raw ? JSON.parse(raw) : [];
  const target = apps.find(a => a.id === applicationId);

  if (!target) {
    return { success: false, message: 'Ombi halikupatikana.' };
  }

  target.status = status;
  target.updatedAt = new Date().toISOString();

  if (options?.rejectionReason) target.rejectionReason = options.rejectionReason;
  if (options?.correctionNote) target.correctionNote = options.correctionNote;

  if (status === 'APPROVED' || options?.resultSummary || options?.referenceNumber) {
    target.resultData = {
      summary: options?.resultSummary || 'Ombi limekamilika na kuidhinishwa kikamilifu.',
      documentUrl: options?.documentUrl,
      referenceNumber: options?.referenceNumber || `RVN-${Date.now().toString().slice(-6)}`,
      completedAt: new Date().toISOString(),
      processedBy: actorName
    };
  }

  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
  notifyStorageChange('RAVINI_APPLICATIONS_UPDATED', target);

  return { success: true, message: `Hali ya ombi imesasishwa kuwa: ${status}`, application: target };
}
