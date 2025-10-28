import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

interface MonthlyCollection {
  year: number;
  month: number;
  month_name: string;
  count: number;
}

interface MonthlyCollectionsData {
  monthly_collections: MonthlyCollection[];
  period: {
    start_date: string;
    end_date: string;
  };
  generated_at: string;
}

interface MonthlyCollectionsResponse {
  success: boolean;
  message: string;
  result: {
    success: boolean;
    data: MonthlyCollectionsData;
  };
  errors: any;
  except: any;
}

interface MonthlyCollectionsContextType {
  monthlyCollections: MonthlyCollection[] | null;
  period: { start_date: string; end_date: string } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetch: Date | null;
  isSessionExpired: boolean;
  clearError: () => void;
}

const MonthlyCollectionsContext = createContext<
  MonthlyCollectionsContextType | undefined
>(undefined);

interface MonthlyCollectionsProviderProps {
  children: ReactNode;
}

export const MonthlyCollectionsProvider: React.FC<
  MonthlyCollectionsProviderProps
> = ({ children }) => {
  const [monthlyCollections, setMonthlyCollections] = useState<
    MonthlyCollection[] | null
  >(null);
  const [period, setPeriod] = useState<{
    start_date: string;
    end_date: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchMonthlyCollections = async (forceRefresh = false) => {
    // Éviter les appels multiples simultanés
    if (isFetching) {
      console.log("Appel API monthly-collections déjà en cours, attente...");
      return;
    }

    // Vérifier si les données sont récentes (moins de 30 secondes)
    const now = new Date();
    if (
      !forceRefresh &&
      lastFetch &&
      now.getTime() - lastFetch.getTime() < 30000
    ) {
      console.log(
        "Données monthly-collections récentes disponibles, pas de nouvel appel API"
      );
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

      console.log("🔄 Appel API monthly-collections...");
      const res = await axiosInstance.get("/admin/stats/monthly-collections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const apiResponse: MonthlyCollectionsResponse = res.data;
        setMonthlyCollections(apiResponse.result.data.monthly_collections);
        setPeriod(apiResponse.result.data.period);
        setLastFetch(new Date());
        console.log(
          "✅ Données monthly-collections récupérées avec succès:",
          apiResponse.result.data
        );
      } else {
        setError("Erreur lors de la récupération des données");
        console.error("❌ Erreur API monthly-collections:", res.data);
      }
    } catch (err: any) {
      console.error(
        "❌ Erreur lors de la récupération des collectes mensuelles :",
        err
      );
      if (err.response?.status === 401) {
        console.log(
          "🔒 Session expirée, redirection vers la page de connexion..."
        );
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
    await fetchMonthlyCollections(true);
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
        console.log(
          "🔑 Token disponible, chargement des collectes mensuelles..."
        );
        fetchMonthlyCollections();
      } else {
        console.log("⏳ Token non disponible, attente...");
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
        console.log(
          "🔄 Nouveau token détecté, rechargement des collectes mensuelles..."
        );
        setError(null);
        setIsSessionExpired(false);
        fetchMonthlyCollections(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem("accessToken");
      if (token && isSessionExpired) {
        if (token !== lastTokenCheck) {
          console.log(
            "🔄 Token disponible après expiration, rechargement monthly-collections..."
          );
          setLastTokenCheck(token);
          setError(null);
          setIsSessionExpired(false);
          fetchMonthlyCollections(true);
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

  const value: MonthlyCollectionsContextType = {
    monthlyCollections,
    period,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
    clearError,
  };

  return (
    <MonthlyCollectionsContext.Provider value={value}>
      {children}
    </MonthlyCollectionsContext.Provider>
  );
};

export const useMonthlyCollections = (): MonthlyCollectionsContextType => {
  const context = useContext(MonthlyCollectionsContext);
  if (context === undefined) {
    throw new Error(
      "useMonthlyCollections must be used within a MonthlyCollectionsProvider"
    );
  }
  return context;
};
