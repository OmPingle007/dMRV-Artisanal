import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Shield, ArrowRight } from 'lucide-react';
import { Role } from '../types';

export function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<Role>('Farmer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    
    setIsLoading(true);
    // Simulate OTP / network delay
    setTimeout(() => {
      login(phone, role);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-geo-bg text-geo-text flex flex-col justify-center max-w-md mx-auto shadow-sm border-x border-geo-border">
      <div className="px-6 py-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-geo-mid text-white rounded-lg flex items-center justify-center font-bold text-2xl mb-6 shadow-sm uppercase tracking-widest">
          PF
        </div>
        <h1 className="text-sm font-bold text-geo-dark uppercase tracking-[0.2em] mb-1">PuroFarms dMRV</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 text-center max-w-[280px]">
          Field Operator App
        </p>

        <form onSubmit={handleSubmit} className="w-full bg-white p-8 rounded-xl shadow-sm border border-geo-border">
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('Farmer')}
                className={`py-3 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                  role === 'Farmer' 
                    ? 'border-geo-dark bg-geo-dark text-white' 
                    : 'border-geo-border-light text-slate-400 bg-geo-input hover:bg-white'
                }`}
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => setRole('FieldOfficer')}
                className={`py-3 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                  role === 'FieldOfficer' 
                    ? 'border-geo-dark bg-geo-dark text-white' 
                    : 'border-geo-border-light text-slate-400 bg-geo-input hover:bg-white'
                }`}
              >
                Field Officer
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-14 pr-4 py-4 bg-geo-input border border-geo-border-light rounded-lg focus:ring-1 focus:ring-geo-dark outline-none transition font-mono text-geo-text text-sm"
                placeholder="000 000 0000"
                maxLength={10}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={phone.length !== 10 || isLoading}
            className="w-full bg-geo-dark text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#143225] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Login <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            <span>Secured via PM Kisan & Aadhaar</span>
          </div>
        </form>
      </div>
    </div>
  );
}
