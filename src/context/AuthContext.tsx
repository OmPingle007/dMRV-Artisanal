import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isRegistered: boolean;
  login: (phone: string, role: Role) => Promise<void>;
  logout: () => void;
  setRegistered: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // Check persisted user / registration on load
  useEffect(() => {
    const savedUser = localStorage.getItem('geo_user');
    const checkedRegistry = localStorage.getItem('geo_registered');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (checkedRegistry) {
      setIsRegistered(JSON.parse(checkedRegistry));
    }
  }, []);

  const login = async (phone: string, role: Role) => {
    let matchedUser = null;
    let registered = false;

    if (isSupabaseConfigured() && supabase) {
      // Find in DB
      const { data, error } = await supabase.from('users').select('*').eq('mobile', phone).maybeSingle();
      if (data && !error) {
         registered = true;
         matchedUser = {
           id: data.id,
           name: data.name,
           role: data.role as Role,
           mobile: data.mobile,
           pmKisanId: data.pm_kisan_id,
           village: data.village,
           district: data.district
         };
      }
    }

    if (!matchedUser) {
      // Mock / fallback
      matchedUser = {
        id: `usr-${Date.now()}`,
        name: role === 'Farmer' ? 'New Farmer' : 'Rahul Sharma (Field Officer)',
        role: role,
        mobile: phone,
      };
      // For fallback check local registry for the same phone
      if (localStorage.getItem(`registered_${phone}`)) {
        registered = true;
      }
    }

    setUser(matchedUser);
    setIsRegistered(registered);
    localStorage.setItem('geo_user', JSON.stringify(matchedUser));
    localStorage.setItem('geo_registered', JSON.stringify(registered));
  };

  const logout = () => {
    setUser(null);
    setIsRegistered(false);
    localStorage.removeItem('geo_user');
    localStorage.removeItem('geo_registered');
  };

  const setRegistered = () => {
    setIsRegistered(true);
    localStorage.setItem('geo_registered', JSON.stringify(true));
    if (user) {
      localStorage.setItem(`registered_${user.mobile}`, "true");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isRegistered, login, logout, setRegistered }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

