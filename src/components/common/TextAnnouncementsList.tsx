import React, { useState, useEffect } from 'react';
import { Megaphone, ChevronDown, ChevronUp, Bell, Clock } from 'lucide-react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { NmyAnnouncement } from '../../types/nmyTypes';
import { formatDateTimeSeconds } from '../../utils/dateUtils';

export const TextAnnouncementsList: React.FC = () => {
  const [announcements, setAnnouncements] = useState<NmyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadActiveAnnouncements();
  }, []);

  const loadActiveAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await NmyApiClient.getActiveAnnouncements();
      if (res.success && res.announcements) {
        setAnnouncements(res.announcements);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading || announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-3">
      {announcements.map((ann) => {
        const isExpanded = expandedId === ann.id;
        const isLong = ann.message.length > 120;

        return (
          <div
            key={ann.id}
            className="bg-white rounded-2xl p-4 border border-amber-200/80 bg-gradient-to-r from-amber-50/60 to-white shadow-xs space-y-2 animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-[9px] uppercase tracking-wider">
                      Tangazo Rasmi
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 inline" />
                      {formatDateTimeSeconds(ann.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-neutral-900 mt-1 leading-snug">
                    {ann.title}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap pl-9">
              {isLong && !isExpanded ? `${ann.message.substring(0, 120)}...` : ann.message}
            </p>

            {isLong && (
              <div className="pl-9 pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Soma kidogo' : 'Soma yote'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
