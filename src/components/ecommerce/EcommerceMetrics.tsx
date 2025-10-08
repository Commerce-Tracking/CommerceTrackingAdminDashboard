import React from "react";
import { FileIcon, ListIcon } from "../../icons";
import { useTranslation } from "react-i18next";
import { useValidationStats } from "../../context/ValidationStatsContext";
import { XCircle, AlertTriangle } from "lucide-react";

export default function EcommerceMetrics() {
  const { t } = useTranslation();
  const { stats, loading, error, isSessionExpired } = useValidationStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
            >
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !isSessionExpired) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Si la session est expirée, ne rien afficher (redirection en cours)
  if (isSessionExpired) {
    return null;
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-center text-gray-500">
            <span>Aucune donnée disponible</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Première ligne - En attente */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* En attente (Chef d'équipe) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("pending_team_lead")}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {(stats?.pending_team_lead || 0).toLocaleString()}
            </h4>
          </div>
        </div>

        {/* En attente (Superviseur) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <FileIcon className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("pending_supervisor")}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {(stats?.pending_supervisor || 0).toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* Deuxième ligne - Rejetées */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* Rejetées (Chef d'équipe) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl dark:bg-red-900/20">
            <XCircle className="text-red-600 size-6 dark:text-red-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
              {t("rejected_by_team_lead")}
            </span>
            <h4 className="mt-2 font-bold text-red-700 text-title-sm dark:text-red-300">
              {(stats?.total_rejected_by_team_lead || 0).toLocaleString()}
            </h4>
            <div className="mt-2 flex items-center text-xs text-red-500 dark:text-red-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span className="font-medium">
                {t("rejected_collections_label")}
              </span>
            </div>
          </div>
        </div>

        {/* Rejetées (Superviseur) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-xl dark:bg-red-900/20">
            <XCircle className="text-red-600 size-6 dark:text-red-400" />
          </div>
          <div className="mt-5">
            <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
              {t("rejected_by_supervisor")}
            </span>
            <h4 className="mt-2 font-bold text-red-700 text-title-sm dark:text-red-300">
              {(stats?.total_rejected_by_supervisor || 0).toLocaleString()}
            </h4>
            <div className="mt-2 flex items-center text-xs text-red-500 dark:text-red-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span className="font-medium">
                {t("rejected_collections_label")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
