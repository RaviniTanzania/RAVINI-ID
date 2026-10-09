import React, { useState, useEffect } from 'react';
import { NmyApiClient } from '../../lib/nmyApiClient';
import { useToast } from '../common/Toast';
import { formatDateTimeSeconds } from '../../utils/dateUtils';
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const RevenueAndReportsCenter: React.FC<Props> = ({ onBack }) => {
  const toast = useToast();
  const [period, setPeriod] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);

  useEffect(() => {
    loadRevenue();
  }, [period]);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const customDates = customStartDate ? { startDate: customStartDate, endDate: customEndDate } : undefined;
      const res = await NmyApiClient.getRevenueHistory(period, customDates);
      if (res.success) {
        setRevenueData(res);
      }
    } catch {
      toast.error('Hitilafu ya kupata historia ya mapato.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type: string) => {
    const url = NmyApiClient.getReportDownloadUrl(type);
    window.location.href = url;
    toast.success(`Upakuaji wa ripoti ya ${type} umeanza.`, '📊 Ripoti Inapakuliwa');
  };

  const periodLabels: Record<string, string> = {
    today: 'Leo',
    yesterday: 'Jana',
    this_week: 'Wiki Hii',
    last_week: 'Wiki Iliyopita',
    this_month: 'Mwezi Huu',
    last_month: 'Mwezi Uliopita',
    this_year: 'Mwaka Huu'
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
          onClick={loadRevenue}
          disabled={loading}
          className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Title Card */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-neutral-900 uppercase">
              HISTORIA YA MAPATO NA RIPOTI (REVENUE CENTER)
            </h2>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full">
            REAL PRODUCTION DATA
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          Uchambuzi wa mapato halisi kulingana na miamala ya mfumo. Hakuna takwimu bandia.
        </p>

        {/* Periods Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPeriod(key);
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                period === key && !customStartDate
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Selector (DD/MM/YYYY) */}
        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-neutral-700 text-[11px] uppercase">Chagua Tarehe:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-[11px]">Kuanzia:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-[11px]">Hadi:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-red-500"
            />
          </div>
          <button
            type="button"
            onClick={loadRevenue}
            disabled={!customStartDate}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Chuja kwa Tarehe
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      {revenueData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-200">
            <span className="text-[10px] font-bold text-neutral-500 uppercase block">Mapato Halisi (Net)</span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5">
              TSh {revenueData.summary.netRevenueTzs.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Jumla Iliyotozwa</span>
            <span className="text-sm font-black text-neutral-900 block mt-0.5">
              TSh {revenueData.summary.totalRevenueTzs.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Marejesho (Refunds)</span>
            <span className="text-sm font-bold text-red-600 block mt-0.5">
              TSh {revenueData.summary.totalRefundsTzs.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Idadi ya Miamala</span>
            <span className="text-sm font-black text-neutral-900 block mt-0.5">
              {revenueData.summary.transactionCount} maombi
            </span>
          </div>
        </div>
      )}

      {/* Excel / CSV Downloads */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-neutral-900 uppercase flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Pakua Ripoti za Excel (.xlsx / .csv)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleDownload('revenue')}
            className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 text-left flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Ripoti ya Mapato (Revenue Ledger)</span>
              <span className="text-[10px] text-neutral-500">Miamala yote ya Credit na malipo</span>
            </div>
            <Download className="w-4 h-4 text-neutral-600" />
          </button>

          <button
            type="button"
            onClick={() => handleDownload('requests')}
            className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 text-left flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Ripoti ya Maombi ya NIDA</span>
              <span className="text-[10px] text-neutral-500">Maombi yote, hali zao na matokeo</span>
            </div>
            <Download className="w-4 h-4 text-neutral-600" />
          </button>

          <button
            type="button"
            onClick={() => handleDownload('users')}
            className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 text-left flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Ripoti ya Watu na Watumiaji</span>
              <span className="text-[10px] text-neutral-500">Wateja wote na Admins</span>
            </div>
            <Download className="w-4 h-4 text-neutral-600" />
          </button>

          <button
            type="button"
            onClick={() => handleDownload('audit')}
            className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-2xl border border-neutral-200 text-left flex items-center justify-between cursor-pointer"
          >
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Ripoti ya Ukaguzi (Audit Trail)</span>
              <span className="text-[10px] text-neutral-500">Matukio yote ya kiusalama na uongozi</span>
            </div>
            <Download className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {revenueData && (
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-neutral-900 uppercase">
            Miamala ya Hivi Karibuni ({periodLabels[period] || period})
          </h3>
          {revenueData.transactions.length === 0 ? (
            <p className="text-xs text-neutral-400">Hakuna muamala kwa kipindi hiki.</p>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
              {revenueData.transactions.map((t: any) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-800 block">{t.reason}</span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {formatDateTimeSeconds(t.timestamp)} • {t.reference}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-black ${
                        t.type === 'CHARGE' ? 'text-neutral-900' : 'text-emerald-600'
                      }`}
                    >
                      {t.type === 'CHARGE' ? '+' : '-'}TSh {t.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      Aina: {t.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
