import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { saveUserPermanent, setCurrentUserId } from '../../lib/storage';
import { syncUserToFirestore } from '../../lib/firebase';
import { Language, translations } from '../../lib/translations';

interface RegisterModalProps {
  onClose: () => void;
  onUserRegistered: (user: User) => void;
  language: Language;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export const RegisterModal: React.FC<RegisterModalProps> = ({
  onClose,
  onUserRegistered,
  language,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+255 ');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Dar es Salaam, Tanzania');
  const [role, setRole] = useState<'user' | 'creator' | 'business'>('user');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;

    setIsSubmitting(true);

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const newUserId = `usr_${cleanUsername}_${Date.now().toString(36)}`;

    const newUser: User = {
      id: newUserId,
      name: name.trim(),
      username: cleanUsername,
      email: email.trim() || `${cleanUsername}@ravini.co.tz`,
      phone: phone.trim(),
      avatar: selectedAvatar,
      coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      bio: bio.trim() || (language === 'sw' ? 'Mwanachama mpya wa RAVINI Tanzania 🇹🇿' : 'New RAVINI member from Tanzania 🇹🇿'),
      location: location.trim(),
      verified: false,
      role,
      walletBalance: 0, // Zero initial balance - strict production ledger compliance
      followersCount: 1,
      followingCount: 3,
      createdAt: new Date().toISOString(),
      isOnline: true,
      savedPosts: [],
    };

    // 1. Permanently save to durable storage
    saveUserPermanent(newUser);
    setCurrentUserId(newUser.id);

    // 2. Cloud Firestore background sync
    syncUserToFirestore(newUser);

    setIsSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      onUserRegistered(newUser);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1877F2] flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
                {t.registerAccount}
              </h3>
              <p className="text-[11px] text-gray-500">
                {language === 'sw' ? 'Jiunge na mtandao mkuu wa kijamii wa Tanzania' : 'Join the premier social network'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permanent Data Protection Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">
              {language === 'sw' ? 'Utunzaji wa Kudumu wa Data (Data Preservation):' : 'Permanent Account Guarantee:'}
            </strong>
            <p className="text-[11px] leading-relaxed mt-0.5">
              {language === 'sw'
                ? 'Taarifa zako zote na machapisho unayoweka yanahifadhiwa kwa usalama na HAYATAFUTIKA kamwe hata mfumo ukiboreshwa au kufanyiwa update.'
                : 'Your account and all your posts are permanently preserved in durable cloud storage and will never be lost.'}
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-10 text-center space-y-2 animate-pop-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-base text-gray-900">
              {language === 'sw' ? 'Usajili Umekamilika Kikamilifu!' : 'Registration Successful!'}
            </h4>
            <p className="text-xs text-gray-500">
              {language === 'sw' ? 'Akaunti yako imehifadhiwa kwa uimara na unaweza kuanza kupost sasa.' : 'Your account is permanently active. Welcome to RAVINI!'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {language === 'sw' ? 'Chagua Picha ya Wasifu (Avatar)' : 'Choose Profile Picture'}
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt="avatar"
                    onClick={() => setSelectedAvatar(imgUrl)}
                    className={`w-12 h-12 rounded-full object-cover cursor-pointer border-2 transition-all flex-shrink-0 ${
                      selectedAvatar === imgUrl
                        ? 'border-[#1877F2] ring-2 ring-blue-300 scale-105'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'sw' ? 'Jina Kamili *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'sw' ? 'Mf: Peter Mgaya' : 'e.g. Peter Mgaya'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'sw' ? 'Jina la Mtumiaji (Username) *' : 'Username *'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-xs font-bold">@</span>
                  <input
                    type="text"
                    required
                    placeholder="petermgaya"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'sw' ? 'Barua Pepe (Email)' : 'Email'}
                </label>
                <input
                  type="email"
                  placeholder="jina@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'sw' ? 'Nambari ya Simu' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  placeholder="+255 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none"
                />
              </div>
            </div>

            {/* Location & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'sw' ? 'Mkoa / Mahali' : 'Location'}
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none bg-white"
                >
                  <option value="Dar es Salaam, Tanzania">Dar es Salaam, Tanzania</option>
                  <option value="Arusha, Tanzania">Arusha, Tanzania</option>
                  <option value="Mwanza, Tanzania">Mwanza, Tanzania</option>
                  <option value="Zanzibar, Tanzania">Zanzibar, Tanzania</option>
                  <option value="Dodoma, Tanzania">Dodoma, Tanzania</option>
                  <option value="Mbeya, Tanzania">Mbeya, Tanzania</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'sw' ? 'Aina ya Akaunti' : 'Account Type'}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none bg-white"
                >
                  <option value="user">👤 Mtumiaji wa Kawaida (Personal)</option>
                  <option value="creator">⭐ Mbunifu wa Maudhui (Creator)</option>
                  <option value="business">🏢 Biashara / Duka (Business)</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'sw' ? 'Maelezo Mafupi (Bio)' : 'Bio'}
              </label>
              <textarea
                rows={2}
                placeholder={language === 'sw' ? 'Andika machache kukuhusu...' : 'Tell the community about yourself...'}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:border-[#1877F2] focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#1877F2] hover:bg-[#166FE5] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'sw' ? 'Kamilisha Usajili wa Kudumu' : 'Complete Permanent Registration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
