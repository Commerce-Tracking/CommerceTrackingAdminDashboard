import { createContext } from "react";

interface AuthContextType {
  userInfo: any;
  userData: any;
  accessToken: string | null;
  refreshToken: string | null;
  login: (username: string, password: string, navigate?: any) => Promise<any>;
  logout: () => void;
  authMe: (id: any) => Promise<void>;
  getUserInfos: (id: any) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
