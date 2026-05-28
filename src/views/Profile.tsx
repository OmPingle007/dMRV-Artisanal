import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/TopBar';
import { User, LogOut, FileText, Phone, MapPin, BadgeCheck, Settings, Book, UploadCloud, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function Profile() {
  const { user, logout } = useAuth();
  const [addingFarm, setAddingFarm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);

  useEffect(() => {
    fetchFarms();
  }, [user]);

  const fetchFarms = async () => {
    if (isSupabaseConfigured() && supabase && user?.id) {
      setLoadingFarms(true);
      try {
        const { data, error } = await supabase.from('farms').select('*').eq('user_id', user.id);
        if (error) {
          console.error("Supabase fetch error:", error);
          const msg = error.code === 'PGRST205'
            ? 'Tables are missing in Supabase! Please run the SQL commands from supabase_schema.sql in your Supabase SQL Editor.'
            : `Could not fetch data: ${error.message}`;
          alert(msg);
        } else if (data) {
          setFarms(data);
        }
      } catch (e) {
        console.error("Failed to fetch farms", e);
      }
      setLoadingFarms(false);
    }
  };

  const [formData, setFormData] = useState({
    surveyNo: '',
    area: '',
    areaUnit: 'acres',
    crop: 'Cotton',
    file712: null as File | null,
    gpsLocation: ''
  });

  const getGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setFormData({ ...formData, gpsLocation: `${position.coords.latitude}, ${position.coords.longitude}` }),
        (error) => alert(`Error getting GPS: ${error.message}`)
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, file712: e.target.files[0] });
    }
  };

  const submitNewFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (isSupabaseConfigured() && supabase) {
      try {
        let file712Url = '';
        if (formData.file712) {
          const ext = formData.file712.name.split('.').pop() || 'pdf';
          const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(`712_${Date.now()}.${ext}`, formData.file712);
          if (uploadError) {
             console.error("Storage upload error:", uploadError);
             alert(`Could not upload document: ${uploadError.message}`);
          }
          file712Url = uploadData?.path || '';
        }

        const { error: dbError } = await supabase.from('farms').insert({
          user_id: user?.id,
          survey_no: formData.surveyNo,
          area: parseFloat(formData.area),
          area_unit: formData.areaUnit,
          primary_crop: formData.crop,
          document_712_url: file712Url,
          gps_location: formData.gpsLocation
        });
        
        if (dbError) {
           console.error("Supabase insert error:", dbError);
           alert(`Database error: ${dbError.message}`);
        } else {
           await fetchFarms();
        }
      } catch (error) {
        console.error("Failed to add farm", error);
      }
    } else {
      // Mock flow disabled
      alert("Supabase not configured, cannot save farm.");
    }
    setIsSubmitting(false);
    setAddingFarm(false);
    setFormData({
      surveyNo: '', area: '', areaUnit: 'acres', crop: 'Cotton', file712: null, gpsLocation: ''
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-geo-bg pb-6">
      <TopBar title="Profile" showSync={false} />
      
      <div className="p-6">
        <div className="bg-white rounded-xl p-6 border border-geo-border flex items-center gap-5">
          <div className="w-16 h-16 bg-geo-dark rounded flex items-center justify-center text-white">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-geo-text uppercase tracking-widest">{user?.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-geo-input border border-geo-border-light text-geo-dark text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                {user?.role}
              </span>
              <span className="bg-[#f6ffed] border border-[#d9f7be] text-[#389e0d] text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> VERIFIED
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl border border-geo-border overflow-hidden">
          <div className="flex items-center gap-4 p-5 border-b border-geo-border-light">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mobile Access</p>
              <p className="text-xs font-bold font-mono text-geo-text">+91 {user?.mobile.replace(/(\d{5})(\d{5})/, '$1 $2')}</p>
            </div>
          </div>
          {user?.pmKisanId && (
            <div className="flex items-center gap-4 p-5 border-b border-geo-border-light">
              <FileText className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PM Kisan Registration</p>
                <p className="text-xs font-bold font-mono text-geo-text">{user.pmKisanId}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 p-5">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p>
              <p className="text-xs font-bold text-geo-text uppercase tracking-widest">{user?.village}, {user?.district}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-4 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-geo-mid uppercase tracking-widest">My Farms</h3>
          {!addingFarm && (
            <button onClick={() => setAddingFarm(true)} className="text-[10px] font-bold text-geo-dark uppercase tracking-widest bg-geo-input px-3 py-1 rounded border border-geo-border-light hover:bg-[#e2e8e4] transition text-center flex items-center gap-1">
              + Add Farm
            </button>
          )}
        </div>

        {addingFarm ? (
          <form onSubmit={submitNewFarm} className="bg-white p-5 rounded-xl border border-geo-border space-y-5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest">New Farm Details</h4>
              <button type="button" onClick={() => setAddingFarm(false)} className="text-[10px] text-slate-400 uppercase font-bold hover:text-geo-dark">Cancel</button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Survey Number (7/12)</label>
              <input type="text" value={formData.surveyNo} onChange={e => setFormData({...formData, surveyNo: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold font-mono tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="SURVEY-XX" required />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Farm Area</label>
                <input type="number" step="0.1" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold font-mono tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="0.0" required />
              </div>
              <div className="w-28">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                 <select value={formData.areaUnit} onChange={e => setFormData({...formData, areaUnit: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text">
                   <option value="acres">Acres</option>
                   <option value="hectares">Hectares</option>
                 </select>
              </div>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Crop</label>
               <select value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text">
                 <option>Cotton</option>
                 <option>Soybean</option>
                 <option>Wheat</option>
               </select>
            </div>
            
            <div className="pt-4 grid gap-3">
              <button type="button" onClick={getGPSLocation} className={`w-full border border-dashed transition-colors p-4 rounded-lg flex items-center justify-center gap-3 ${formData.gpsLocation ? 'border-geo-dark bg-[#f6ffed] text-geo-dark' : 'border-slate-300 bg-slate-50 hover:bg-white text-geo-dark'}`}>
                <MapPin className="w-5 h-5 text-geo-mid" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {formData.gpsLocation ? 'GPS Captured' : 'Capture GPS Boundary'}
                </span>
              </button>
              <div className="relative w-full border border-dashed border-slate-300 bg-slate-50 hover:bg-white transition-colors p-4 rounded-lg flex items-center justify-center gap-3 text-geo-dark cursor-pointer overflow-hidden">
                <UploadCloud className="w-5 h-5 text-geo-mid" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {formData.file712 ? formData.file712.name : "Upload 7/12 Extract (PDF/Img)"}
                </span>
                <input type="file" accept=".pdf,image/*" onChange={handlePdfUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-geo-dark text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#143225] transition mt-2 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
               {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> SAVING...</> : "Save Farm"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {loadingFarms ? (
              <div className="bg-white rounded-xl border border-geo-border p-5 flex items-center justify-center">
                 <RefreshCw className="w-5 h-5 text-geo-mid animate-spin" />
              </div>
            ) : farms.length > 0 ? (
              farms.map((farm, i) => (
                <div key={farm.id || i} className="bg-white rounded-xl border border-geo-border overflow-hidden p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-geo-border-light pb-3">
                    <div>
                      <p className="text-xs font-bold text-geo-text uppercase tracking-widest">Farm {i + 1} ({farm.survey_no || 'Survey'})</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">{farm.area} {farm.area_unit} • {farm.primary_crop}</p>
                    </div>
                    <span className="bg-[#f6ffed] border border-[#d9f7be] text-[#389e0d] text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                      Active
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-geo-border p-5 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                No farms registered yet
              </div>
            )}
          </div>
        )}

        <div className="mt-8 mb-4">
          <h3 className="text-[10px] font-bold text-geo-mid uppercase tracking-widest">Settings</h3>
        </div>

        <div className="bg-white rounded-xl border border-geo-border overflow-hidden">
           <button className="w-full flex items-center justify-between p-5 border-b border-geo-border-light hover:bg-geo-input transition text-left">
             <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded bg-geo-input flex items-center justify-center">
                 <Book className="w-4 h-4 text-geo-dark" />
               </div>
               <span className="text-[10px] font-bold text-geo-text uppercase tracking-widest">Audit Logs</span>
             </div>
           </button>
           <button className="w-full flex items-center justify-between p-5 border-b border-geo-border-light hover:bg-geo-input transition text-left">
             <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded bg-geo-input flex items-center justify-center">
                 <Settings className="w-4 h-4 text-geo-dark" />
               </div>
               <span className="text-[10px] font-bold text-geo-text uppercase tracking-widest">Language</span>
             </div>
             <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">EN-IN</span>
           </button>
           <button 
             onClick={logout}
             className="w-full flex items-center gap-4 p-5 hover:bg-[#fff1f0] transition text-left text-[#cf1322] group"
           >
             <div className="w-8 h-8 rounded bg-[#fff1f0] flex items-center justify-center">
               <LogOut className="w-4 h-4 text-[#cf1322]" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest">Log Out</span>
           </button>
        </div>

        <div className="mt-8 text-center border-t border-geo-border pt-6">
          <p className="text-[10px] text-slate-400 font-mono font-bold">PUROFARMS CORE // v1.2.0.42</p>
        </div>
      </div>
    </div>
  );
}
