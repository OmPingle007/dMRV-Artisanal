/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { Login } from './views/Login';
import { Registration } from './views/Registration';
import { PortalLanding } from './views/PortalLanding';
import { Role } from './types';
import { ManagementDashboard } from './views/portals/ManagementDashboard';
import { AuditorDashboard } from './views/portals/AuditorDashboard';
import { LabPortal } from './views/portals/LabPortal';

function Main() {
  const { user, isRegistered, setRegistered } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<Role | null>(null);

  // Not logged in
  if (!user) {
    if (!selectedPortal) {
      return <PortalLanding onSelectPortal={setSelectedPortal} />;
    }
    return <Login preSelectedRole={selectedPortal} onBack={() => setSelectedPortal(null)} />;
  }

  // Logged in
  if (user.role === 'Management') return <ManagementDashboard />;
  if (user.role === 'Auditor') return <AuditorDashboard />;
  if (user.role === 'LabTechnician') return <LabPortal />;

  // Farmer / FieldOfficer
  if (user.role === 'Farmer' && !isRegistered) {
    return <Registration onComplete={() => setRegistered()} />;
  }
  
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
