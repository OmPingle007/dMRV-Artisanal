import { useState } from 'react';
import { Home } from '../views/Home';
import { Batches } from '../views/Batches';
import { Profile } from '../views/Profile';
import { BatchWizard } from '../views/BatchWizard';
import { BottomNav } from './BottomNav';

export type View = 'home' | 'batches' | 'profile' | 'wizard';

export function AppLayout() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const navigateToWizard = (batchId?: string) => {
    setActiveBatchId(batchId || null);
    setCurrentView('wizard');
  };

  return (
    <div className="flex flex-col h-screen bg-geo-bg text-geo-text max-w-md mx-auto relative overflow-hidden shadow-md border-x border-geo-border antialiased font-sans">
      <main className="flex-1 overflow-y-auto pb-[68px]">
        {currentView === 'home' && <Home onStartBatch={() => navigateToWizard()} onOpenBatch={navigateToWizard} />}
        {currentView === 'batches' && <Batches onOpenBatch={navigateToWizard} />}
        {currentView === 'profile' && <Profile />}
        {currentView === 'wizard' && <BatchWizard batchId={activeBatchId} onBack={() => setCurrentView('home')} />}
      </main>
      
      {currentView !== 'wizard' && <BottomNav currentView={currentView} onViewChange={setCurrentView} />}
    </div>
  );
}
