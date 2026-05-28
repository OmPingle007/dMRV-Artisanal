import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/TopBar';
import { Search, Filter, ShieldCheck, Clock, FileWarning, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cn } from '../lib/utils';

export function Batches({ onOpenBatch }: { onOpenBatch: (id: string) => void }) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, [user]);

  const fetchBatches = async () => {
    if (isSupabaseConfigured() && supabase && user?.id) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .eq('user_id', user.id);
          
        if (data && !error) {
          setBatches(data);
        } else {
          setBatches([]);
        }
      } catch (e) {
        setBatches([]);
      }
      setLoading(false);
    } else if (!isSupabaseConfigured()) {
      setBatches([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return { label: 'In Progress', icon: Clock, class: 'bg-gray-100 text-gray-700 border-gray-200' };
      case 'SAMPLE_SEALED': return { label: 'Sample Sealed', icon: ShieldCheck, class: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'APPROVED': return { label: 'Approved', icon: ShieldCheck, class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'UNDER_REVIEW': return { label: 'Under Review', icon: Clock, class: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { label: status, icon: Clock, class: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-geo-bg pb-6">
      <TopBar title="Batches" showSync={false} />
      
      <div className="p-6 pb-4 sticky top-[64px] z-30 bg-geo-bg">
        <h3 className="text-[10px] font-bold text-geo-mid uppercase mb-4 tracking-widest">Search & Filter</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="ID OR FARMER..."
            className="w-full bg-geo-input border border-geo-border-light rounded-lg pl-10 pr-10 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-geo-dark shadow-sm text-geo-text"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {loading ? (
          <div className="bg-white p-5 border border-geo-border rounded-xl flex justify-center py-8">
            <RefreshCw className="w-5 h-5 text-geo-mid animate-spin" />
          </div>
        ) : batches.length > 0 ? (
          batches.map((batch) => {
            const badge = getStatusBadge(batch.status);
            
            return (
              <div 
                key={batch.id} 
                onClick={() => onOpenBatch(batch.id)}
                className="bg-white p-5 border border-geo-border rounded-xl shadow-sm hover:border-geo-mid cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-4 mt-1">
                    <h4 className="font-mono text-[10px] font-bold text-geo-dark truncate uppercase tracking-widest">{batch.batch_id || batch.id}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{batch.farmer || 'Unknown Farmer'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-geo-input">
                  <div className="flex items-center gap-2 border-l-2 border-geo-dark pl-3">
                    <p className="text-xl font-black text-geo-text leading-none">
                      {batch.tco2e || '-'} 
                      <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest ml-1 bg-geo-input px-1 py-0.5 rounded border border-geo-border-light">tCO₂</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-2 py-0.5 bg-geo-input text-slate-600 border border-geo-border-light rounded text-[8px] font-bold uppercase tracking-widest">
                      {badge.label}
                    </span>
                    {batch.flag && (
                      <span className="px-2 py-0.5 bg-[#fff1f0] text-[#cf1322] border border-[#ffccc7] rounded text-[8px] font-bold uppercase tracking-widest">
                        FLAGGED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white p-5 border border-geo-border rounded-xl text-center">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">No Batches Found</p>
          </div>
        )}
      </div>
    </div>
  );
}
