import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, ChevronLeft, CheckCircle2, Shield, MapPin, FileText, ArrowRight, UploadCloud, RefreshCw } from 'lucide-react';
import { CameraCapture } from '../components/CameraCapture';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function Registration({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [showCamera, setShowCamera] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controlled form state to preserve inputs
  const [formData, setFormData] = useState({
    name: user?.name || '',
    pmKisanId: user?.pmKisanId || '',
    village: user?.village || '',
    district: user?.district || '',
    aadhaar: '',
    otp: '',
    surveyNo: '',
    area: '',
    areaUnit: 'acres',
    crop: 'Cotton',
    file712: null as File | null,
    fileNOC: null as File | null,
    gpsLocation: ''
  });

  // Handlers
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      if (isSupabaseConfigured() && supabase) {
        try {
          // Upsert Farmer Profile
          const { data: userRow } = await supabase.from('users').upsert({
            id: user?.id,
            mobile: user?.mobile,
            name: formData.name,
            role: 'Farmer',
            pm_kisan_id: formData.pmKisanId,
            village: formData.village,
            district: formData.district,
            aadhaar_last4: formData.aadhaar.slice(-4),
          }).select().single();

          const userId = userRow?.id || user?.id;

          // Upload Documents
          let nocUrl = '';
          if (formData.fileNOC) {
            const ext = formData.fileNOC.name.split('.').pop() || 'pdf';
            const { data: uploadData } = await supabase.storage.from('documents').upload(`noc_${Date.now()}.${ext}`, formData.fileNOC);
            nocUrl = uploadData?.path || '';
          }

          let file712Url = '';
          if (formData.file712) {
            const ext = formData.file712.name.split('.').pop() || 'pdf';
            const { data: uploadData } = await supabase.storage.from('documents').upload(`712_${Date.now()}.${ext}`, formData.file712);
            file712Url = uploadData?.path || '';
          }

          // Insert Farm
          await supabase.from('farms').insert({
            user_id: userId,
            survey_no: formData.surveyNo,
            area: parseFloat(formData.area),
            area_unit: formData.areaUnit,
            primary_crop: formData.crop,
            noc_url: nocUrl,
            document_712_url: file712Url,
            gps_location: formData.gpsLocation
          });
        } catch (error) {
          console.error("Supabase error during registration", error);
        }
      } else {
        // Fallback delay if no db
        await new Promise(res => setTimeout(res, 1000));
      }
      setIsSubmitting(false);
      onComplete();
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'file712' | 'fileNOC') => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

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

  if (showCamera) {
    return (
      <CameraCapture 
        type="photo" 
        overlayText={showCamera}
        onCancel={() => setShowCamera(null)}
        onCapture={(f) => {
          console.log("Captured via camera:", f);
          setShowCamera(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-geo-bg pb-8 font-sans">
      {/* Header */}
      <div className="bg-geo-dark text-white shadow-md flex items-center justify-between sticky top-0 z-30 pt-safe h-16 px-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider leading-none">Registration</h2>
          <p className="text-[10px] opacity-70 uppercase tracking-widest mt-1 font-mono">One-Time Setup</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-geo-mid"></div>
          <span className="text-[10px] font-mono tracking-widest text-geo-mid">STEP {step}/4</span>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="bg-geo-dark text-white p-5 rounded-xl mb-6">
          <h3 className="text-[10px] font-bold uppercase mb-2 opacity-60 tracking-widest">
            {step === 1 ? "Personal Details" : step === 2 ? "Identity Verification" : step === 3 ? "Add Initial Farm" : "Legal Document"}
          </h3>
          <p className="text-xs leading-relaxed">
            {step === 1 && "Submit your personal and location details."}
            {step === 2 && "Aadhaar eKYC is required to process subsidies and carbon tracking."}
            {step === 3 && "Register the physical boundaries and details of your primary farm."}
            {step === 4 && "Upload the No-Objection Certificate allowing usage of residue for biochar."}
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-6">
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="bg-white p-5 rounded-xl border border-geo-border space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legal Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" required={step===1} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PM Kisan ID</label>
                <input type="text" value={formData.pmKisanId} onChange={e => setFormData({...formData, pmKisanId: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold font-mono tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="PK-XXXX-XXXX" required={step===1} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Village</label>
                  <input type="text" value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" required={step===1} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">District</label>
                  <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" required={step===1} />
                </div>
              </div>
            </div>
          </div>

          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="bg-white p-5 rounded-xl border border-geo-border space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Aadhaar Number</label>
                <input type="text" value={formData.aadhaar} onChange={e => setFormData({...formData, aadhaar: e.target.value})} maxLength={12} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold font-mono tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="XXXX XXXX XXXX" required={step===2} disabled={otpSent} />
              </div>
              
              {!otpSent ? (
                <button type="button" onClick={() => setOtpSent(true)} className="w-full border border-geo-dark text-geo-dark font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-geo-input transition text-center mt-2">
                  Request OTP
                </button>
              ) : (
                <div className="pt-2 border-t border-geo-border-light animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">SMS OTP</label>
                  <input type="text" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} maxLength={6} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-lg font-black tracking-[0.5em] text-center focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="••••••" required={step===2} />
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-geo-mid uppercase tracking-widest bg-[#f8faf7] p-3 rounded-lg border border-geo-border">
                    <Shield className="w-4 h-4" /> E-KYC VERIFIED
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={step === 3 ? 'block' : 'hidden'}>
            <div className="bg-white p-5 rounded-xl border border-geo-border space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Survey Number (7/12)</label>
                <input type="text" value={formData.surveyNo} onChange={e => setFormData({...formData, surveyNo: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold font-mono tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="SURVEY-XX" required={step===3} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Farm Area</label>
                  <input type="number" step="0.1" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold font-mono tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text" placeholder="0.0" required={step===3} />
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
                  <input type="file" accept=".pdf,image/*" onChange={(e) => handlePdfUpload(e, 'file712')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          <div className={step === 4 ? 'block' : 'hidden'}>
            <div className="bg-white p-5 rounded-xl border border-geo-border space-y-5">
              <div className="bg-[#fff8e6] border border-[#ffecb3] p-4 rounded-lg">
                 <p className="text-[10px] text-[#b38600] font-bold uppercase tracking-widest mb-2">Requirement</p>
                 <p className="text-xs text-[#b38600] leading-relaxed">No-Objection Certificate confirming voluntary diversion of residue from open burning is mandatory.</p>
              </div>
              
              <div className="relative w-full border border-dashed border-slate-300 bg-slate-50 hover:bg-white transition-colors p-8 rounded-lg flex flex-col items-center justify-center gap-4 text-geo-dark mt-2 overflow-hidden cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-geo-dark flex items-center justify-center shadow-sm">
                  <UploadCloud className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xs uppercase tracking-widest">
                    {formData.fileNOC ? "NOC Uploaded" : "Upload Signed NOC"}
                  </p>
                  <p className="text-[10px] mt-1 text-slate-400 uppercase font-mono tracking-tighter">
                    {formData.fileNOC ? formData.fileNOC.name : "PDF or Image allowed"}
                  </p>
                </div>
                <input type="file" accept=".pdf,image/*" onChange={(e) => handlePdfUpload(e, 'fileNOC')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={(step === 2 && !otpSent) || isSubmitting} className="w-full bg-geo-dark text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#143225] transition mt-8 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
            {isSubmitting ? (
               <><RefreshCw className="w-4 h-4 animate-spin" /> SAVING...</>
            ) : (
               <>{step < 4 ? 'Next Step' : 'Complete Registration'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

