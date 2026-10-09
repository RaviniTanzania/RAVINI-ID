import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { NmyUser } from '../../types/nmyTypes';
import {
  ShieldCheck,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
  X,
  Globe,
  MessageCircle
} from 'lucide-react';

interface Props {
  onAuthenticated: (user: NmyUser) => void;
}

export const UnifiedAuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const [lang, setLang] = useState<'en' | 'sw'>('en'); // Default is English as required
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRepeatPassword, setRegRepeatPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegRepeatPassword, setShowRegRepeatPassword] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);

  // Modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [termsContent, setTermsContent] = useState<string>('');
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('255748604483');

  useEffect(() => {
    NmyApiClient.getPublicConfig().then(res => {
      if (res.success && res.config) {
        setTermsContent(res.config.termsContent);
        setRegistrationOpen(res.config.publicRegistrationOpen);
        if (res.config.whatsappNumber) {
          setWhatsappNumber(res.config.whatsappNumber);
        }
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginPhone.trim() || !loginPassword) {
      setError(
        lang === 'sw'
          ? 'Tafadhali weka namba ya simu na password.'
          : 'Please enter phone number and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await NmyApiClient.login({
        phone: loginPhone.trim(),
        password: loginPassword,
        deviceName: navigator.userAgent.includes('Mobile') ? 'Smartphone' : 'Web Device'
      });

      if (res.success && res.user) {
        onAuthenticated(res.user);
      } else {
        if (res.code === 'ACCOUNT_NOT_FOUND') {
          setError(lang === 'sw' ? 'Akaunti haipo.' : 'Account not found.');
        } else if (res.code === 'INCORRECT_PASSWORD') {
          setError(
            lang === 'sw'
              ? (res.messageSw || res.message || 'Password si sahihi.')
              : (res.messageEn || res.message || 'Incorrect password.')
          );
        } else if (res.code === 'ACCOUNT_LOCKED_TIMED') {
          setError(
            lang === 'sw'
              ? (res.messageSw || res.message || 'Akaunti imefungwa kwa muda.')
              : (res.messageEn || res.message || 'Account is temporarily locked.')
          );
        } else if (res.code === 'ACCOUNT_SUSPENDED') {
          setError(
            lang === 'sw'
              ? (res.messageSw || res.message || 'Akaunti imefungwa. Wasiliana na Uongozi wa RAVINI.')
              : (res.messageEn || res.message || 'Account is locked. Please contact RAVINI support.')
          );
        } else {
          setError(
            res.message ||
              (lang === 'sw'
                ? 'Namba ya simu au password si sahihi.'
                : 'Incorrect phone number or password.')
          );
        }
      }
    } catch {
      setError(
        lang === 'sw'
          ? 'Muunganisho wa mtandao unasumbua. Tafadhali jaribu tena.'
          : 'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!registrationOpen) {
      setError(
        lang === 'sw'
          ? 'USAJILI WA AKAUNTI MPYA UMEFUNGWA KWA SASA.'
          : 'NEW ACCOUNT REGISTRATION IS CURRENTLY CLOSED.'
      );
      return;
    }

    if (!regFullName.trim() || !regPhone.trim() || !regPassword) {
      setError(
        lang === 'sw'
          ? 'Tafadhali jaza taarifa zote zinazohitajika.'
          : 'Please fill in all required fields.'
      );
      return;
    }

    if (regPassword !== regRepeatPassword) {
      setError(lang === 'sw' ? 'Password hazifanani.' : 'Passwords do not match.');
      return;
    }

    if (regPassword.length < 4) {
      setError(
        lang === 'sw'
          ? 'Password lazima iwe na angalau herufi au tarakimu 4.'
          : 'Password must be at least 4 characters.'
      );
      return;
    }

    if (!regTermsAccepted) {
      setError(
        lang === 'sw'
          ? 'Lazima ukubaliane na Masharti ya Matumizi.'
          : 'You must accept the Terms of Service.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await NmyApiClient.register({
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        repeatPassword: regRepeatPassword,
        termsAccepted: regTermsAccepted
      });

      if (res.success) {
        setSuccessMsg(
          lang === 'sw'
            ? 'USAJILI UMEKAMILIKA. Akaunti yako imeundwa kikamilifu. Tafadhali ingia.'
            : 'REGISTRATION COMPLETE. Your account was created successfully. Please login.'
        );
        setMode('login');
        setLoginPhone(regPhone);
        setLoginPassword('');
        setRegFullName('');
        setRegPhone('');
        setRegPassword('');
        setRegRepeatPassword('');
        setRegTermsAccepted(false);
      } else {
        setError(res.message || (lang === 'sw' ? 'Hitilafu ya kusajili akaunti.' : 'Registration error.'));
      }
    } catch {
      setError(lang === 'sw' ? 'Muunganisho wa mtandao unasumbua.' : 'Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '') || '255748604483';

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] text-neutral-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Bar with Language Selector */}
      <div className="max-w-md w-full mx-auto flex justify-end pt-2 pb-1">
        <div className="inline-flex items-center gap-1 bg-white border border-neutral-200/90 rounded-full px-2.5 py-1 shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-neutral-500" />
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
              lang === 'en'
                ? 'bg-red-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            English
          </button>
          <span className="text-neutral-300 text-xs">|</span>
          <button
            type="button"
            onClick={() => setLang('sw')}
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
              lang === 'sw'
                ? 'bg-red-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Kiswahili
          </button>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto my-auto py-2">
        {/* Centered Minimal Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25 mb-3">
            <ShieldCheck className="w-9 h-9 stroke-[2.2px]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
            RAVINI
          </h1>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-neutral-200/80">
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* ==================== LOGIN FORM ==================== */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  {lang === 'sw' ? 'Namba ya simu' : 'Phone number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-phone"
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder={lang === 'sw' ? 'Weka namba ya simu' : 'Enter phone number'}
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  {lang === 'sw' ? 'Password' : 'Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder={lang === 'sw' ? 'Weka password' : 'Enter password'}
                    className="w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  {lang === 'sw' ? 'Umesahau password?' : 'Forgot password?'}
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'sw' ? 'Inaingia...' : 'Logging in...'}</span>
                  </>
                ) : (
                  <span>{lang === 'sw' ? 'INGIA' : 'LOGIN'}</span>
                )}
              </button>

              {/* Don't have an account? Sign up */}
              <div className="pt-3 border-t border-neutral-100 text-center">
                <p className="text-xs text-neutral-600">
                  {lang === 'sw' ? 'Huna akaunti?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="font-black text-red-600 hover:underline cursor-pointer ml-1"
                  >
                    {lang === 'sw' ? 'Jisajili' : 'Sign up'}
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ==================== REGISTRATION FORM ==================== */
            <div>
              <div className="mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                  {lang === 'sw' ? 'Sajili Akaunti' : 'Create Account'}
                </h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {lang === 'sw' ? 'Jina Kamili' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-reg-fullname"
                      type="text"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder={lang === 'sw' ? 'Weka jina lako kamili' : 'Enter full name'}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {lang === 'sw' ? 'Namba ya Simu' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="input-reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder={lang === 'sw' ? 'Weka namba ya simu' : 'Enter phone number'}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {lang === 'sw' ? 'Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder={lang === 'sw' ? 'Weka password' : 'Enter password'}
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {lang === 'sw' ? 'Rudia Password' : 'Repeat Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-reg-repeat-password"
                      type={showRegRepeatPassword ? 'text' : 'password'}
                      value={regRepeatPassword}
                      onChange={e => setRegRepeatPassword(e.target.value)}
                      placeholder={lang === 'sw' ? 'Rudia password' : 'Repeat password'}
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegRepeatPassword(!showRegRepeatPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegRepeatPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms agreement checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setRegTermsAccepted(!regTermsAccepted)}
                      className="mt-0.5 text-red-600 focus:outline-none cursor-pointer"
                    >
                      {regTermsAccepted ? (
                        <CheckSquare className="w-4 h-4 fill-red-600 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                    <span className="text-[11px] text-neutral-600 select-none">
                      {lang === 'sw' ? 'Nakubali ' : 'I agree to the '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        {lang === 'sw' ? 'Masharti ya Matumizi' : 'Terms of Service'}
                      </button>
                    </span>
                  </label>
                </div>

                <button
                  id="btn-submit-register"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'sw' ? 'Inasajili...' : 'Registering...'}</span>
                    </>
                  ) : (
                    <span>{lang === 'sw' ? 'JISAJILI' : 'SIGN UP'}</span>
                  )}
                </button>

                {/* Already have an account? Login */}
                <div className="pt-3 border-t border-neutral-100 text-center">
                  <p className="text-xs text-neutral-600">
                    {lang === 'sw' ? 'Una akaunti tayari?' : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="font-black text-red-600 hover:underline cursor-pointer ml-1"
                    >
                      {lang === 'sw' ? 'Ingia' : 'Log in'}
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Clean bottom empty space to balance viewport */}
      <div className="py-2" />

      {/* Forgotten Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black text-neutral-900 uppercase">
                  {lang === 'sw' ? 'Usaidizi wa Password' : 'Password Recovery'}
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {lang === 'sw'
                ? 'Ili kulinda usalama wa akaunti yako na salio lako, wasiliana na huduma kwa wateja ya RAVINI kurejesha password yako.'
                : 'To protect your account security and balances, please contact RAVINI customer support to reset your password.'}
            </p>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
              <span className="font-bold text-neutral-800">
                {lang === 'sw' ? 'Namba ya Usaidizi:' : 'Support Contact:'}
              </span>
              <p className="font-mono text-xs text-neutral-900 font-bold">+{cleanWhatsapp}</p>
            </div>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                lang === 'sw'
                  ? 'Habari RAVINI, nimesahau password ya akaunti yangu. Naomba msaada wa kurejesha.'
                  : 'Hello RAVINI, I forgot my account password. Please assist me with recovery.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'sw' ? 'WASILIANA NA HUDUMA KWA WATEJA' : 'CONTACT CUSTOMER SUPPORT'}</span>
            </a>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              {lang === 'sw' ? 'Funga' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-100 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-neutral-900 uppercase">
                {lang === 'sw' ? 'Masharti ya Matumizi' : 'Terms of Service'}
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto text-xs text-neutral-600 space-y-2.5 pr-1 flex-1 py-2">
              <p>{termsContent || (lang === 'sw' ? 'Huduma inatolewa chini ya miongozo na usalama wa RAVINI.' : 'Service provided under RAVINI security and operational terms.')}</p>
              <p>1. {lang === 'sw' ? 'Mtumiaji anathibitisha kuwa taarifa zote anazoomba ni halali.' : 'User confirms that all requested information is lawful and authentic.'}</p>
              <p>2. {lang === 'sw' ? 'Salio la Credit huongezwa baada ya uthibitisho wa malipo.' : 'Credit balance is added following verified payment.'}</p>
              <p>3. {lang === 'sw' ? 'Ombi likishindikana, Credit uliyolipa inarejeshwa kwenye akaunti yako kiotomatiki.' : 'If a request fails or is rejected, deducted Credit is automatically refunded.'}</p>
              <p>4. {lang === 'sw' ? 'Taarifa zote zinalindwa chini ya mfumo thabiti wa RAVINI.' : 'All data is strictly safeguarded under RAVINI.'}</p>
            </div>

            <button
              onClick={() => setShowTermsModal(false)}
              className="mt-4 w-full py-2.5 bg-neutral-900 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {lang === 'sw' ? 'NIMEELEWA' : 'I UNDERSTAND'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAuthScreen;
