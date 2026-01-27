import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axios";
import * as XLSX from "xlsx";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

interface ExportResponse {
  success: boolean;
  message: string;
  data: string;
  filename: string;
  totalRecords: number;
  mimeType: string;
  fileSize: number;
  encoding?: string;
}

export default function CSVExportPage() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fonction pour définir des dates par défaut (30 derniers jours)
  const setDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const endDateStr = today.toISOString().split("T")[0];
    const startDateStr = thirtyDaysAgo.toISOString().split("T")[0];

    setEndDate(endDateStr);
    setStartDate(startDateStr);
  };

  // Définir les dates par défaut au chargement du composant
  React.useEffect(() => {
    setDefaultDateRange();
  }, []);

  // Handlers pour les changements de dates
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // Fonction pour ouvrir le sélecteur de date
  const openDatePicker = (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      // Essayer d'ouvrir le sélecteur natif, sinon focuser l'input
      try {
        // Focuser d'abord l'input
        input.focus();

        // Puis essayer d'ouvrir le sélecteur
        if (input.showPicker) {
          // Petit délai pour s'assurer que le focus est établi
          setTimeout(() => {
            input.showPicker();
          }, 10);
        }
      } catch (error) {
        // Fallback: juste focuser l'input
        input.focus();
      }
    }
  };

  // Fonction pour décoder le base64 en Excel
  const decodeBase64ToExcel = (base64Data: string): Blob => {
    // Décoder le base64 en binaire
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  // Fonction pour convertir CSV ou données en Excel (fallback si nécessaire)
  const convertDataToExcel = (data: any): Blob => {
    let workbook: XLSX.WorkBook;
    let worksheet: XLSX.WorkSheet;

    // Vérifier le type de données reçu
    if (data === null || data === undefined) {
      // Créer une feuille vide avec un message
      worksheet = XLSX.utils.aoa_to_sheet([["Aucune donnée disponible"]]);
    } else if (Array.isArray(data)) {
      // Si c'est un tableau d'objets JSON
      if (data.length === 0) {
        worksheet = XLSX.utils.aoa_to_sheet([["Aucune donnée disponible"]]);
      } else if (
        data.length > 0 &&
        typeof data[0] === "object" &&
        !Array.isArray(data[0]) &&
        data[0] !== null
      ) {
        // Convertir les objets en tableau de tableaux
        const headers = Object.keys(data[0]);
        const rows = data.map((obj) => headers.map((key) => obj[key] || ""));
        worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      } else {
        // Si c'est déjà un tableau de tableaux
        worksheet = XLSX.utils.aoa_to_sheet(data);
      }
    } else if (typeof data === "string") {
      // Si c'est une chaîne CSV
      if (data.trim() === "") {
        worksheet = XLSX.utils.aoa_to_sheet([["Aucune donnée disponible"]]);
      } else {
        try {
          // Essayer de parser comme CSV avec XLSX
          const csvWorkbook = XLSX.read(data, { type: "string" });
          worksheet = csvWorkbook.Sheets[csvWorkbook.SheetNames[0]];
        } catch (e) {
          // Fallback: parser manuellement le CSV
          const lines = data
            .split("\n")
            .filter((line: string) => line.trim() !== "");
          if (lines.length === 0) {
            worksheet = XLSX.utils.aoa_to_sheet([["Aucune donnée disponible"]]);
          } else {
            // Parser la première ligne comme en-têtes
            const headers = lines[0]
              .split(",")
              .map((h: string) => h.trim().replace(/^"|"$/g, ""));

            // Parser les lignes de données
            const rows = lines.slice(1).map((line: string) => {
              // Gérer les virgules dans les valeurs entre guillemets
              const values: string[] = [];
              let currentValue = "";
              let insideQuotes = false;

              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                  insideQuotes = !insideQuotes;
                } else if (char === "," && !insideQuotes) {
                  values.push(currentValue.trim().replace(/^"|"$/g, ""));
                  currentValue = "";
                } else {
                  currentValue += char;
                }
              }
              values.push(currentValue.trim().replace(/^"|"$/g, ""));
              return values;
            });

            worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          }
        }
      }
    } else if (typeof data === "object") {
      // Si c'est un objet, essayer de le convertir en tableau
      try {
        // Essayer de convertir l'objet en tableau
        const dataArray = Object.entries(data).map(([key, value]) => [key, value]);
        worksheet = XLSX.utils.aoa_to_sheet([["Clé", "Valeur"], ...dataArray]);
      } catch (e) {
        worksheet = XLSX.utils.aoa_to_sheet([["Erreur", "Impossible de convertir les données"]]);
      }
    } else {
      // Créer une feuille avec un message d'erreur plutôt que de lancer une exception
      worksheet = XLSX.utils.aoa_to_sheet([["Erreur", "Format de données non supporté"]]);
    }

    // Créer le workbook
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Export");

    // Ajuster la largeur des colonnes si possible
    if (worksheet["!ref"]) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      const colWidths: { wch: number }[] = [];
      for (let col = 0; col <= range.e.c; col++) {
        let maxLength = 0;
        for (let row = 0; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const cellValue = String(cell.v);
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length;
            }
          }
        }
        colWidths.push({ wch: Math.min(maxLength + 2, 50) });
      }
      worksheet["!cols"] = colWidths;
    }

    // Convertir en blob
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const handleExport = async () => {
    // Validation des dates
    if (!startDate || !endDate) {
      setError(t("date_range_required"));
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError(t("invalid_date_range"));
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportResult(null);

    try {
      const payload = {
        startDate,
        endDate,
        format: "excel",
      };

      // Le backend envoie directement le fichier Excel binaire, pas du JSON
      // On doit configurer axios pour recevoir un blob
      const response = await axiosInstance.post("/admin/export-csv", payload, {
        responseType: "blob", // Important : recevoir le fichier binaire directement
      });

      // Log des headers pour déboguer

      // Vérifier le Content-Type pour savoir si c'est un fichier ou une erreur JSON
      const contentType = response.headers["content-type"] || "";
      const isJsonError = contentType.includes("application/json");

      if (isJsonError && response.data instanceof Blob) {
        // C'est une erreur JSON, parser le blob
        const text = await response.data.text();
        const jsonData = JSON.parse(text);
        
        // Extraire le message d'erreur de différentes sources possibles
        let errorMessage = jsonData.message || jsonData.error;
        
        // Si le message est générique, essayer d'extraire plus de détails
        if (!errorMessage || errorMessage === "Erreur lors de l'export CSV") {
          // Essayer d'extraire depuis errors ou except
          if (jsonData.errors) {
            errorMessage = typeof jsonData.errors === "string" 
              ? jsonData.errors 
              : JSON.stringify(jsonData.errors);
          } else if (jsonData.except) {
            errorMessage = typeof jsonData.except === "string"
              ? jsonData.except
              : jsonData.except.message || JSON.stringify(jsonData.except);
          }
        }
        
        // Si le message contient des informations techniques, les rendre plus compréhensibles
        if (errorMessage && errorMessage.includes("no subscribers listening")) {
          errorMessage = "Le service d'export n'est pas disponible actuellement. Veuillez réessayer plus tard ou contacter l'administrateur.";
        }
        
        setError(errorMessage || "Erreur lors de l'export. Veuillez réessayer ou contacter l'administrateur.");
        return;
      }

      // Vérifier si c'est un blob (fichier Excel)
      if (response.data instanceof Blob) {
        // Récupérer les informations depuis les headers HTTP
        const totalRecords = parseInt(
          response.headers["x-total-records"] || "0",
          10
        );

        // Extraire le nom du fichier depuis Content-Disposition header
        let filename = "export.xlsx";
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
            // Décoder si c'est encodé en URL
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // Si le décodage échoue, utiliser tel quel
            }
          }
        }

        const fileSize = response.data.size;
        const mimeType = contentType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";


        // Préparer les données pour l'affichage
        const exportData = {
          success: true,
          message: "Export réussi",
          data: "", // Pas besoin de stocker les données base64
          filename: filename,
          mimeType: mimeType,
          fileSize: fileSize,
          encoding: "binary",
          totalRecords: totalRecords,
        };

        setExportResult(exportData);

        // Créer et déclencher le téléchargement directement avec le blob
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } else {
        setError("Erreur lors de l'export: format de réponse inattendu");
      }
    } catch (err: any) {

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
      } else if (err.response?.data) {
        // Si responseType est 'blob', err.response.data est un Blob même pour les erreurs JSON
        if (err.response.data instanceof Blob) {
          // Essayer de parser le blob comme JSON
          try {
            const text = await err.response.data.text();
            const jsonData = JSON.parse(text);
            
            // Extraire le message d'erreur de différentes sources possibles
            let errorMessage = jsonData.message || jsonData.error;
            
            if (!errorMessage || errorMessage === "Erreur lors de l'export CSV") {
              if (jsonData.errors) {
                errorMessage = typeof jsonData.errors === "string" 
                  ? jsonData.errors 
                  : JSON.stringify(jsonData.errors);
              } else if (jsonData.except) {
                errorMessage = typeof jsonData.except === "string"
                  ? jsonData.except
                  : jsonData.except.message || JSON.stringify(jsonData.except);
              }
            }
            
            // Rendre les messages techniques plus compréhensibles
            if (errorMessage && errorMessage.includes("no subscribers listening")) {
              errorMessage = "Le service d'export n'est pas disponible actuellement. Veuillez réessayer plus tard ou contacter l'administrateur.";
            }
            
            setError(errorMessage || "Erreur lors de l'export des données. Veuillez réessayer ou contacter l'administrateur.");
          } catch (parseError) {
            // Si ce n'est pas du JSON, c'est peut-être une erreur HTML
            setError("Erreur lors de l'export des données. Veuillez réessayer ou contacter l'administrateur.");
          }
        } else {
          // Afficher le message d'erreur du serveur s'il existe
          let errorMessage = err.response.data.message || err.response.data.error || err.message;
          
          // Rendre les messages techniques plus compréhensibles
          if (errorMessage && errorMessage.includes("no subscribers listening")) {
            errorMessage = "Le service d'export n'est pas disponible actuellement. Veuillez réessayer plus tard ou contacter l'administrateur.";
          }
          
          setError(errorMessage || "Erreur lors de l'export des données. Veuillez réessayer ou contacter l'administrateur.");
        }
      } else {
        // Erreur réseau ou autre
        setError(
          err.message || "Erreur lors de l'export des données. Vérifiez votre connexion et réessayez."
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
            {t("excel_export_title") || "Export des données Excel"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("excel_export_subtitle") ||
              "Exportez toutes les données de collecte au format Excel pour analyse externe"}
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
                {t("excel_export_description") ||
                  "Générez et téléchargez un fichier Excel contenant les données complètes de collecte : informations produits, transport, douanes, géolocalisation, valeurs commerciales et métriques physiques détaillées."}
              </p>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t("date_range_selection")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t("start_date")}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={handleStartDateChange}
                    onClick={() => openDatePicker("startDate")}
                    min="2020-01-01"
                    max="2030-12-31"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    style={{ colorScheme: "dark" }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => openDatePicker("startDate")}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-blue-500"
                      aria-label="Ouvrir le sélecteur de date"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("date_format_hint")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t("end_date")}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={handleEndDateChange}
                    onClick={() => openDatePicker("endDate")}
                    min="2020-01-01"
                    max="2030-12-31"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    style={{ colorScheme: "dark" }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => openDatePicker("endDate")}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-blue-500"
                      aria-label="Ouvrir le sélecteur de date"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("date_format_hint")}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {t("select_date_range")}
            </p>

            <div className="mt-4">
              <button
                onClick={setDefaultDateRange}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("reset_to_default")}
              </button>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex-1">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  isExporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                } transition-colors duration-200`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    {t("exporting")}
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="-ml-1 mr-3 h-5 w-5" />
                    {startDate && endDate
                      ? t("export_excel_with_dates") ||
                        "Exporter Excel avec dates"
                      : t("export_excel") || "Exporter Excel"}
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
                          {(exportResult.totalRecords ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t("file_size")}:</span>
                        <span className="ml-1">
                          {formatFileSize(exportResult.fileSize ?? 0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{t("file_type")}:</span>
                        <span className="ml-1">{exportResult.mimeType ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}</span>
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
                  <li>• Excel (.xlsx)</li>
                  <li>• {t("utf8_encoding")}</li>
                  <li>• Format compatible Microsoft Excel</li>
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

