import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Phone, 
  MoreVertical,
  Globe2,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  User as UserIcon,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  WifiOff,
  RefreshCw,
  ServerCrash
} from 'lucide-react';
import { User } from '../../types';
import { 
  loginUser, 
  getPermanentUsers, 
  saveUserPermanent
} from '../../lib/storage';
import { Language } from '../../lib/translations';
import { safeApiFetch } from '../../lib/apiClient';

export interface SupportedCountry {
  code: string;
  name: string;
  flag: string;
  iso: string;
  placeholder: string;
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { code: '+255', name: 'Tanzania', flag: '🇹🇿', iso: 'TZ', placeholder: '748 604 483' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', iso: 'KE', placeholder: '712 345 678' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬', iso: 'UG', placeholder: '701 234 567' },
  { code: '+265', name: 'Malawi', flag: '🇲🇼', iso: 'MW', placeholder: '991 234 567' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', iso: 'ZA', placeholder: '82 123 4567' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB', placeholder: '7911 123456' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸', iso: 'US', placeholder: '202 555 0123' },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼', iso: 'RW', placeholder: '788 123 456' },
  { code: '+257', name: 'Burundi', flag: '🇧🇮', iso: 'BI', placeholder: '79 123 456' },
  { code: '+243', name: 'DR Congo', flag: '🇨🇩', iso: 'CD', placeholder: '812 345 678' },
  { code: '+260', name: 'Zambia', flag: '🇿🇲', iso: 'ZM', placeholder: '971 234 567' },
  { code: '+258', name: 'Mozambique', flag: '🇲🇿', iso: 'MZ', placeholder: '841 234 567' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', iso: 'AE', placeholder: '50 123 4567' },
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN', placeholder: '98765 43210' },
  { code: '+86', name: 'China', flag: '🇨🇳', iso: 'CN', placeholder: '138 0013 8000' },
];

interface AuthScreenProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: User) => void;
  isOnline?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  lang,
  onLanguageChange,
  onLoginSuccess,
  isOnline = true,
}) => {
  // View mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Header 3-dots dropdown menu state
  const [showMenu, setShowMenu] = useState(false);
  // Help & Support Modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  // Forgot Password Modal state (Customer Care WhatsApp)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [centralWhatsapp, setCentralWhatsapp] = useState('255748604483');

  useEffect(() => {
    NmyApiClient.getPublicConfig().then(res => {
      if (res.success && res.config?.whatsappNumber) {
        setCentralWhatsapp(res.config.whatsappNumber);
      }
    }).catch(() => {});
  }, []);

  // Form messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // --- LOGIN FORM STATE ---
  // Section 12: Country Code, Phone Number, Password. Zero role selection.
  const [loginCountryCode, setLoginCountryCode] = useState('+255');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Dedicated Network Connection Error State for Auth (Requirement 11)
  const [networkError, setNetworkError] = useState<{
    type: 'LOGIN_OFFLINE' | 'SERVER_UNREACHABLE' | 'ACTION_REQUIRES_INTERNET';
    title: string;
    message: string;
  } | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // --- REGISTRATION FORM STATE ---
  // Blueprint Section 4.C: First Name, Last Name, Business Name (Optional), Phone Number, Password. Default Role: CUSTOMER.
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+255');
  const [regPhoneDigits, setRegPhoneDigits] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Handle Login
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setNetworkError(null);

    // Requirement 11: Check if user is offline before attempting login
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setNetworkError({
        type: 'LOGIN_OFFLINE',
        title: 'Hakuna muunganisho wa intaneti',
        message: 'Unganisha Mobile Data au Wi-Fi ili kuingia kwenye RAVINI.'
      });
      return;
    }

    const cleanPhone = loginPhone.trim();
    if (!cleanPhone) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Tafadhali weka namba yako ya simu.' 
          : 'Please enter your phone number.'
      );
      return;
    }

    if (!loginPassword) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Tafadhali weka nenosiri lako.' 
          : 'Please enter your password.'
      );
      return;
    }

    // Build identifier: support typed raw phone, email, username or dial code
    let fullIdentifier = cleanPhone;
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    
    if (!cleanPhone.includes('@') && !cleanPhone.startsWith('+')) {
      const codeDigits = loginCountryCode.replace(/\D/g, '');
      if (digitsOnly.startsWith(codeDigits)) {
        fullIdentifier = `+${digitsOnly}`;
      } else if (cleanPhone.startsWith('0')) {
        fullIdentifier = `${loginCountryCode}${digitsOnly.slice(1)}`;
      } else {
        fullIdentifier = `${loginCountryCode}${digitsOnly}`;
      }
    }

    setIsSubmittingAuth(true);

    try {
      // Try backend authentication via safeApiFetch (handles timeouts, server errors, offline)
      const apiRes = await safeApiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: fullIdentifier, password: loginPassword }),
        timeoutMs: 9000
      });

      if (apiRes.isOffline) {
        setNetworkError({
          type: 'LOGIN_OFFLINE',
          title: 'Hakuna muunganisho wa intaneti',
          message: 'Unganisha Mobile Data au Wi-Fi ili kuingia kwenye RAVINI.'
        });
        setIsSubmittingAuth(false);
        return;
      }

      if (apiRes.isServerUnreachable || apiRes.isTimeout) {
        // Fallback to local stored user credentials if offline/unreachable
        const localResult = loginUser(fullIdentifier, loginPassword);
        if (localResult.success && localResult.user) {
          onLoginSuccess(localResult.user);
          setIsSubmittingAuth(false);
          return;
        }

        setNetworkError({
          type: 'SERVER_UNREACHABLE',
          title: 'RAVINI haipatikani kwa muda',
          message: 'Muunganisho wako unaonekana kuwa upo, lakini RAVINI haijaweza kupata majibu kutoka kwenye mfumo. Tafadhali jaribu tena baada ya muda mfupi.'
        });
        setIsSubmittingAuth(false);
        return;
      }

      if (apiRes.ok && apiRes.data?.user) {
        // Successful login
        saveUserPermanent(apiRes.data.user);
        onLoginSuccess(apiRes.data.user);
        setIsSubmittingAuth(false);
        return;
      }

      // If server responded with 401 or auth failure: WRONG PASSWORD (not offline!)
      if (apiRes.status === 401 || apiRes.status === 400) {
        setErrorMessage(
          lang === 'sw'
            ? 'Barua pepe, simu au nenosiri sio sahihi. Tafadhali hakiki na ujaribu tena.'
            : 'Invalid credentials. Please verify your phone number and password.'
        );
        setIsSubmittingAuth(false);
        return;
      }

      // If server responded with 403: ACCOUNT LOCKED
      if (apiRes.status === 403) {
        setErrorMessage(
          lang === 'sw'
            ? 'Akaunti hii imelemazwa (Disabled) au kufungwa na Msimamizi Mkuu.'
            : 'This account has been disabled or locked by Super Admin.'
        );
        setIsSubmittingAuth(false);
        return;
      }

      // Fallback local storage check
      const result = loginUser(fullIdentifier, loginPassword);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          result.error || 
          (lang === 'sw' ? 'Imeshindikana kuingia. Hakiki namba au nenosiri.' : 'Failed to log in. Check credentials.')
        );
      }
    } catch {
      // General safety fallback without raw stack trace
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setNetworkError({
          type: 'LOGIN_OFFLINE',
          title: 'Hakuna muunganisho wa intaneti',
          message: 'Unganisha Mobile Data au Wi-Fi ili kuingia kwenye RAVINI.'
        });
      } else {
        setErrorMessage(
          lang === 'sw' ? 'Hitilafu ya muda imetokea. Tafadhali jaribu tena.' : 'Temporary error occurred. Please try again.'
        );
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Registration (Section 11: Full Name, Country, Phone, Password, Confirm, E.164)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setNetworkError(null);

    // Check offline on registration
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setNetworkError({
        type: 'ACTION_REQUIRES_INTERNET',
        title: 'Hii huduma inahitaji intaneti',
        message: 'Unganisha Mobile Data au Wi-Fi yako ili kuendelea.'
      });
      return;
    }

    const cleanFirst = regFirstName.trim();
    const cleanLast = regLastName.trim();
    const cleanBusiness = regBusinessName.trim();
    const cleanFullName = `${cleanFirst} ${cleanLast}`.trim();
    const cleanDigits = regPhoneDigits.trim().replace(/\D/g, '');

    if (!cleanFirst) {
      setErrorMessage(lang === 'sw' ? 'Tafadhali jaza Jina la Kwanza.' : 'Please enter your first name.');
      return;
    }

    if (!cleanLast) {
      setErrorMessage(lang === 'sw' ? 'Tafadhali jaza Jina la Mwisho.' : 'Please enter your last name.');
      return;
    }

    if (!cleanDigits) {
      setErrorMessage(lang === 'sw' ? 'Tafadhali weka namba ya simu.' : 'Please enter phone number.');
      return;
    }

    if (cleanDigits.length < 7 || cleanDigits.length > 12) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Namba ya simu si sahihi. Tafadhali hakiki tarakimu zako.' 
          : 'Invalid phone number length. Please verify.'
      );
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Password lazima iwe na angalau tarakimu au herufi 4.' 
          : 'Password must be at least 4 characters.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Thibitisha password hailingani na nenosiri uliloweka.' 
          : 'Passwords do not match. Please verify.'
      );
      return;
    }

    // E.164 format: +<CountryCode><Digits> (e.g. +255748604483)
    let processedDigits = cleanDigits;
    const countryDialDigits = regCountryCode.replace(/\D/g, '');
    if (processedDigits.startsWith(countryDialDigits)) {
      processedDigits = processedDigits.slice(countryDialDigits.length);
    }
    if (processedDigits.startsWith('0')) {
      processedDigits = processedDigits.slice(1);
    }
    const e164Phone = `${regCountryCode}${processedDigits}`;

    // Check if phone already registered
    const allUsers = getPermanentUsers();
    const phoneExists = allUsers.some(u => {
      if (!u.phone) return false;
      const digits = u.phone.replace(/\D/g, '');
      const currentDigits = e164Phone.replace(/\D/g, '');
      return digits === currentDigits || (digits.length >= 9 && currentDigits.endsWith(digits.slice(-9)));
    });

    if (phoneExists) {
      setErrorMessage(
        lang === 'sw' 
          ? 'Namba hii ya simu imeshasajiliwa tayari. Tafadhali ingia au wasiliana na Huduma kwa Wateja.' 
          : 'This phone number is already registered. Please login or contact support.'
      );
      return;
    }

    // Unique username
    const baseUsername = `${cleanFirst.toLowerCase()}${cleanLast ? cleanLast.toLowerCase() : ''}`.replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const username = `${baseUsername || 'user'}${randomSuffix}`;

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: cleanFullName,
      firstName: cleanFirst,
      lastName: cleanLast,
      username: username,
      email: '',
      phone: e164Phone,
      password: regPassword,
      avatar: '',
      coverPhoto: '',
      bio: cleanBusiness ? `Jina la Biashara: ${cleanBusiness}` : '',
      location: SUPPORTED_COUNTRIES.find(c => c.code === regCountryCode)?.name || '',
      verified: false,
      role: 'customer',
      walletBalance: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString(),
      isOnline: true,
      savedPosts: [],
      followingUsers: [],
      isProfileSetupComplete: false,
      creatorApproved: false,
      businessApproved: false
    };

    saveUserPermanent(newUser);

    setSuccessMessage(
      lang === 'sw'
        ? 'Hongera! Usajili wako umekamilika. Sasa tafadhali ingia kwa kuweka namba yako ya simu na nenosiri.'
        : 'Registration successful! Please now log in using your phone number and password.'
    );

    setActiveTab('login');
    setLoginCountryCode(regCountryCode);
    setLoginPhone(processedDigits);
    setLoginPassword('');

    setRegFirstName('');
    setRegLastName('');
    setRegBusinessName('');
    setRegPhoneDigits('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const selectedCountryLogin = SUPPORTED_COUNTRIES.find(c => c.code === loginCountryCode) || SUPPORTED_COUNTRIES[0];
  const selectedCountryReg = SUPPORTED_COUNTRIES.find(c => c.code === regCountryCode) || SUPPORTED_COUNTRIES[0];

  return (
    <div id="auth-screen-container" className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-gray-900 font-sans">
      {/* Top Header: RAVINI ... (three dots) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Left: RAVINI Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-black text-xl shadow-xs border-2 border-yellow-400 relative">
            <span>R</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white"></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-red-600 tracking-tight leading-none">RAVINI</span>
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          </div>
        </div>

        {/* Right: Three Dots Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            id="auth-more-options-btn"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
            aria-label="Chaguo zaidi"
            title="Chaguo zaidi"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Three Dots Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Language Switch Section */}
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{lang === 'sw' ? 'Badilisha Lugha' : 'Change Language'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange('sw');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-red-50 transition-colors ${
                    lang === 'sw' ? 'font-bold text-red-600 bg-red-50/50' : 'text-gray-700'
                  }`}
                >
                  <span>Kiswahili</span>
                  {lang === 'sw' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onLanguageChange('en');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-red-50 transition-colors ${
                    lang === 'en' ? 'font-bold text-red-600 bg-red-50/50' : 'text-gray-700'
                  }`}
                >
                  <span>English</span>
                  {lang === 'en' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                </button>

                <div className="my-1 border-t border-gray-100" />

                {/* Help Section */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowHelpModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <HelpCircle className="w-4 h-4 text-red-600" />
                  <span>{lang === 'sw' ? 'Msaada & Huduma' : 'Help & Support'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
          {/* Dedicated Network Error Card (Requirement 11, 2, 5) */}
          {networkError && (
            <div 
              id="auth-network-error-card"
              className="mb-5 p-4 rounded-2xl bg-white border-2 border-red-600 shadow-md text-gray-900 animate-in fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  {networkError.type === 'SERVER_UNREACHABLE' ? (
                    <ServerCrash className="w-5 h-5 text-red-600 animate-pulse" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-gray-900 tracking-tight leading-tight">
                    {networkError.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    {networkError.message}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleLoginSubmit()}
                    disabled={isSubmittingAuth}
                    className="mt-3 w-full py-2 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-75"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingAuth ? 'animate-spin' : ''}`} />
                    <span>JARIBU TENA</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular Authentication Error (Wrong Password, Missing Fields) */}
          {errorMessage && !networkError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. LOGIN VIEW (Section 12: Country, Phone, Password)      */}
          {/* ========================================================= */}
          {activeTab === 'login' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight capitalize">
                  {lang === 'sw' ? 'Ingia' : 'Login'}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'sw' ? 'Weka namba yako ya simu na nenosiri kuingia' : 'Enter your phone number and password to log in'}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Field 1: Country Code & Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                  </label>
                  <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 transition-all bg-white">
                    {/* Country code selector */}
                    <div className="relative border-r border-gray-300 bg-gray-50 flex items-center">
                      <select
                        value={loginCountryCode}
                        onChange={(e) => setLoginCountryCode(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                        id="login-country-select"
                      >
                        {SUPPORTED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.name})
                          </option>
                        ))}
                      </select>
                      <div className="px-3 py-2.5 flex items-center gap-1.5 text-xs font-bold text-gray-800 pointer-events-none select-none">
                        <span>{selectedCountryLogin.flag}</span>
                        <span>{selectedCountryLogin.code}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    <input
                      type="tel"
                      id="login-phone-input"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder={selectedCountryLogin.placeholder}
                      className="flex-1 px-3.5 py-3 text-sm outline-none bg-white font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {lang === 'sw' ? `Nchi: ${selectedCountryLogin.name} (${selectedCountryLogin.code})` : `Country: ${selectedCountryLogin.name} (${selectedCountryLogin.code})`}
                  </p>
                </div>

                {/* Field 2: Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      {lang === 'sw' ? 'Nenosiri' : 'Password'}
                    </label>
                    {/* Blueprint Section 3: "Sahau Password?" (Red text) */}
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      {lang === 'sw' ? 'Sahau Password?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={lang === 'sw' ? 'Weka nenosiri lako' : 'Enter your password'}
                      className="w-full pl-3.5 pr-10 py-3 text-sm rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button: INGIA button (Red) */}
                <button
                  type="submit"
                  id="login-submit-button"
                  className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm tracking-wide rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer mt-2 uppercase"
                >
                  {lang === 'sw' ? 'INGIA' : 'LOGIN'}
                </button>
              </form>

              {/* Blueprint Section 3: "Hujasajiliwa? Jisajili hapa" (Red link) */}
              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  {lang === 'sw' ? 'Hujasajiliwa? ' : "Not registered yet? "}
                  <button
                    type="button"
                    id="switch-to-register-btn"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer ml-0.5"
                  >
                    {lang === 'sw' ? 'Jisajili hapa' : 'Register here'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. REGISTRATION VIEW: Section 4.C Customer Self-Registration */}
          {/*    First Name, Last Name, Business Name (Optional), Phone,  */}
          {/*    Password, Confirm Password. Default Role: CUSTOMER.      */}
          {/* ========================================================= */}
          {activeTab === 'register' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {lang === 'sw' ? 'Jisajili' : 'Register'}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'sw' 
                    ? 'Fungua akaunti ya Mteja (Customer) kisha uingie kwenye RAVINI.' 
                    : 'Create your Customer account and enter RAVINI.'}
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Field 1 & 2: First Name and Last Name */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'sw' ? 'Jina la Kwanza' : 'First Name'}
                    </label>
                    <input
                      type="text"
                      id="reg-firstname-input"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder={lang === 'sw' ? 'Mfano: Baraka' : 'e.g. Baraka'}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'sw' ? 'Jina la Mwisho' : 'Last Name'}
                    </label>
                    <input
                      type="text"
                      id="reg-lastname-input"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder={lang === 'sw' ? 'Mfano: Mabula' : 'e.g. Mabula'}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Field 3: Business Name (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'sw' ? 'Jina la Biashara (Hiari)' : 'Business Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    id="reg-businessname-input"
                    value={regBusinessName}
                    onChange={(e) => setRegBusinessName(e.target.value)}
                    placeholder={lang === 'sw' ? 'Mfano: Mabula Enterprises (Sio lazima)' : 'e.g. Mabula Enterprises (Optional)'}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Field 4: Country & Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'sw' ? 'Nchi & Namba ya Simu' : 'Country & Phone Number'}
                  </label>
                  <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 transition-all bg-white">
                    {/* Country Dropdown */}
                    <div className="relative border-r border-gray-300 bg-gray-50 flex items-center">
                      <select
                        value={regCountryCode}
                        onChange={(e) => setRegCountryCode(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                        id="reg-country-select"
                      >
                        {SUPPORTED_COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code} ({c.name})
                          </option>
                        ))}
                      </select>
                      <div className="px-2.5 py-2 flex items-center gap-1 text-xs font-bold text-gray-800 pointer-events-none select-none">
                        <span>{selectedCountryReg.flag}</span>
                        <span>{selectedCountryReg.code}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    <input
                      type="tel"
                      id="reg-phone-input"
                      value={regPhoneDigits}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        setRegPhoneDigits(val);
                      }}
                      placeholder={selectedCountryReg.placeholder}
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white font-mono"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {lang === 'sw' 
                      ? `Mfano wa nchi: ${selectedCountryReg.name} (${selectedCountryReg.code})` 
                      : `Selected: ${selectedCountryReg.name} (${selectedCountryReg.code})`}
                  </p>
                </div>

                {/* Field 5: Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'sw' ? 'Nenosiri' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      id="reg-password-input"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={lang === 'sw' ? 'Weka nenosiri' : 'Enter password'}
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 6: Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'sw' ? 'Thibitisha Nenosiri' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      id="reg-confirm-password-input"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder={lang === 'sw' ? 'Rudia nenosiri lako' : 'Repeat your password'}
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-gray-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button: Register */}
                <button
                  type="submit"
                  id="reg-submit-button"
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-sm rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer mt-1 uppercase"
                >
                  {lang === 'sw' ? 'JISAJILI' : 'REGISTER'}
                </button>
              </form>

              {/* Bottom: Una akaunti tayari? Ingia hapa */}
              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  {lang === 'sw' ? 'Una akaunti tayari? ' : 'Already have an account? '}
                  <button
                    type="button"
                    id="switch-to-login-btn"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer ml-1"
                  >
                    {lang === 'sw' ? 'Ingia hapa' : 'Log in here'}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Blueprint Section 3: Footer text: "RAVINI company limited" */}
      <footer className="py-4 px-6 text-center text-xs text-gray-500 border-t border-gray-200 bg-white">
        <p className="font-bold tracking-wide">RAVINI company limited</p>
      </footer>

      {/* ========================================================= */}
      {/* MODAL 1: Help & Customer Support Modal                    */}
      {/* ========================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">
                  {lang === 'sw' ? 'Msaada na Mawasiliano' : 'Help & Support'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                {lang === 'sw' 
                  ? 'Ikiwa unakumbana na changamoto yoyote ya kuingia, usajili, au unahitaji usaidizi rasmi kuhusu huduma za RAVINI, tafadhali wasiliana nasi kupitia:'
                  : 'If you need assistance logging in, registering, or general inquiries, reach our official desk:'}
              </p>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-gray-500">{lang === 'sw' ? 'Simu / WhatsApp:' : 'Phone / WhatsApp:'}</span>
                  <a href={`tel:+${centralWhatsapp.replace(/\D/g, '') || '255748604483'}`} className="font-bold text-gray-900 hover:text-red-600">
                    +{centralWhatsapp.replace(/\D/g, '') || '255748604483'}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-gray-500">{lang === 'sw' ? 'Barua Pepe:' : 'Email:'}</span>
                  <a href="mailto:support@ravini.co.tz" className="font-bold text-gray-900 hover:text-red-600">
                    support@ravini.co.tz
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${centralWhatsapp.replace(/\D/g, '') || '255748604483'}?text=${encodeURIComponent('Habari Dawati la Huduma kwa Wateja RAVINI, naomba msaada wa huduma.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'sw' ? 'Wasiliana Nasi WhatsApp' : 'Chat on WhatsApp'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Section 10: Official Customer Care WhatsApp Reset */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    {lang === 'sw' ? 'Kuweka Upya Nenosiri (Customer Care)' : 'Password Reset (Customer Care)'}
                  </h3>
                  <span className="text-[11px] text-gray-400">Dawati Rasmi la Huduma kwa Wateja RAVINI</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {lang === 'sw'
                    ? 'Kwa mujibu wa itifaki ya usalama wa RAVINI na ulinzi wa pochi ya RVC, hakuna OTP ya ujumbe mfupi (SMS). Mchakato wa kurejesha nenosiri unafanyika kwa usalama kupitia Dawati la Huduma kwa Wateja.'
                    : 'Per RAVINI security protocol and wallet protection, automated SMS OTP is not used. Password recovery is conducted securely via the Customer Care Desk.'}
                </span>
              </div>

              {/* Steps explanation */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2.5">
                <p className="font-bold text-gray-900 text-xs">
                  {lang === 'sw' ? 'Mchakato wa Kurejesha Nenosiri (Hatua 4):' : 'Password Reset Process (4 Steps):'}
                </p>
                <ol className="space-y-2 text-gray-600 text-[11px] list-decimal list-inside">
                  <li>
                    <strong className="text-gray-800">{lang === 'sw' ? 'Wasiliana na Huduma kwa Wateja' : 'Contact Customer Care'}</strong>: 
                    {lang === 'sw' ? ' Bonyeza kitufe hapa chini kufungua WhatsApp rasmi ya RAVINI.' : ' Tap the button below to reach official RAVINI WhatsApp.'}
                  </li>
                  <li>
                    <strong className="text-gray-800">{lang === 'sw' ? 'Uthibitishaji wa Umiliki' : 'Verify Ownership'}</strong>: 
                    {lang === 'sw' ? ' Afisa atathibitisha kuwa wewe ndiye mmiliki halisi wa namba au akaunti hiyo.' : ' Support staff will verify that you own the account.'}
                  </li>
                  <li>
                    <strong className="text-gray-800">{lang === 'sw' ? 'Nenosiri la Muda (1234)' : 'Temporary Password (1234)'}</strong>: 
                    {lang === 'sw' ? ' Afisa ataweka nenosiri la muda (1234) kwenye mfumo na kurekodi logi ya ukaguzi.' : ' Support resets password to temporary 1234 and logs the audit event.'}
                  </li>
                  <li>
                    <strong className="text-gray-800">{lang === 'sw' ? 'Kuweka Nenosiri Jipya' : 'Force Password Change'}</strong>: 
                    {lang === 'sw' ? ' Utaingia kwa namba yako na 1234, kisha mfumo utakutaka mara moja uweke nenosiri lako jipya la siri kabla ya kuendelea.' : ' Log in with 1234, and the system immediately prompts you to choose your private new password.'}
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <a
                  href={`https://wa.me/${centralWhatsapp.replace(/\D/g, '') || '255748604483'}?text=${encodeURIComponent(
                    lang === 'sw'
                      ? `Habari Huduma kwa Wateja RAVINI, nimesahau nenosiri la akaunti yangu ya simu ${loginCountryCode} ${loginPhone || ''}. Naomba msaada wa kurejesha nenosiri langu.`
                      : `Hello RAVINI Customer Care, I forgot the password for my account ${loginCountryCode} ${loginPhone || ''}. Please assist with a reset.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'sw' ? `Fungua WhatsApp ya Huduma kwa Wateja (${centralWhatsapp})` : `Open Customer Care WhatsApp (${centralWhatsapp})`}</span>
                </a>

                <div className="flex gap-2">
                  <a
                    href={`tel:+${centralWhatsapp.replace(/\D/g, '') || '255748604483'}`}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-600" />
                    <span>{lang === 'sw' ? 'Piga Simu' : 'Call Support'}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors text-xs cursor-pointer"
                  >
                    {lang === 'sw' ? 'Funga' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
