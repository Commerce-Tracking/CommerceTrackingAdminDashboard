import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

interface AcceptedBySupervisorData {
  total_accepted_by_supervisor: number;
  generated_at: string;
}

interface AcceptedBySupervisorResponse {
  success: boolean;
  message: string;
  result: {
    success: boolean;
    data: AcceptedBySupervisorData;
  };
  errors: any;
  except: any;
}

interface AcceptedBySupervisorContextType {
  totalAcceptedBySupervisor: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetch: Date | null;
  isSessionExpired: boolean;
  clearError: () => void;
}

const AcceptedBySupervisorContext = createContext<
  AcceptedBySupervisorContextType | undefined
>(undefined);

interface AcceptedBySupervisorProviderProps {
  children: ReactNode;
}

export const AcceptedBySupervisorProvider: React.FC<
  AcceptedBySupervisorProviderProps
> = ({ children }) => {
  const [totalAcceptedBySupervisor, setTotalAcceptedBySupervisor] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAcceptedBySupervisor = async (forceRefresh = false) => {
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

      const res = await axiosInstance.get(
        "/admin/stats/accepted-by-supervisor",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        const apiResponse: AcceptedBySupervisorResponse = res.data;
        setTotalAcceptedBySupervisor(
          apiResponse.result.data.total_accepted_by_supervisor
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
    await fetchAcceptedBySupervisor(true);
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
        fetchAcceptedBySupervisor();
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
        fetchAcceptedBySupervisor(true);
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
          fetchAcceptedBySupervisor(true);
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

  const value: AcceptedBySupervisorContextType = {
    totalAcceptedBySupervisor,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
    clearError,
  };

  return (
    <AcceptedBySupervisorContext.Provider value={value}>
      {children}
    </AcceptedBySupervisorContext.Provider>
  );
};

export const useAcceptedBySupervisor = (): AcceptedBySupervisorContextType => {
  const context = useContext(AcceptedBySupervisorContext);
  if (context === undefined) {
    throw new Error(
      "useAcceptedBySupervisor must be used within an AcceptedBySupervisorProvider"
    );
  }
  return context;
};
