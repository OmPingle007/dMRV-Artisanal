import { Shield, LayoutDashboard, TestTube2, Sprout } from 'lucide-react';
import { Role } from '../types';

interface PortalLandingProps {
  onSelectPortal: (role: Role) => void;
}

export function PortalLanding({ onSelectPortal }: PortalLandingProps) {
  return (
    <div className="min-h-screen bg-geo-bg text-geo-text flex flex-col justify-center max-w-md mx-auto shadow-sm border-x border-geo-border p-6">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-geo-dark text-white rounded-lg flex items-center justify-center font-bold text-2xl mb-6 shadow-sm uppercase tracking-widest">
          PF
        </div>
        <h1 className="text-xl font-bold text-geo-dark uppercase tracking-[0.2em] mb-2">PuroFarms dMRV</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
          Decentralized MRV Platform
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Access Portal</h2>

        <button 
          onClick={() => onSelectPortal('Farmer')}
          className="w-full bg-white p-5 rounded-xl border border-geo-border flex items-center gap-4 hover:border-geo-mid transition-colors group text-left"
        >
          <div className="w-12 h-12 bg-geo-input rounded-full flex items-center justify-center group-hover:bg-geo-dark group-hover:text-white transition-colors text-geo-dark shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm text-geo-dark mb-1">Field Operator</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Farmers & Field Officers</p>
          </div>
        </button>

        <button 
          onClick={() => onSelectPortal('Management')}
          className="w-full bg-white p-5 rounded-xl border border-geo-border flex items-center gap-4 hover:border-geo-mid transition-colors group text-left"
        >
          <div className="w-12 h-12 bg-geo-input rounded-full flex items-center justify-center group-hover:bg-geo-mid group-hover:text-white transition-colors text-geo-dark shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm text-geo-dark mb-1">Management</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Platform Admin & Operations</p>
          </div>
        </button>

        <button 
          onClick={() => onSelectPortal('Auditor')}
          className="w-full bg-white p-5 rounded-xl border border-geo-border flex items-center gap-4 hover:border-[#1E40AF] transition-colors group text-left"
        >
          <div className="w-12 h-12 bg-geo-input rounded-full flex items-center justify-center group-hover:bg-[#1E40AF] group-hover:text-white transition-colors text-[#1E40AF] shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm text-[#1E40AF] mb-1">Auditor (VVB)</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Third-Party Verification</p>
          </div>
        </button>

        <button 
          onClick={() => onSelectPortal('LabTechnician')}
          className="w-full bg-white p-5 rounded-xl border border-geo-border flex items-center gap-4 hover:border-[#6B21A8] transition-colors group text-left"
        >
          <div className="w-12 h-12 bg-geo-input rounded-full flex items-center justify-center group-hover:bg-[#6B21A8] group-hover:text-white transition-colors text-[#6B21A8] shrink-0">
            <TestTube2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm text-[#6B21A8] mb-1">Lab Technician</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Sample Report Upload</p>
          </div>
        </button>
      </div>
    </div>
  );
}
