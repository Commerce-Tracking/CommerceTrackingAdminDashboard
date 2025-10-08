import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import { useTranslation } from "react-i18next";
import { useValidationStats } from "../../context/ValidationStatsContext";
import { useEffect } from "react";

export default function Home() {
  const { t } = useTranslation();
  // Garder l'utilisation du contexte pour s'assurer qu'il est initialisé
  const { loading, clearError, refetch } = useValidationStats();

  // Détecter la reconnexion et recharger les données
  useEffect(() => {
    let lastCheckTime = 0;
    const CHECK_INTERVAL = 5000; // 5 secondes minimum entre les vérifications

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();

        // Éviter les vérifications trop fréquentes
        if (now - lastCheckTime < CHECK_INTERVAL) {
          console.log("🔄 Vérification trop récente, ignorée");
          return;
        }

        lastCheckTime = now;

        // Vérifier si l'utilisateur est de retour sur la page
        const token = localStorage.getItem("accessToken");
        if (token) {
          console.log("🔄 Page visible, vérification des données...");
          // Ne recharger que si on était en état d'erreur
          clearError();
          // Le contexte gérera lui-même le rechargement si nécessaire
        }
      }
    };

    // Écouter les changements de visibilité de la page
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Écouter le focus de la fenêtre
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [clearError]);

  return (
    <div className="page-container">
      <PageMeta
        title="Commerce Tracking | Admin"
        description="Opération Fluidité Routière Agro-bétail"
      />

      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-title">
              {t("dashboard_title") || "Tableau de Bord"}
              {loading && (
                <span className="ml-2 inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
              )}
            </h1>
            <p className="page-subtitle">
              {t("dashboard_subtitle") ||
                "Vue d'ensemble des activités et statistiques"}
            </p>
          </div>
          {/* Bouton d'actualisation - désactivé pour le moment */}
          {/* <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Chargement..." : "Actualiser"}
          </button> */}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Bilan des collectes */}
        <div className="col-span-12 xl:col-span-5">
          <ErrorBoundary>
            <MonthlyTarget />
          </ErrorBoundary>
        </div>

        <div className="col-span-12 space-y-6 xl:col-span-7">
          <ErrorBoundary>
            <EcommerceMetrics />
          </ErrorBoundary>
          <ErrorBoundary>
            <MonthlySalesChart />
          </ErrorBoundary>
        </div>

        {/* Statistiques */}
        <div className="col-span-12">
          <ErrorBoundary>
            <StatisticsChart />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
