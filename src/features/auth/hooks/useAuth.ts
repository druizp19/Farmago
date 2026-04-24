import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'farmago_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Credenciales hardcodeadas (en producción deberían estar en variables de entorno)
const VALID_CREDENTIALS = {
  username: import.meta.env.VITE_AUTH_USERNAME || 'admin',
  password: import.meta.env.VITE_AUTH_PASSWORD || 'farmago2026',
};

interface AuthSession {
  username: string;
  timestamp: number;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem(AUTH_KEY);
        if (!stored) {
          setIsLoading(false);
          return;
        }

        const session: AuthSession = JSON.parse(stored);
        const now = Date.now();
        
        // Verificar si la sesión ha expirado
        if (now - session.timestamp > SESSION_DURATION) {
          localStorage.removeItem(AUTH_KEY);
          setIsAuthenticated(false);
          setCurrentUser(null);
        } else {
          setIsAuthenticated(true);
          setCurrentUser(session.username);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        localStorage.removeItem(AUTH_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    // Validar credenciales
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      const session: AuthSession = {
        username,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setCurrentUser(username);
      return true;
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    currentUser,
    login,
    logout,
  };
}
