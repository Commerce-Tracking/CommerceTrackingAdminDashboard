import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  status: string;
  created_at: string;
  updated_at: string;
  countries: any[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  result: {
    data: Currency[];
    pagination: PaginationInfo;
  };
}

const CurrencyListPage = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    symbol: "",
    status: "active",
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(
    null
  );
  const { t } = useTranslation();

  const currencySymbols = [
    { value: "₿", label: "₿ - Bitcoin" },
    { value: "₵", label: "₵ - Cedi ghanéen" },
    { value: "FC", label: "FC - Franc congolais" },
    { value: "FCFA", label: "FCFA - Franc CFA" },
    { value: "$", label: "$ - Dollar américain" },
    { value: "€", label: "€ - Euro" },
    { value: "₾", label: "₾ - Lari géorgien" },
    { value: "₺", label: "₺ - Lire turque" },
    { value: "£", label: "£ - Livre sterling" },
    { value: "L", label: "L - Loti lesothan" },
    { value: "₼", label: "₼ - Manat azerbaïdjanais" },
    { value: "M", label: "M - Metical mozambicain" },
    { value: "₦", label: "₦ - Naira nigérian" },
    { value: "N", label: "N - Naira nigérian" },
    { value: "P", label: "P - Pula botswanais" },
    { value: "₹", label: "₹ - Roupie indienne" },
    { value: "₨", label: "₨ - Roupie mauricienne" },
    { value: "₽", label: "₽ - Rouble russe" },
    { value: "R", label: "R - Rand sud-africain" },
    { value: "₪", label: "₪ - Shekel israélien" },
    { value: "S", label: "S - Shilling somalien" },
    { value: "₸", label: "₸ - Tenge kazakh" },
    { value: "T", label: "T - Tugrik mongol" },
    { value: "₴", label: "₴ - Hryvnia ukrainienne" },
    { value: "W", label: "W - Won nord-coréen" },
    { value: "₩", label: "₩ - Won sud-coréen" },
    { value: "¥", label: "¥ - Yen japonais" },
    { value: "Z", label: "Z - Zloty polonais" },
    { value: "K", label: "K - Kwacha zambien" },
    { value: "Kz", label: "Kz - Kwanza angolais" },
  ];

  const currencyCodes = [
    { value: "AOA", label: "AOA - Kwanza angolais" },
    { value: "ARS", label: "ARS - Peso argentin" },
    { value: "AUD", label: "AUD - Dollar australien" },
    { value: "AZN", label: "AZN - Manat azerbaïdjanais" },
    { value: "BIF", label: "BIF - Franc burundais" },
    { value: "BND", label: "BND - Dollar brunéien" },
    { value: "BRL", label: "BRL - Real brésilien" },
    { value: "BWP", label: "BWP - Pula botswanais" },
    { value: "BTC", label: "BTC - Bitcoin" },
    { value: "CAD", label: "CAD - Dollar canadien" },
    { value: "CDF", label: "CDF - Franc congolais" },
    { value: "CHF", label: "CHF - Franc suisse" },
    { value: "CLP", label: "CLP - Peso chilien" },
    { value: "CNY", label: "CNY - Yuan chinois" },
    { value: "COP", label: "COP - Peso colombien" },
    { value: "DKK", label: "DKK - Couronne danoise" },
    { value: "DZD", label: "DZD - Dinar algérien" },
    { value: "EGP", label: "EGP - Livre égyptienne" },
    { value: "ETB", label: "ETB - Birr éthiopien" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - Livre sterling" },
    { value: "GEL", label: "GEL - Lari géorgien" },
    { value: "GHS", label: "GHS - Cedi ghanéen" },
    { value: "HKD", label: "HKD - Dollar de Hong Kong" },
    { value: "ILS", label: "ILS - Shekel israélien" },
    { value: "INR", label: "INR - Roupie indienne" },
    { value: "JPY", label: "JPY - Yen japonais" },
    { value: "KES", label: "KES - Shilling kényan" },
    { value: "KPW", label: "KPW - Won nord-coréen" },
    { value: "KRW", label: "KRW - Won sud-coréen" },
    { value: "KZT", label: "KZT - Tenge kazakh" },
    { value: "LSL", label: "LSL - Loti lesothan" },
    { value: "LYD", label: "LYD - Dinar libyen" },
    { value: "MAD", label: "MAD - Dirham marocain" },
    { value: "MNT", label: "MNT - Tugrik mongol" },
    { value: "MUR", label: "MUR - Roupie mauricienne" },
    { value: "MXN", label: "MXN - Peso mexicain" },
    { value: "MZN", label: "MZN - Metical mozambicain" },
    { value: "MWK", label: "MWK - Kwacha malawien" },
    { value: "NGN", label: "NGN - Naira nigérian" },
    { value: "NOK", label: "NOK - Couronne norvégienne" },
    { value: "NZD", label: "NZD - Dollar néo-zélandais" },
    { value: "PEN", label: "PEN - Sol péruvien" },
    { value: "PLN", label: "PLN - Zloty polonais" },
    { value: "RUB", label: "RUB - Rouble russe" },
    { value: "RWF", label: "RWF - Franc rwandais" },
    { value: "SEK", label: "SEK - Couronne suédoise" },
    { value: "SGD", label: "SGD - Dollar singapourien" },
    { value: "SOS", label: "SOS - Shilling somalien" },
    { value: "TND", label: "TND - Dinar tunisien" },
    { value: "TRY", label: "TRY - Lire turque" },
    { value: "TZS", label: "TZS - Shilling tanzanien" },
    { value: "UAH", label: "UAH - Hryvnia ukrainienne" },
    { value: "UGX", label: "UGX - Shilling ougandais" },
    { value: "USD", label: "USD - Dollar américain" },
    { value: "VEF", label: "VEF - Bolivar vénézuélien" },
    { value: "XAF", label: "XAF - Franc CFA (Afrique centrale)" },
    { value: "XOF", label: "XOF - Franc CFA (Afrique de l'Ouest)" },
    { value: "ZAR", label: "ZAR - Rand sud-africain" },
    { value: "ZMW", label: "ZMW - Kwacha zambien" },
    { value: "ZWL", label: "ZWL - Dollar zimbabwéen" },
  ];

  const fetchCurrencies = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description:
            "Aucun token d'authentification trouvé. Redirection vers la connexion...",
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
        return;
      }

      // Vérifier si le token est expiré (optionnel)
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          console.log("Token expiré, redirection vers la connexion");
          toast.error(t("auth_error"), {
            description: "Session expirée. Redirection vers la connexion...",
          });
          setTimeout(() => {
            window.location.href = "/signin";
          }, 2000);
          return;
        }
      } catch (tokenError) {
        console.log("Erreur lors de la vérification du token:", tokenError);
        // Continue même si on ne peut pas vérifier le token
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      console.log("Paramètres de requête :", params.toString());
      console.log(
        "URL complète :",
        `/admin/reference-data/currencies?${params.toString()}`
      );

      const response = await axiosInstance.get(
        `/admin/reference-data/currencies?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API complète :", response);
      console.log("Données de réponse :", response.data);

      if (response.data.success) {
        // Structure de réponse de l'API
        const result = response.data.result;
        const currenciesData = result.data || [];
        const paginationData = result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        };

        console.log("Données des devises extraites :", currenciesData);
        console.log("Pagination extraite :", paginationData);
        console.log("Nombre de devises trouvées :", currenciesData.length);

        setCurrencies(currenciesData);
        setPagination(paginationData);
        setCurrentPage(paginationData.page || 1);

        console.log(
          "État mis à jour - currencies:",
          currenciesData.length,
          "pagination:",
          paginationData
        );
      } else {
        console.log("L'API a retourné success: false");
        console.log("Message d'erreur :", response.data.message);
        toast.error(t("error"), {
          description:
            response.data.message || "Erreur lors du chargement des devises",
        });
      }
    } catch (err: any) {
      console.error("Erreur API :", err);
      let errorMessage = "Erreur lors du chargement des devises.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage =
          "Token invalide ou non autorisé. Redirection vers la connexion...";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        // Redirection vers la connexion après 2 secondes
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
        toast.error(t("error"), {
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour l'édition
  const openEditModal = (currency: Currency) => {
    setEditingCurrency(currency);
    setEditFormData({
      name: currency.name,
      code: currency.code,
      symbol: currency.symbol,
      status: currency.status,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCurrency(null);
    setEditFormData({
      name: "",
      code: "",
      symbol: "",
      status: "active",
    });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateCurrency = async () => {
    if (!editingCurrency) return;

    // Validation
    if (!editFormData.name.trim()) {
      toast.error(t("error"), {
        description: t("currency_name") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.code.trim()) {
      toast.error(t("error"), {
        description: t("currency_code") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.symbol.trim()) {
      toast.error(t("error"), {
        description: t("currency_symbol") + " " + t("is_required"),
      });
      return;
    }

    setEditLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        return;
      }

      const response = await axiosInstance.put(
        `/admin/reference-data/currencies/${editingCurrency.id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API mise à jour :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message || "Devise mise à jour avec succès",
        });

        // Fermer le modal
        closeEditModal();

        // Rafraîchir la liste
        fetchCurrencies(currentPage);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise à jour",
        });
      }
    } catch (err: any) {
      console.error("Erreur API mise à jour :", err);
      let errorMessage = "Erreur lors de la mise à jour de la devise.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Token invalide ou non autorisé.";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
        toast.error(t("error"), {
          description: errorMessage,
        });
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Fonctions pour la suppression
  const openDeleteConfirmation = (currency: Currency) => {
    setCurrencyToDelete(currency);
  };

  const closeDeleteConfirmation = () => {
    setCurrencyToDelete(null);
  };

  const handleDeleteCurrency = async () => {
    if (!currencyToDelete) return;

    setDeleteLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        return;
      }

      const response = await axiosInstance.delete(
        `/admin/reference-data/currencies/${currencyToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API suppression :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Devise supprimée avec succès",
        });

        // Fermer la confirmation
        closeDeleteConfirmation();

        // Rafraîchir la liste
        fetchCurrencies(currentPage);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      console.error("Erreur API suppression :", err);
      let errorMessage = "Erreur lors de la suppression de la devise.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Token invalide ou non autorisé.";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
        toast.error(t("error"), {
          description: errorMessage,
        });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Fonction pour déclencher la recherche avec un délai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Déclenchement automatique de la recherche avec:", {
        searchTerm,
        statusFilter,
      });
      fetchCurrencies(1);
    }, 300); // Délai réduit à 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleSearch = () => {
    fetchCurrencies(1);
  };

  const handlePageChange = (page: number) => {
    fetchCurrencies(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    fetchCurrencies(1);
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
        {t("active")}
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-300">
        {t("inactive")}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="OFR | Liste des devises"
          description="Consulter la liste des devises pour Opération Fluidité Routière Agro-bétail"
        />
        <PageBreadcrumb pageTitle={t("currency_list")} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t("load")}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="OFR | Liste des devises"
        description="Consulter la liste des devises pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("currency_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_currency")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Link to="/currencies/add">
              <Button className="px-6 py-2">{t("add_currency")}</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">{t("all_statuses")}</option>
                <option value="active">{t("active")}</option>
                <option value="inactive">{t("inactive")}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={handleSearch}
                className="px-4 py-2"
              >
                {t("search")}
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="px-4 py-2"
              >
                {t("clear_filters")}
              </Button>
            </div>
          </div>

          {/* Currencies Table */}
          <ComponentCard title={t("currency_list")}>
            {currencies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter
                    ? t("no_search_results")
                    : t("no_currencies_found")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("currency_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("currency_code")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("currency_symbol")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("status")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("date_creation")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.map((currency) => (
                      <tr
                        key={currency.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {currency.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {currency.code}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {currency.symbol}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(currency.status)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatDate(currency.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(currency)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded "
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => openDeleteConfirmation(currency)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t("showing")} {(pagination.page - 1) * pagination.limit + 1}{" "}
                  {t("to")}{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  {t("of")} {pagination.total} {t("results")}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    {t("previous")}
                  </Button>

                  {/* Page numbers */}
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === pagination.page ? "primary" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="px-3 py-1"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* Modal d'édition */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("edit_currency")}
            </h3>

            <div className="space-y-4">
              {/* Nom de la devise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("currency_name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={editLoading}
                />
              </div>

              {/* Code de la devise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("currency_code")} <span className="text-red-500">*</span>
                </label>
                <select
                  name="code"
                  value={editFormData.code}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={editLoading}
                >
                  <option value="">{t("select_currency_code")}</option>
                  {currencyCodes.map((code) => (
                    <option key={code.value} value={code.value}>
                      {code.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symbole de la devise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("currency_symbol")} <span className="text-red-500">*</span>
                </label>
                <select
                  name="symbol"
                  value={editFormData.symbol}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={editLoading}
                >
                  <option value="">{t("select_currency_symbol")}</option>
                  {currencySymbols.map((symbol) => (
                    <option key={symbol.value} value={symbol.value}>
                      {symbol.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("currency_status")} <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={editLoading}
                >
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                </select>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpdateCurrency}
                disabled={editLoading}
                className="flex-1"
              >
                {editLoading && (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {editLoading ? t("updating") : t("update")}
              </Button>
              <Button
                variant="outline"
                onClick={closeEditModal}
                disabled={editLoading}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {currencyToDelete && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("confirm_delete")}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("delete_confirmation_message")}{" "}
              <strong>{currencyToDelete.name}</strong> ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCurrency}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deleteLoading && (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {deleteLoading ? t("deleting") : t("delete")}
              </button>
              <button
                onClick={closeDeleteConfirmation}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CurrencyListPage;
