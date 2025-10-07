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
  total_collections: number;
  total_accepted_by_supervisor: number;
  total_rejected: number;
  total_rejected_by_supervisor: number;
  total_rejected_by_team_lead: number;
  pending_team_lead: number;
  pending_supervisor: number;
  total_pending: number;
  monthly_collections: Array<{
    year: number;
    month: number;
    month_name: string;
    count: number;
  }>;
  monthly_rejected: Array<{
    year: number;
    month: number;
    month_name: string;
    team_lead_rejected: number;
    supervisor_rejected: number;
    total_rejected: number;
  }>;
  monthly_accepted_by_supervisor: Array<{
    year: number;
    month: number;
    month_name: string;
    count: number;
  }>;
  generated_at: string;
  period: {
    start_date: string;
    end_date: string;
  };
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

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      console.log("🔄 Appel API validation-stats...");
      const res = await axiosInstance.get("/admin/validation-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const apiResponse: ValidationStatsResponse = res.data;
        setStats(apiResponse.result);
        setLastFetch(new Date());
        console.log(
          "✅ Données validation-stats récupérées avec succès:",
          apiResponse.result
        );
      } else {
        setError("Erreur lors de la récupération des données");
        console.error("❌ Erreur API:", res.data);
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

  useEffect(() => {
    fetchStats();
  }, []);

  const value: ValidationStatsContextType = {
    stats,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
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
