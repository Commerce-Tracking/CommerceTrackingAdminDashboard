import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";

interface PendingCollectionsData {
  pending_team_lead: number;
  pending_supervisor: number;
  total_pending: number;
  generated_at: string;
}

interface PendingCollectionsResponse {
  success: boolean;
  message: string;
  result: {
    success: boolean;
    data: PendingCollectionsData;
  };
  errors: any;
  except: any;
}

interface PendingCollectionsContextType {
  pendingTeamLead: number | null;
  pendingSupervisor: number | null;
  totalPending: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetch: Date | null;
  isSessionExpired: boolean;
  clearError: () => void;
}

const PendingCollectionsContext = createContext<
  PendingCollectionsContextType | undefined
>(undefined);

interface PendingCollectionsProviderProps {
  children: ReactNode;
}

export const PendingCollectionsProvider: React.FC<
  PendingCollectionsProviderProps
> = ({ children }) => {
  const [pendingTeamLead, setPendingTeamLead] = useState<number | null>(null);
  const [pendingSupervisor, setPendingSupervisor] = useState<number | null>(
    null
  );
  const [totalPending, setTotalPending] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [lastTokenCheck, setLastTokenCheck] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchPendingCollections = async (forceRefresh = false) => {
    // Éviter les appels multiples simultanés
    if (isFetching) {
      console.log("Appel API pending déjà en cours, attente...");
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
        "Données pending récentes disponibles, pas de nouvel appel API"
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

      console.log("🔄 Appel API pending...");
      const res = await axiosInstance.get("/admin/stats/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const apiResponse: PendingCollectionsResponse = res.data;
        setPendingTeamLead(apiResponse.result.data.pending_team_lead);
        setPendingSupervisor(apiResponse.result.data.pending_supervisor);
        setTotalPending(apiResponse.result.data.total_pending);
        setLastFetch(new Date());
        console.log(
          "✅ Données pending récupérées avec succès:",
          apiResponse.result.data
        );
      } else {
        setError("Erreur lors de la récupération des données");
        console.error("❌ Erreur API pending:", res.data);
      }
    } catch (err: any) {
      console.error(
        "❌ Erreur lors de la récupération des collectes en attente :",
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
    await fetchPendingCollections(true);
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
          "🔑 Token disponible, chargement des collectes en attente..."
        );
        fetchPendingCollections();
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
          "🔄 Nouveau token détecté, rechargement des collectes en attente..."
        );
        setError(null);
        setIsSessionExpired(false);
        fetchPendingCollections(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem("accessToken");
      if (token && isSessionExpired) {
        if (token !== lastTokenCheck) {
          console.log(
            "🔄 Token disponible après expiration, rechargement pending..."
          );
          setLastTokenCheck(token);
          setError(null);
          setIsSessionExpired(false);
          fetchPendingCollections(true);
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

  const value: PendingCollectionsContextType = {
    pendingTeamLead,
    pendingSupervisor,
    totalPending,
    loading,
    error,
    refetch,
    lastFetch,
    isSessionExpired,
    clearError,
  };

  return (
    <PendingCollectionsContext.Provider value={value}>
      {children}
    </PendingCollectionsContext.Provider>
  );
};

export const usePendingCollections = (): PendingCollectionsContextType => {
  const context = useContext(PendingCollectionsContext);
  if (context === undefined) {
    throw new Error(
      "usePendingCollections must be used within a PendingCollectionsProvider"
    );
  }
  return context;
};
