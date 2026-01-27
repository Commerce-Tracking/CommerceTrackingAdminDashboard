import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

interface RejectedByLevelData {
  total_rejected: number;
  total_rejected_by_supervisor: number;
  total_rejected_by_team_lead: number;
  generated_at: string;
}

interface RejectedByLevelResponse {
  success: boolean;
  message: string;
  result: {
    success: boolean;
    data: RejectedByLevelData;
  };
  errors: any;
  except: any;
}

interface RejectedByLevelContextType {
  totalRejected: number | null;
  totalRejectedBySupervisor: number | null;
  totalRejectedByTeamLead: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetch: Date | null;
  isSessionExpired: boolean;
  clearError: () => void;
}

const RejectedByLevelContext = createContext<
  RejectedByLevelContextType | undefined
>(undefined);

interface RejectedByLevelProviderProps {
  children: ReactNode;
}

export const RejectedByLevelProvider: React.FC<
  RejectedByLevelProviderProps
> = ({ children }) => {
  const [totalRejected, setTotalRejected] = useState<number | null>(null);
  const [totalRejectedBySupervisor, setTotalRejectedBySupervisor] = useState<
    number | null
  >(null);
  const [totalRejectedByTeamLead, setTotalRejectedByTeamLead] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRejectedByLevel = async (forceRefresh = false) => {
    // Éviter les appels multiples simultanés
    if (isFetching) {
      return;
    }

    // Vérifier si les données sont récentes (moins de 30 secondes)
    const now = new Date();
    if (
      !forceRefresh &&
      lastFetch &&
      now.getTime() - lastFetch.getTime() < 30000
    ) {
      setLoading(false);
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      setIsSessionExpired(false);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const res = await axiosInstance.get("/admin/stats/rejected-by-level", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const apiResponse: RejectedByLevelResponse = res.data;
        setTotalRejected(apiResponse.result.data.total_rejected);
        setTotalRejectedBySupervisor(
          apiResponse.result.data.total_rejected_by_supervisor
        );
        setTotalRejectedByTeamLead(
          apiResponse.result.data.total_rejected_by_team_lead
        );
        setLastFetch(new Date());
      } else {
        setError("Erreur lors de la récupération des données");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setIsSessionExpired(true);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        navigate("/signin");
        return;
      } else {
        setError(err.message || "Erreur lors de la récupération des données");
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const refetch = async () => {
    await fetchRejectedByLevel(true);
  };

  const clearError = () => {
    setError(null);
    setIsSessionExpired(false);
  };

  useEffect(() => {
    // Attendre que le token soit disponible avant de faire l'appel API
    const checkTokenAndFetch = () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        fetchRejectedByLevel();
      } else {
        // Réessayer après 1 seconde (plus long pour être sûr)
        setTimeout(checkTokenAndFetch, 1000);
      }
    };

    // Démarrer la vérification après un petit délai pour laisser le temps au token d'être stocké
    setTimeout(checkTokenAndFetch, 100);
  }, []);

  // Surveiller les changements de token pour recharger après reconnexion
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" && e.newValue) {
        setError(null);
        setIsSessionExpired(false);
        fetchRejectedByLevel(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem("accessToken");
      if (token && isSessionExpired) {
        if (token !== lastTokenCheck) {
          setLastTokenCheck(token);
          setError(null);
          setIsSessionExpired(false);
          fetchRejectedByLevel(true);
        }
      } else if (!token) {
        setLastTokenCheck(null);
      }
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkTokenInterval);
    };
  }, [isSessionExpired, lastTokenCheck]);

  const value: RejectedByLevelContextType = {
    totalRejected,
    totalRejectedBySupervisor,
    totalRejectedByTeamLead,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
    clearError,
  };

  return (
    <RejectedByLevelContext.Provider value={value}>
      {children}
    </RejectedByLevelContext.Provider>
  );
};

export const useRejectedByLevel = (): RejectedByLevelContextType => {
  const context = useContext(RejectedByLevelContext);
  if (context === undefined) {
    throw new Error(
      "useRejectedByLevel must be used within a RejectedByLevelProvider"
    );
  }
  return context;
};
