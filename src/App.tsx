/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { Login } from './views/Login';
import { Registration } from './views/Registration';

function Main() {
  const { user, isRegistered, setRegistered } = useAuth();

  if (!user) return <Login />;
  if (user.role === 'Farmer' && !isRegistered) return <Registration onComplete={() => setRegistered()} />;
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
