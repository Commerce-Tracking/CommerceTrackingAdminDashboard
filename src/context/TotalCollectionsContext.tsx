import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

interface TotalCollectionsData {
  total_collections: number;
  generated_at: string;
}

interface TotalCollectionsResponse {
  success: boolean;
  message: string;
  result: {
    success: boolean;
    data: TotalCollectionsData;
  };
  errors: any;
  except: any;
}

interface TotalCollectionsContextType {
  totalCollections: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetch: Date | null;
  isSessionExpired: boolean;
  clearError: () => void;
}

const TotalCollectionsContext = createContext<
  TotalCollectionsContextType | undefined
>(undefined);

interface TotalCollectionsProviderProps {
  children: ReactNode;
}

export const TotalCollectionsProvider: React.FC<
  TotalCollectionsProviderProps
> = ({ children }) => {
  const [totalCollections, setTotalCollections] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTotalCollections = async (forceRefresh = false) => {
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


      const res = await axiosInstance.get("/admin/stats/total-collections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const apiResponse: TotalCollectionsResponse = res.data;
        setTotalCollections(apiResponse.result.data.total_collections);
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
    await fetchTotalCollections(true);
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
        fetchTotalCollections();
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
        fetchTotalCollections(true);
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
          fetchTotalCollections(true);
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

  const value: TotalCollectionsContextType = {
    totalCollections,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
    clearError,
  };

  return (
    <TotalCollectionsContext.Provider value={value}>
      {children}
    </TotalCollectionsContext.Provider>
  );
};

export const useTotalCollections = (): TotalCollectionsContextType => {
  const context = useContext(TotalCollectionsContext);
  if (context === undefined) {
    throw new Error(
      "useTotalCollections must be used within a TotalCollectionsProvider"
    );
  }
  return context;
};
