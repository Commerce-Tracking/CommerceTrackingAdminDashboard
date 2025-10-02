import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface Country {
  id: number;
  public_id: string;
  name: string;
  iso: string;
  prefix: string;
  flag: string;
  currency_id: number;
  status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  currency: {
    id: number;
    public_id: string;
    name: string;
    code: string;
    symbol: string;
    flag: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
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
    data: Country[];
    pagination: PaginationInfo;
  };
  errors: any;
  except: any;
}

const CountriesListPage = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    iso: "",
    prefix: "",
    currency_id: "",
    status: "active",
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const { t } = useTranslation();

  // Récupérer la liste des devises pour le modal d'édition
  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/currencies?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCurrencies(response.data.result.data || []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des devises:", err);
    }
  };

  const fetchCountries = async (page: number = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await axiosInstance.get(
        `/admin/reference-data/countries?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API pays :", response.data);

      if (response.data.success) {
        const apiResponse: ApiResponse = response.data;
        setCountries(apiResponse.result.data || []);
        setPagination(apiResponse.result.pagination);
      } else {
        toast.error(t("error"), {
          description:
            response.data.message || "Erreur lors du chargement des pays",
        });
        setCountries([]);
      }
    } catch (err: any) {
      console.error("Erreur API pays :", err);
      let errorMessage = "Erreur lors du chargement des pays.";
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
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries(1);
    fetchCurrencies();
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCountries(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleSearch = () => {
    fetchCountries(1);
  };

  const handlePageChange = (page: number) => {
    fetchCountries(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    fetchCountries(1);
  };

  const getStatusBadge = (status: string) => {
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === "active"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {status === "active" ? t("active") : t("inactive")}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Fonctions pour l'édition
  const openEditModal = (country: Country) => {
    setEditingCountry(country);
    setEditFormData({
      name: country.name,
      iso: country.iso,
      prefix: country.prefix,
      currency_id: country.currency_id.toString(),
      status: country.status,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCountry(null);
    setEditFormData({
      name: "",
      iso: "",
      prefix: "",
      currency_id: "",
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

  const handleUpdateCountry = async () => {
    if (!editingCountry) return;

    // Validation
    if (!editFormData.name.trim()) {
      toast.error(t("error"), {
        description: t("country_name") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.iso.trim()) {
      toast.error(t("error"), {
        description: t("country_iso") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.prefix.trim()) {
      toast.error(t("error"), {
        description: t("country_prefix") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.currency_id) {
      toast.error(t("error"), {
        description: t("country_currency") + " " + t("is_required"),
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
        `/admin/reference-data/countries/${editingCountry.id}`,
        {
          ...editFormData,
          currency_id: parseInt(editFormData.currency_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API mise à jour :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Pays mis à jour avec succès",
        });

        // Fermer le modal
        closeEditModal();

        // Rafraîchir la liste
        fetchCountries(pagination.page);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise à jour",
        });
      }
    } catch (err: any) {
      console.error("Erreur API mise à jour :", err);
      let errorMessage = "Erreur lors de la mise à jour du pays.";
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
  const openDeleteConfirmation = (country: Country) => {
    setCountryToDelete(country);
  };

  const closeDeleteConfirmation = () => {
    setCountryToDelete(null);
  };

  const handleDeleteCountry = async () => {
    if (!countryToDelete) return;

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
        `/admin/reference-data/countries/${countryToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API suppression :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Pays supprimé avec succès",
        });

        // Fermer la confirmation
        closeDeleteConfirmation();

        // Rafraîchir la liste
        fetchCountries(pagination.page);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      console.error("Erreur API suppression :", err);
      let errorMessage = "Erreur lors de la suppression du pays.";
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

  return (
    <>
      <PageMeta
        title="OFR | Liste des pays"
        description="Consulter la liste des pays pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("country_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_country")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Link to="/pays/add">
              <Button className="px-6 py-2">{t("add_country")}</Button>
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

          {/* Countries Table */}
          <ComponentCard title={t("country_list")}>
            {countries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter
                    ? t("no_search_results")
                    : t("no_countries_found")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country_iso")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country_prefix")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country_currency")}
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
                    {countries.map((country) => (
                      <tr
                        key={country.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {country.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {country.iso}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {country.prefix}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {country.currency?.name} ({country.currency?.code})
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(country.status)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatDate(country.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(country)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => openDeleteConfirmation(country)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeEditModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("edit_country")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("country_name")} <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("country_iso")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="iso"
                    value={editFormData.iso}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("country_prefix")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prefix"
                    value={editFormData.prefix}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("country_currency")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currency_id"
                    value={editFormData.currency_id}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  >
                    <option value="">{t("select_currency")}</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("country_status")}{" "}
                    <span className="text-red-500">*</span>
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

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={editLoading}
                  className="px-4 py-2"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleUpdateCountry}
                  disabled={editLoading}
                  className="px-4 py-2"
                >
                  {editLoading ? t("updating") : t("update")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {countryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDeleteConfirmation}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("confirm_delete")}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("delete_confirmation_message")}{" "}
                <strong>{countryToDelete.name}</strong> ?
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeDeleteConfirmation}
                  disabled={deleteLoading}
                  className="px-4 py-2"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleDeleteCountry}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteLoading ? t("deleting") : t("delete")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CountriesListPage;
