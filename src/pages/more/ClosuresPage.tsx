import { useState, useEffect, useCallback } from 'react';
import {
  CalendarOff,
  Plus,
  Calendar,
  History,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import {
  getGymClosures,
  getMembershipExtensions,
  calculateClosureDays,
} from '@/services/closureService';
import AddClosureModal from '@/components/closures/AddClosureModal';
import { useAuthStore } from '@/stores/authStore';
import type { DbGymClosure, DbMembershipExtension } from '@/types/database';

export default function ClosuresPage() {
  const currentPartner = useAuthStore((s) => s.currentPartner);
  const gymId = currentPartner?.gym_id || 'demo-gym-001';

  const [closures, setClosures] = useState<DbGymClosure[]>([]);
  const [extensions, setExtensions] = useState<DbMembershipExtension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'closures' | 'extensions'>('closures');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [closuresData, extensionsData] = await Promise.all([
        getGymClosures(gymId),
        getMembershipExtensions(gymId),
      ]);
      setClosures(closuresData);
      setExtensions(extensionsData);
    } catch (err) {
      console.error('Failed to load closures data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived stats
  const totalClosures = closures.length;
  const totalExtensionsGranted = extensions.length;
  const totalDaysExtended = extensions.reduce((sum, e) => sum + e.days_added, 0);

  return (
    <div className="space-y-5 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <CalendarOff className="w-6 h-6 text-rose-400" />
            <span>Gym Closures & Extensions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage holidays, festivals, and maintenance shutdowns with automatic membership extensions
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Closure</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Total Closures</span>
          <span className="text-lg sm:text-xl font-black text-slate-100 mt-1 block">
            {totalClosures}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Recorded events</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Members Extended</span>
          <span className="text-lg sm:text-xl font-black text-brand-400 mt-1 block">
            {totalExtensionsGranted}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Audit log entries</span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block">Days Credited</span>
          <span className="text-lg sm:text-xl font-black text-emerald-400 mt-1 block">
            +{totalDaysExtended} d
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Total days added</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('closures')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'closures'
              ? 'text-brand-400 border-b-2 border-brand-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Closures ({closures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('extensions')}
          className={`pb-2.5 transition flex items-center space-x-1.5 ${
            activeTab === 'extensions'
              ? 'text-brand-400 border-b-2 border-brand-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Extension Audit Logs ({extensions.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading closure records...</div>
      ) : activeTab === 'closures' ? (
        closures.length === 0 ? (
          <div className="p-8 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No gym closures recorded</p>
              <p className="text-xs text-slate-400 mt-1">
                Record upcoming festivals or maintenance to keep member memberships fair and extended.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
            >
              + Add First Closure
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {closures.map((closure) => {
              let duration = 0;
              try {
                duration = calculateClosureDays(closure.start_date, closure.end_date);
              } catch {
                duration = 1;
              }

              return (
                <div
                  key={closure.id}
                  className="p-4 bg-slate-900 border border-slate-800/90 rounded-2xl hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{closure.reason}</h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {closure.start_date} → {closure.end_date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {duration} Day{duration > 1 ? 's' : ''}
                      </span>
                      {closure.auto_extend ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Auto-extended</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          No Extension
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : extensions.length === 0 ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <History className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-200">No extensions logged yet</p>
          <p className="text-xs text-slate-400">
            When a closure is created with auto-extend enabled, each modified membership will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {extensions.map((ext) => (
            <div
              key={ext.id}
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 block">{ext.reason}</span>
                <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                  <span>{ext.previous_end.slice(0, 10)}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-emerald-400 font-semibold">{ext.new_end.slice(0, 10)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs">
                  +{ext.days_added} Days
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {new Date(ext.extended_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Closure Modal */}
      <AddClosureModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClosureAdded={loadData}
      />
    </div>
  );
}
