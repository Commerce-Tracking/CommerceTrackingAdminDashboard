import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

interface ValidationStats {
  monthly_accepted_by_supervisor: Array<{
    month: number;
    count: number;
  }>;
  monthly_rejected: Array<{
    month: number;
    total_rejected: number;
  }>;
  generated_at: string;
}

interface ValidationStatsResponse {
  success: boolean;
  message: string;
  result: ValidationStats;
  errors: any;
  except: any;
}

interface ValidationStatsContextType {
  stats: ValidationStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetch: Date | null;
  isSessionExpired: boolean;
  clearError: () => void;
}

const ValidationStatsContext = createContext<
  ValidationStatsContextType | undefined
>(undefined);

interface ValidationStatsProviderProps {
  children: ReactNode;
}

export const ValidationStatsProvider: React.FC<
  ValidationStatsProviderProps
> = ({ children }) => {
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchStats = async (forceRefresh = false) => {
    // Éviter les appels multiples simultanés
    if (isFetching) {
      console.log("Appel API déjà en cours, attente...");
      return;
    }

    // Vérifier si les données sont récentes (moins de 30 secondes)
    const now = new Date();
    if (
      !forceRefresh &&
      lastFetch &&
      now.getTime() - lastFetch.getTime() < 30000
    ) {
      console.log("Données récentes disponibles, pas de nouvel appel API");
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

      console.log("🔄 Appel API validation-stats pour les graphiques...");

      const res = await axiosInstance.get("/admin/validation-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const apiResponse: ValidationStatsResponse = res.data;
        // Ne garder que les données nécessaires pour les graphiques
        const chartData = {
          monthly_accepted_by_supervisor:
            apiResponse.result.monthly_accepted_by_supervisor || [],
          monthly_rejected: apiResponse.result.monthly_rejected || [],
          generated_at:
            apiResponse.result.generated_at || new Date().toISOString(),
        };
        setStats(chartData);
        setLastFetch(new Date());
        console.log(
          "✅ Données validation-stats pour graphiques récupérées avec succès:",
          chartData
        );
      } else {
        setError("Erreur lors de la récupération des données");
        console.error("❌ Erreur API validation-stats:", res.data);
      }
    } catch (err: any) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques de validation :",
        err
      );
      if (err.response?.status === 401) {
        console.log(
          "🔒 Session expirée, redirection vers la page de connexion..."
        );
        setIsSessionExpired(true);
        // Nettoyer le token expiré
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        // Rediriger vers la page de connexion
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
    await fetchStats(true);
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
          "🔑 Token disponible, chargement des statistiques de validation..."
        );
        fetchStats();
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
          "🔄 Nouveau token détecté, rechargement des statistiques..."
        );
        // Réinitialiser l'état d'erreur et recharger
        setError(null);
        setIsSessionExpired(false);
        fetchStats(true);
      }
    };

    // Écouter les changements de localStorage
    window.addEventListener("storage", handleStorageChange);

    // Vérifier périodiquement si un nouveau token est disponible
    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem("accessToken");

      // Ne vérifier que si on était en état d'expiration
      if (token && isSessionExpired) {
        // Vérifier si c'est un nouveau token
        if (token !== lastTokenCheck) {
          console.log("🔄 Nouveau token détecté, rechargement...");
          setLastTokenCheck(token);
          setError(null);
          setIsSessionExpired(false);
          fetchStats(true);
        }
      } else if (!token) {
        // Pas de token, réinitialiser le check
        setLastTokenCheck(null);
      }
    }, 2000); // Vérifier toutes les 2 secondes (au lieu de 1)

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkTokenInterval);
    };
  }, [isSessionExpired, lastTokenCheck]);

  const value: ValidationStatsContextType = {
    stats,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
    clearError,
  };

  return (
    <ValidationStatsContext.Provider value={value}>
      {children}
    </ValidationStatsContext.Provider>
  );
};

export const useValidationStats = (): ValidationStatsContextType => {
  const context = useContext(ValidationStatsContext);
  if (context === undefined) {
    throw new Error(
      "useValidationStats must be used within a ValidationStatsProvider"
    );
  }
  return context;
};
