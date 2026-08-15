import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthResponse, AuthState, LoginPayload, RegisterPayload, User } from "../types/auth";
import api from "../services/api";

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("crediwise_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("crediwise_token");
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Re-validate session with backend on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("crediwise_token");
      if (storedToken) {
        try {
          const freshUser = await api.auth.getMe();
          setUser(freshUser);
          localStorage.setItem("crediwise_user", JSON.stringify(freshUser));
        } catch {
          // Token invalid or expired
          localStorage.removeItem("crediwise_token");
          localStorage.removeItem("crediwise_user");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for global 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("crediwise_unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("crediwise_unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem("crediwise_token", response.access_token);
      localStorage.setItem("crediwise_user", JSON.stringify(response.user));
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await api.auth.register(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem("crediwise_token", response.access_token);
      localStorage.setItem("crediwise_user", JSON.stringify(response.user));
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("crediwise_token");
    localStorage.removeItem("crediwise_user");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const freshUser = await api.auth.getMe();
      setUser(freshUser);
      localStorage.setItem("crediwise_user", JSON.stringify(freshUser));
      return freshUser;
    } catch {
      logout();
      return null;
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
