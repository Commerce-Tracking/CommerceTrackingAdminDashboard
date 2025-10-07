import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axios";
import {
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface ExportResponse {
  success: boolean;
  message: string;
  data: string;
  filename: string;
  totalRecords: number;
  mimeType: string;
  fileSize: number;
}

export default function CSVExportPage() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      console.log("🚀 Début de l'export CSV...");

      const response = await axiosInstance.post("/admin/export-csv");

      console.log("✅ Réponse API reçue:", response.data);

      if (response.data.success) {
        setExportResult(response.data);

        // Créer et télécharger le fichier CSV
        const blob = new Blob([response.data.data], {
          type: response.data.mimeType || "text/csv",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = response.data.filename || "export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log("📁 Fichier téléchargé:", response.data.filename);
      } else {
        setError(response.data.message || "Erreur lors de l'export");
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de l'export CSV:", err);

      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        // Nettoyer le token expiré
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        // Rediriger vers la page de connexion
        window.location.href = "/signin";
        return;
      } else if (err.response?.status === 403) {
        setError(
          "Vous n'avez pas les permissions pour effectuer cette action."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Erreur lors de l'export des données"
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("csv_export_title")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("csv_export_subtitle")}
          </p>
        </div>

        {/* Export Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("export_collections_data")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t("export_description")}
              </p>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  isExporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                } transition-colors duration-200`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    {t("exporting")}
                  </>
                ) : (
                  <>
                    <Download className="-ml-1 mr-3 h-5 w-5" />
                    {t("export_csv")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t("export_error")}
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {exportResult && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    {t("export_success")}
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                      {t("export_success_message", {
                        filename: exportResult.filename,
                      })}
                    </p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="font-medium">
                          {t("total_records")}:
                        </span>
                        <span className="ml-1">
                          {exportResult.totalRecords.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t("file_size")}:</span>
                        <span className="ml-1">
                          {formatFileSize(exportResult.fileSize)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t("file_type")}:</span>
                        <span className="ml-1">{exportResult.mimeType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information Section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t("export_info_title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("included_data")}
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t("collection_info")}</li>
                  <li>• {t("product_info")}</li>
                  <li>• {t("transport_details")}</li>
                  <li>• {t("geographic_flow")}</li>
                  <li>• {t("commercial_values")}</li>
                  <li>• {t("physical_metrics")}</li>
                  <li>• {t("customs_info")}</li>
                  <li>• {t("logistics_points")}</li>
                  <li>• {t("financial_details")}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t("file_format")}
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t("csv_format")}</li>
                  <li>• {t("utf8_encoding")}</li>
                  <li>• {t("comma_separated")}</li>
                  <li>• {t("excel_compatible")}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Fields Section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t("sample_fields")}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("field_examples")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
