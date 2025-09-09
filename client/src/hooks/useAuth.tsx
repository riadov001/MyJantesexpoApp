import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { apiGet } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("myjantes_token");
    const savedUser = localStorage.getItem("myjantes_user");
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Verify token is still valid by making a test request
        apiGet("/api/auth/me")
          .then((freshUserData: unknown) => {
            const userData = freshUserData as User;
            setUser(userData);
            localStorage.setItem("myjantes_user", JSON.stringify(userData));
            setIsLoading(false);
          })
          .catch(() => {
            // Token is invalid, clear storage
            localStorage.removeItem("myjantes_token");
            localStorage.removeItem("myjantes_user");
            setUser(null);
            setIsLoading(false);
          });
      } catch (error) {
        localStorage.removeItem("myjantes_token");
        localStorage.removeItem("myjantes_user");
        setUser(null);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("myjantes_token", token);
    localStorage.setItem("myjantes_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("myjantes_token");
    localStorage.removeItem("myjantes_user");
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem("myjantes_user", JSON.stringify(userData));
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}