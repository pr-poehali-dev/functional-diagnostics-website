import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const AUTH_API = 'https://functions.poehali.dev/cb9f0144-d0fa-40cf-ad86-40d1679b4f73';

type Doctor = {
  id: number;
  email: string;
  full_name: string;
  specialization: string | null;
  signature_url: string | null;
  created_at: string | null;
};

type AuthContextType = {
  doctor: Doctor | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, specialization?: string) => Promise<void>;
  logout: () => void;
  updateDoctor: (updates: Partial<Doctor>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedDoctor = localStorage.getItem('doctor_data');

    if (storedToken && storedDoctor) {
      setToken(storedToken);
      setDoctor(JSON.parse(storedDoctor));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка авторизации');
    }

    const data = await response.json();
    setToken(data.token);
    setDoctor(data.doctor);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('doctor_data', JSON.stringify(data.doctor));
  };

  const register = async (email: string, password: string, fullName: string, specialization?: string) => {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        email,
        password,
        full_name: fullName,
        specialization: specialization || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка регистрации');
    }

    const data = await response.json();
    setToken(data.token);
    setDoctor(data.doctor);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('doctor_data', JSON.stringify(data.doctor));
  };

  const logout = () => {
    setToken(null);
    setDoctor(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('doctor_data');
  };

  const updateDoctor = (updates: Partial<Doctor>) => {
    if (doctor) {
      const updatedDoctor = { ...doctor, ...updates };
      setDoctor(updatedDoctor);
      localStorage.setItem('doctor_data', JSON.stringify(updatedDoctor));
    }
  };

  return (
    <AuthContext.Provider value={{ doctor, token, isLoading, login, register, logout, updateDoctor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
