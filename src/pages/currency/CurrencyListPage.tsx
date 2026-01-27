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
    { value: "â‚¿", label: "â‚¿ - Bitcoin" },
    { value: "â‚µ", label: "â‚µ - Cedi ghanÃ©en" },
    { value: "FC", label: "FC - Franc congolais" },
    { value: "FCFA", label: "FCFA - Franc CFA" },
    { value: "$", label: "$ - Dollar amÃ©ricain" },
    { value: "â‚¬", label: "â‚¬ - Euro" },
    { value: "â‚¾", label: "â‚¾ - Lari gÃ©orgien" },
    { value: "â‚º", label: "â‚º - Lire turque" },
    { value: "Â£", label: "Â£ - Livre sterling" },
    { value: "L", label: "L - Loti lesothan" },
    { value: "â‚¼", label: "â‚¼ - Manat azerbaÃ¯djanais" },
    { value: "M", label: "M - Metical mozambicain" },
    { value: "â‚¦", label: "â‚¦ - Naira nigÃ©rian" },
    { value: "N", label: "N - Naira nigÃ©rian" },
    { value: "P", label: "P - Pula botswanais" },
    { value: "â‚¹", label: "â‚¹ - Roupie indienne" },
    { value: "â‚¨", label: "â‚¨ - Roupie mauricienne" },
    { value: "â‚½", label: "â‚½ - Rouble russe" },
    { value: "R", label: "R - Rand sud-africain" },
    { value: "â‚ª", label: "â‚ª - Shekel israÃ©lien" },
    { value: "S", label: "S - Shilling somalien" },
    { value: "â‚¸", label: "â‚¸ - Tenge kazakh" },
    { value: "T", label: "T - Tugrik mongol" },
    { value: "â‚´", label: "â‚´ - Hryvnia ukrainienne" },
    { value: "W", label: "W - Won nord-corÃ©en" },
    { value: "â‚©", label: "â‚© - Won sud-corÃ©en" },
    { value: "Â¥", label: "Â¥ - Yen japonais" },
    { value: "Z", label: "Z - Zloty polonais" },
    { value: "K", label: "K - Kwacha zambien" },
    { value: "Kz", label: "Kz - Kwanza angolais" },
  ];

  const currencyCodes = [
    { value: "AOA", label: "AOA - Kwanza angolais" },
    { value: "ARS", label: "ARS - Peso argentin" },
    { value: "AUD", label: "AUD - Dollar australien" },
    { value: "AZN", label: "AZN - Manat azerbaÃ¯djanais" },
    { value: "BIF", label: "BIF - Franc burundais" },
    { value: "BND", label: "BND - Dollar brunÃ©ien" },
    { value: "BRL", label: "BRL - Real brÃ©silien" },
    { value: "BWP", label: "BWP - Pula botswanais" },
    { value: "BTC", label: "BTC - Bitcoin" },
    { value: "CAD", label: "CAD - Dollar canadien" },
    { value: "CDF", label: "CDF - Franc congolais" },
    { value: "CHF", label: "CHF - Franc suisse" },
    { value: "CLP", label: "CLP - Peso chilien" },
    { value: "CNY", label: "CNY - Yuan chinois" },
    { value: "COP", label: "COP - Peso colombien" },
    { value: "DKK", label: "DKK - Couronne danoise" },
    { value: "DZD", label: "DZD - Dinar algÃ©rien" },
    { value: "EGP", label: "EGP - Livre Ã©gyptienne" },
    { value: "ETB", label: "ETB - Birr Ã©thiopien" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - Livre sterling" },
    { value: "GEL", label: "GEL - Lari gÃ©orgien" },
    { value: "GHS", label: "GHS - Cedi ghanÃ©en" },
    { value: "HKD", label: "HKD - Dollar de Hong Kong" },
    { value: "ILS", label: "ILS - Shekel israÃ©lien" },
    { value: "INR", label: "INR - Roupie indienne" },
    { value: "JPY", label: "JPY - Yen japonais" },
    { value: "KES", label: "KES - Shilling kÃ©nyan" },
    { value: "KPW", label: "KPW - Won nord-corÃ©en" },
    { value: "KRW", label: "KRW - Won sud-corÃ©en" },
    { value: "KZT", label: "KZT - Tenge kazakh" },
    { value: "LSL", label: "LSL - Loti lesothan" },
    { value: "LYD", label: "LYD - Dinar libyen" },
    { value: "MAD", label: "MAD - Dirham marocain" },
    { value: "MNT", label: "MNT - Tugrik mongol" },
    { value: "MUR", label: "MUR - Roupie mauricienne" },
    { value: "MXN", label: "MXN - Peso mexicain" },
    { value: "MZN", label: "MZN - Metical mozambicain" },
    { value: "MWK", label: "MWK - Kwacha malawien" },
    { value: "NGN", label: "NGN - Naira nigÃ©rian" },
    { value: "NOK", label: "NOK - Couronne norvÃ©gienne" },
    { value: "NZD", label: "NZD - Dollar nÃ©o-zÃ©landais" },
    { value: "PEN", label: "PEN - Sol pÃ©ruvien" },
    { value: "PLN", label: "PLN - Zloty polonais" },
    { value: "RUB", label: "RUB - Rouble russe" },
    { value: "RWF", label: "RWF - Franc rwandais" },
    { value: "SEK", label: "SEK - Couronne suÃ©doise" },
    { value: "SGD", label: "SGD - Dollar singapourien" },
    { value: "SOS", label: "SOS - Shilling somalien" },
    { value: "TND", label: "TND - Dinar tunisien" },
    { value: "TRY", label: "TRY - Lire turque" },
    { value: "TZS", label: "TZS - Shilling tanzanien" },
    { value: "UAH", label: "UAH - Hryvnia ukrainienne" },
    { value: "UGX", label: "UGX - Shilling ougandais" },
    { value: "USD", label: "USD - Dollar amÃ©ricain" },
    { value: "VEF", label: "VEF - Bolivar vÃ©nÃ©zuÃ©lien" },
    { value: "XAF", label: "XAF - Franc CFA (Afrique centrale)" },
    { value: "XOF", label: "XOF - Franc CFA (Afrique de l'Ouest)" },
    { value: "ZAR", label: "ZAR - Rand sud-africain" },
    { value: "ZMW", label: "ZMW - Kwacha zambien" },
    { value: "ZWL", label: "ZWL - Dollar zimbabwÃ©en" },
  ];

  const fetchCurrencies = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description:
            "Aucun token d'authentification trouvÃ©. Redirection vers la connexion...",
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
        return;
      }

      // VÃ©rifier si le token est expirÃ© (optionnel)
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          toast.error(t("auth_error"), {
            description: "Session expirÃ©e. Redirection vers la connexion...",
          });
          setTimeout(() => {
            window.location.href = "/signin";
          }, 2000);
          return;
        }
      } catch (tokenError) {
        // Continue mÃªme si on ne peut pas vÃ©rifier le token
      }

      // Construire les paramÃ¨tres de requÃªte
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


      const response = await axiosInstance.get(
        `/admin/reference-data/currencies?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (response.data.success) {
        // Structure de rÃ©ponse de l'API
        const result = response.data.result;
        const currenciesData = result.data || [];
        const paginationData = result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        };


        setCurrencies(currenciesData);
        setPagination(paginationData);
        setCurrentPage(paginationData.page || 1);

      } else {
        toast.error(t("error"), {
          description:
            response.data.message || "Erreur lors du chargement des devises",
        });
      }
    } catch (err: any) {
      let errorMessage = "Erreur lors du chargement des devises.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage =
          "Token invalide ou non autorisÃ©. Redirection vers la connexion...";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        // Redirection vers la connexion aprÃ¨s 2 secondes
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

  // Fonctions pour l'Ã©dition
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
          description: "Aucun token d'authentification trouvÃ©.",
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


      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message || "Devise mise Ã  jour avec succÃ¨s",
        });

        // Fermer le modal
        closeEditModal();

        // RafraÃ®chir la liste
        fetchCurrencies(currentPage);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise Ã  jour",
        });
      }
    } catch (err: any) {
      let errorMessage = "Erreur lors de la mise Ã  jour de la devise.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Token invalide ou non autorisÃ©.";
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
          description: "Aucun token d'authentification trouvÃ©.",
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


      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Devise supprimÃ©e avec succÃ¨s",
        });

        // Fermer la confirmation
        closeDeleteConfirmation();

        // RafraÃ®chir la liste
        fetchCurrencies(currentPage);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      let errorMessage = "Erreur lors de la suppression de la devise.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Token invalide ou non autorisÃ©.";
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

  // Fonction pour dÃ©clencher la recherche avec un dÃ©lai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCurrencies(1);
    }, 300); // DÃ©lai rÃ©duit Ã  300ms

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
          title="CT | Liste des devises"
          description="Consulter la liste des devises pour OpÃ©ration FluiditÃ© RoutiÃ¨re Agro-bÃ©tail"
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
        title="CT | Liste des devises"
        description="Consulter la liste des devises pour OpÃ©ration FluiditÃ© RoutiÃ¨re Agro-bÃ©tail"
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

      {/* Modal d'Ã©dition */}
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
