import { useEffect, useState } from "react";
import axios from "../../api/axios.ts";
import AuthContext from "../../context/AuthContext.tsx";
import axiosInstance from "../../api/axios.ts";
import { Link, useNavigate } from "react-router";

export default function AuthProvider({ children }) {
  let [accessToken, setAccessToken] = useState(null);
  let [refreshToken, setRefreshToken] = useState(null);
  let [userInfo, setUserInfo] = useState(null);
  let [userData, setUserData] = useState(null);
  let [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem("userInfo");
      const storedUserData = localStorage.getItem("userData");
      const storedAccessToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserInfo(parsedUser);
          // @ts-ignore
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          // @ts-ignore
          setAccessToken(storedAccessToken);
          // @ts-ignore
          setRefreshToken(storedRefreshToken);
        } catch (e) {
          console.error("Impossible de parser userInfo");
          localStorage.removeItem("userInfo");
          localStorage.removeItem("userData");
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password, navigate) => {
    try {
      console.log("Tentative de connexion avec:", {
        username,
        password: "***",
      });
      const res = await axiosInstance.post("/auth/login", {
        username,
        password,
      });
      console.log("LOGIN DATA: ");
      console.log(res.data);
      console.log("Status HTTP:", res.status);

      if (res.data.success === true) {
        const result = res.data.result;
        const user = result.user;
        const accessToken = result.access_token;
        const refreshToken = result.refresh_token;

        setUserInfo(user);
        setRefreshToken(refreshToken);
        setAccessToken(accessToken);

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userInfo", JSON.stringify(user));

        console.log("Connexion réussie !");
        return { success: true, message: res.data.message, result };
      } else {
        console.log("Connexion échouée !");
        return {
          success: false,
          message: res.data.message || res.data.errors || "Connexion échouée",
        };
      }
    } catch (err: any) {
      console.error("Login error", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Erreur de connexion",
      };
    }
  };

  const authMe = async (id: any) => {
    try {
      console.log("Access Token", accessToken);
      const user = await axiosInstance.get(`/auth/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: false,
      });
      const u = user.data.result; // Utiliser 'result' au lieu de 'data'
      setUserData(u);
      localStorage.setItem("userData", JSON.stringify(u));

      console.log("Connecté !");
    } catch (error) {
      // @ts-ignore
      console.error("Error", error.response?.data || error.message);
      // @ts-ignore
      if (error.response?.status === 401) {
        navigate("/signin");
      }
    }
  };

  const getUserInfos = async (id: any) => {
    try {
      const user = await axiosInstance.get(`/users/${id}`, {
        withCredentials: true,
      });
      const userInfo = user.data.data;
      setUserInfo(userInfo);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      console.log("Récupérée !");
    } catch (err) {
      // @ts-ignore
      console.error("Error", err.response?.data || err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo"); // 👈 aussi
    setUserInfo(null);
  };

  const refresh = async () => {
    try {
      const res = await axios.post("/auth/refresh", {
        refreshToken: localStorage.getItem("refreshToken"),
      });
      localStorage.setItem("accessToken", res.data.accessToken);
    } catch (err) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        userData,
        accessToken,
        refreshToken,
        login,
        logout,
        authMe,
        getUserInfos,
        isLoading,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
