import React from 'react';
import { BadgeCheck, Sparkles } from 'lucide-react';
import { User } from '../../types';

interface VerificationBadgeProps {
  user?: Partial<User> | null;
  verified?: boolean;
  status?: string;
  badgeType?: 'blue' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  user,
  verified: explicitVerified,
  status,
  badgeType: explicitBadgeType,
  size = 'sm',
  className = '',
  showLabel = false,
}) => {
  // Determine if verified from backend user state or status prop
  const isVerified = explicitVerified !== undefined 
    ? explicitVerified 
    : (status === 'verified' || Boolean(user?.verified || user?.verificationStatus === 'verified'));

  if (!isVerified) return null;

  // Determine badge type: gold for business/company, blue for individuals/creators
  const isGold = explicitBadgeType === 'gold' || 
    user?.trustBadgeType === 'gold' || 
    Boolean(user?.businessApproved) || 
    Boolean(user?.companyApproved) || 
    user?.role === 'business';

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconSize = sizeClasses[size] || sizeClasses.sm;

  if (isGold) {
    return (
      <span 
        title="Biashara/Kampuni Iliyothibitishwa Rasmi (Verified Business/Company)"
        className={`inline-flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors shrink-0 ${className}`}
      >
        <span className="relative flex items-center justify-center">
          <BadgeCheck className={`${iconSize} text-amber-500 fill-amber-100`} />
          <Sparkles className="w-1.5 h-1.5 text-amber-600 absolute" />
        </span>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
            Gold
          </span>
        )}
      </span>
    );
  }

  return (
    <span 
      title="Akaunti Iliyothibitishwa Rasmi (Verified Account)"
      className={`inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors shrink-0 ${className}`}
    >
      <BadgeCheck className={`${iconSize} text-blue-500 fill-blue-100`} />
      {showLabel && (
        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
          Blue
        </span>
      )}
    </span>
  );
};
