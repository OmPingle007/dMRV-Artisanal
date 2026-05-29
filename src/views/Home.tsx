import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/TopBar';
import { Plus, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function Home({ onStartBatch, onOpenBatch }: { onStartBatch: () => void, onOpenBatch: (id: string) => void }) {
  const { user } = useAuth();
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchActiveBatches();
  }, [user]);

  const fetchActiveBatches = async () => {
    if (isSupabaseConfigured() && supabase && user?.id) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['IN_PROGRESS', 'WAIT_TEMP']);
          
        if (data && !error) {
          setActiveBatches(data);
        } else {
          setActiveBatches([]);
        }
      } catch (e) {
        setActiveBatches([]);
      }
      setLoading(false);
    } else if (!isSupabaseConfigured()) {
      // Dummy data only if Supabase isn't configured
      setActiveBatches([]);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-6 bg-geo-bg text-geo-text">
      <TopBar title="PuroFarms" />
      
      {/* Greeting Section */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-sm font-bold text-geo-dark uppercase tracking-widest">{getGreeting()}</h2>
        <p className="text-[10px] font-mono text-slate-400 uppercase mt-1">
          {user?.role === 'FieldOfficer' ? 'Sector 04-B: 1 Active Batch' : 'Ready to record biochar production'}
        </p>
      </div>

      {/* Start Action */}
      <div className="px-6 mb-6 mt-4">
        <button 
          onClick={onStartBatch}
          className="w-full bg-geo-dark text-white rounded-xl p-6 flex items-center justify-between shadow-sm hover:bg-[#143225] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="bg-geo-mid p-3 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs uppercase tracking-widest">Start New Batch</p>
              <p className="text-[10px] text-geo-bg mt-1 uppercase opacity-80 font-mono tracking-widest">Tracking Biochar Production</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-geo-mid" />
        </button>
      </div>

      {/* Stats Board */}
      <div className="px-6 mb-6 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-xl border border-geo-border flex flex-col">
          <h3 className="text-[10px] font-bold text-geo-mid uppercase mb-5 tracking-widest">Operator Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-l-2 border-geo-dark pl-4">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Season</p>
              <p className="text-2xl font-black text-geo-dark">12<span className="text-sm font-normal text-slate-500 ml-1">runs</span></p>
            </div>
            <div className="border-l-2 border-geo-dark pl-4">
              <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Est. Impact</p>
              <p className="text-2xl font-black text-geo-dark">4.2<span className="text-sm font-normal text-slate-500 ml-1 font-mono tracking-tighter">tCO₂</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Batches */}
      <div className="px-6 mb-2">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest">Active Batches</h3>
        <div className="space-y-4">
          {loading ? (
             <div className="bg-white p-5 border border-geo-border rounded-xl flex justify-center py-8">
               <RefreshCw className="w-5 h-5 text-geo-mid animate-spin" />
             </div>
          ) : activeBatches.length > 0 ? (
            activeBatches.map(batch => (
              <div 
                key={batch.id} 
                onClick={() => onOpenBatch(batch.batch_id || batch.id)}
                className="bg-white p-5 border border-geo-border rounded-xl shadow-sm hover:border-geo-mid transition-colors cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                   <span className="px-2 py-1 bg-[#fff8e6] text-[#b38600] border border-[#ffecb3] rounded text-[8px] font-bold uppercase tracking-widest">In Progress</span>
                </div>
                <div className="mb-5">
                  <h4 className="font-bold text-xs tracking-widest text-geo-dark uppercase">{(batch.batch_id || batch.id).substring(0,21)}..</h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-mono uppercase tracking-wider">{batch.farmer || 'Farmer'} • {batch.kiln || 'KT-300L'}</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded bg-geo-bg border border-geo-border-light flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-geo-mid">{batch.step || 'S1'}</span>
                   </div>
                   <div>
                      <h5 className="text-[10px] font-bold text-geo-text uppercase tracking-widest bg-geo-input px-2 py-0.5 rounded border border-geo-border-light w-fit">Current Step</h5>
                      <p className="text-[10px] text-slate-400 uppercase font-mono mt-1">Elapsed: {batch.age || '1h 00m'}</p>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-5 border border-geo-border rounded-xl text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">No Active Batches</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="px-6 mt-6">
         <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest">Action Required</h3>
         {loading ? null : (
           <div className="bg-[#fff1f0] border border-[#ffccc7] p-4 rounded-xl flex items-start gap-4">
              <div className="bg-white border border-[#ffccc7] p-2 rounded shrink-0">
                <AlertCircle className="w-4 h-4 text-[#cf1322]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#cf1322] mb-1">Lab Dispatch Reminder</p>
                <p className="text-[10px] text-[#a8071a] leading-relaxed">Ensure all sealed biochar samples are dispatched on time.</p>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
