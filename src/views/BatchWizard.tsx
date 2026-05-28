import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Camera, Video, AlertCircle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { CameraCapture } from '../components/CameraCapture';

interface BatchWizardProps {
  batchId: string | null;
  onBack: () => void;
}

export function BatchWizard({ batchId, onBack }: BatchWizardProps) {
  const { user } = useAuth();
  const [currentStepId, setCurrentStepId] = useState<string | null>(batchId ? 'PROGRESS' : 'S0');
  const [showCamera, setShowCamera] = useState<{ type: 'photo' | 'video', text: string, minDuration?: number } | null>(null);

  // Mock State for the batch
  const [batchState, setBatchState] = useState({
    id: batchId || '',
    farm: 'Farm 1 (Survey 42)',
    kiln: 'KT-300L',
    feedstock: 'Cotton Stalk',
    stepsCompleted: batchId ? ['S0'] : [] as string[],
    moisture: null as number | null,
    weight: null as number | null,
  });

  const steps = [
    { id: 'S1', title: 'Feedstock Moisture', req: '3x Readings' },
    { id: 'S2', title: 'Pre-Burn Weight', req: 'Kiln + Feedstock' },
    { id: 'S3', title: '50% Burn Photo', req: 'Visual Flames' },
    { id: 'S4', title: 'Surface Temperature', req: 'Pyrometer Reading' },
    { id: 'S5', title: '90% Burn Photo', req: 'Completion Visual' },
    { id: 'S6', title: 'Post-Quench', req: 'Steam/Wet Biochar' },
    { id: 'S7', title: 'Final Weight', req: 'Biochar Weight Photo' },
    { id: 'S8', title: 'Distribution', req: 'Field Spreading' },
    { id: 'S9', title: 'Sample Seal', req: 'Tamper-bag + ID' },
  ];

  // --- Handlers ---
  const handleS0Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `KT300-F1-CS-${new Date().toISOString().replace(/\D/g, '').slice(0,12)}`;
    setBatchState(s => ({ ...s, id: newId, stepsCompleted: ['S0'] }));
    setCurrentStepId('PROGRESS');
  };

  const markStepComplete = (id: string) => {
    setBatchState(s => ({ ...s, stepsCompleted: [...s.stepsCompleted, id] }));
    setCurrentStepId('PROGRESS');
  };

  // --- Views ---
  if (showCamera) {
    return (
      <CameraCapture 
        type={showCamera.type} 
        overlayText={showCamera.text}
        minVideoDuration={showCamera.minDuration}
        onCancel={() => setShowCamera(null)}
        onCapture={(f) => {
          console.log("Captured", f);
          setShowCamera(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-geo-bg pb-8 font-sans">
      {/* Header */}
      <div className="bg-geo-dark text-white shadow-md flex items-center gap-3 sticky top-0 z-30 pt-safe h-16 px-4">
        <button onClick={currentStepId === 'PROGRESS' || currentStepId === 'S0' ? onBack : () => setCurrentStepId('PROGRESS')} className="p-2 -ml-2 rounded flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider leading-none">
            {currentStepId === 'S0' ? 'Create Batch' : currentStepId === 'PROGRESS' ? 'Batch Progress' : `Step ${currentStepId}`}
          </h2>
          {batchState.id && <p className="text-[10px] opacity-70 uppercase tracking-widest mt-1 font-mono">{batchState.id.substring(0,18)}</p>}
        </div>
      </div>

      <div className="flex-1 p-6">
        {currentStepId === 'S0' && (
          <form onSubmit={handleS0Submit} className="space-y-6">
            <div className="bg-geo-dark text-white p-5 rounded-xl">
              <h3 className="text-[10px] font-bold uppercase mb-2 opacity-60 tracking-widest">Configuration</h3>
              <p className="text-xs leading-relaxed">Complete parameters and capture 360° visual evidence of the empty kiln to proceed.</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-geo-border space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registered Farm</label>
                <select className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text">
                  <option>Farm 1 (Survey 42) - Cotton</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kiln ID</label>
                <select className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text">
                  <option>KT-300L (Available)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Feedstock Type</label>
                <select className="w-full bg-geo-input border border-geo-border-light rounded-lg p-4 text-xs font-bold uppercase tracking-widest focus:ring-1 focus:ring-geo-dark outline-none text-geo-text">
                  <option>Cotton Stalk</option>
                  <option>Soybean Straw</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-geo-border">
              <label className="block text-[10px] font-bold text-geo-mid uppercase tracking-widest mb-4">Evidence Requirement</label>
              <button 
                type="button" 
                onClick={() => setShowCamera({ type: 'video', text: 'Record 360° video of the empty kiln', minDuration: 15 })}
                className="w-full border border-dashed border-slate-300 bg-slate-50 hover:bg-white transition-colors p-6 rounded-lg flex flex-col items-center justify-center gap-3 text-geo-dark"
              >
                <div className="w-12 h-12 rounded-full bg-geo-mid flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xs uppercase tracking-widest">Capture Video</p>
                  <p className="text-[10px] mt-1 opacity-70 font-mono tracking-tighter uppercase">Min 15s • Geo-Locked</p>
                </div>
              </button>
            </div>

            <button type="submit" className="w-full bg-geo-dark text-white font-bold p-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#143225] transition mt-2">
              Start Batch
            </button>
          </form>
        )}

        {currentStepId === 'PROGRESS' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-geo-border flex flex-col">
              <h3 className="text-[10px] font-bold text-geo-mid uppercase mb-4 tracking-widest">Current Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-l-2 border-geo-dark pl-4">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-widest">Feedstock</p>
                  <p className="text-sm font-bold text-geo-dark uppercase tracking-wider">{batchState.feedstock.split(' ')[0]}</p>
                </div>
                <div className="border-l-2 border-geo-dark pl-4">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-widest">Est. Carbon</p>
                  <p className="text-sm font-bold text-slate-400 font-mono uppercase">Awaiting</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest">Batch Steps</h3>
              
              <div className="bg-white border border-geo-border rounded-xl shadow-sm overflow-hidden flex flex-col gap-px bg-geo-border-light">
                {steps.map((step, idx) => {
                  const isCompleted = batchState.stepsCompleted.includes(step.id);
                  const prevStepId = idx === 0 ? 'S0' : steps[idx-1].id;
                  const isAvailable = batchState.stepsCompleted.includes(prevStepId);
                  const isLocked = !isAvailable && !isCompleted;

                  return (
                    <button
                      key={step.id}
                      disabled={isLocked || isCompleted}
                      onClick={() => setCurrentStepId(step.id)}
                      className={`w-full flex items-center p-5 transition-colors bg-white ${
                        isCompleted ? 'bg-geo-input' : 
                        isAvailable ? 'hover:bg-slate-50 cursor-pointer' : 
                        'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="mr-5">
                        {isCompleted ? <div className="w-8 h-8 rounded bg-geo-mid flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div> :
                         isLocked ? <div className="w-8 h-8 rounded bg-geo-input border border-geo-border-light flex items-center justify-center"><Lock className="w-4 h-4 text-slate-300" /></div> :
                         <div className="w-8 h-8 rounded bg-geo-dark flex items-center justify-center text-[10px] font-bold text-white font-mono">{idx + 1}</div>}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p className={`font-bold text-xs uppercase tracking-widest ${isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-geo-text'}`}>{step.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">{step.req}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Generic Step View (for demo purposes) */}
        {currentStepId !== 'S0' && currentStepId !== 'PROGRESS' && (
          <div className="bg-white border border-geo-border p-6 rounded-xl shadow-sm">
            <div className="mb-8">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evidence Requirement</h2>
              <h3 className="font-black text-2xl text-geo-dark leading-tight">{steps.find(s => s.id === currentStepId)?.title}</h3>
            </div>

            <button 
                type="button" 
                onClick={() => setShowCamera({ type: 'photo', text: 'Ensure details are visible in frame' })}
                className="w-full border border-dashed border-slate-300 bg-slate-50 hover:bg-white transition-colors p-8 rounded-lg flex flex-col items-center justify-center gap-4 text-geo-dark mb-8"
              >
                <div className="w-16 h-16 rounded-full bg-geo-dark flex items-center justify-center shadow-sm">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xs uppercase tracking-widest">Capture Evidence</p>
                  <p className="text-[10px] mt-1 text-slate-400 uppercase font-mono tracking-tighter">Live Camera Only</p>
                </div>
            </button>

            <button onClick={() => markStepComplete(currentStepId)} className="w-full bg-geo-dark text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#143225] transition mt-2">
              Submit Evidence
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
