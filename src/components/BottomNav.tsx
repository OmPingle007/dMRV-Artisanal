import { Home, Layers, User } from 'lucide-react';
import { View } from './AppLayout';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export function BottomNav({ currentView, onViewChange }: { currentView: View, onViewChange: (v: View) => void }) {
  const { user } = useAuth();
  
  // Field Officer might have a 'Farmers' tab in a full implementation,
  // but keeping it simple based on instructions.
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'batches', icon: Layers, label: 'Batches' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="absolute bottom-0 w-full bg-white border-t border-geo-border grid grid-cols-3 h-[68px] pb-safe z-40 shrink-0">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id as View)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors border-b-4",
              isActive 
                ? "bg-geo-input border-geo-dark" 
                : "border-transparent hover:bg-geo-input"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive ? "text-geo-dark" : "text-slate-400")} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn(
               "text-[10px] font-bold uppercase tracking-widest mt-0.5",
               isActive ? "text-geo-dark" : "text-slate-400"
            )}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  );
}
