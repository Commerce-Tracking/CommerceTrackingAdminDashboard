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

interface TransportMethod {
  id: number;
  public_id: string;
  name: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
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
    data: TransportMethod[];
    pagination: PaginationInfo;
  };
  errors: any;
  except: any;
}

const TransportMethodsListPage = () => {
  const [transportMethods, setTransportMethods] = useState<TransportMethod[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTransportMethod, setEditingTransportMethod] =
    useState<TransportMethod | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    type: "road",
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [transportMethodToDelete, setTransportMethodToDelete] =
    useState<TransportMethod | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedTransportMethod, setSelectedTransportMethod] =
    useState<TransportMethod | null>(null);
  const { t } = useTranslation();

  const fetchTransportMethods = async (page: number = 1) => {
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

      const response = await axiosInstance.get(
        `/admin/reference-data/transport-methods?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API méthodes de transport :", response.data);

      if (response.data.success) {
        const apiResponse: ApiResponse = response.data;
        setTransportMethods(apiResponse.result.data || []);
        setPagination(apiResponse.result.pagination);
      } else {
        toast.error(t("error"), {
          description:
            response.data.message ||
            "Erreur lors du chargement des méthodes de transport",
        });
        setTransportMethods([]);
      }
    } catch (err: any) {
      console.error("Erreur API méthodes de transport :", err);
      let errorMessage = "Erreur lors du chargement des méthodes de transport.";
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
      setTransportMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportMethods(1);
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransportMethods(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = () => {
    fetchTransportMethods(1);
  };

  const handlePageChange = (page: number) => {
    fetchTransportMethods(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    fetchTransportMethods(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Fonctions pour l'édition
  const openEditModal = (transportMethod: TransportMethod) => {
    setEditingTransportMethod(transportMethod);
    setEditFormData({
      name: transportMethod.name,
      description: transportMethod.description,
      type: transportMethod.type,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransportMethod(null);
    setEditFormData({
      name: "",
      description: "",
      type: "road",
    });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateTransportMethod = async () => {
    if (!editingTransportMethod) return;

    // Validation
    if (!editFormData.name.trim()) {
      toast.error(t("error"), {
        description: t("transport_method_name") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.description.trim()) {
      toast.error(t("error"), {
        description: t("transport_method_description") + " " + t("is_required"),
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
        `/admin/reference-data/transport-methods/${editingTransportMethod.id}`,
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
            response.data.message ||
            "Méthode de transport mise à jour avec succès",
        });

        // Fermer le modal
        closeEditModal();

        // Rafraîchir la liste
        fetchTransportMethods(pagination.page);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise à jour",
        });
      }
    } catch (err: any) {
      console.error("Erreur API mise à jour :", err);
      let errorMessage =
        "Erreur lors de la mise à jour de la méthode de transport.";
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
  const openDeleteConfirmation = (transportMethod: TransportMethod) => {
    setTransportMethodToDelete(transportMethod);
  };

  const closeDeleteConfirmation = () => {
    setTransportMethodToDelete(null);
  };

  const handleDeleteTransportMethod = async () => {
    if (!transportMethodToDelete) return;

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
        `/admin/reference-data/transport-methods/${transportMethodToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API suppression :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message ||
            "Méthode de transport supprimée avec succès",
        });

        // Fermer la confirmation
        closeDeleteConfirmation();

        // Rafraîchir la liste
        fetchTransportMethods(pagination.page);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      console.error("Erreur API suppression :", err);
      let errorMessage =
        "Erreur lors de la suppression de la méthode de transport.";
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

  // Fonctions pour les détails
  const openDetailModal = (transportMethod: TransportMethod) => {
    setSelectedTransportMethod(transportMethod);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransportMethod(null);
  };

  return (
    <>
      <PageMeta
        title="OFR | Liste des méthodes de transport"
        description="Consulter la liste des méthodes de transport pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("transport_methods_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_transport_method")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Link to="/transport-methods/add">
              <Button className="px-6 py-2">{t("add_transport_method")}</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
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

          {/* Transport Methods Table */}
          <ComponentCard title={t("transport_methods_list")}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {t("loading")}...
                </span>
              </div>
            ) : transportMethods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? t("no_search_results")
                    : t("no_transport_methods_found")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("transport_method_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("transport_method_description")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("transport_method_type")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportMethods.map((transportMethod) => (
                      <tr
                        key={transportMethod.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {transportMethod.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div
                            className="max-w-xs truncate"
                            title={transportMethod.description}
                          >
                            {transportMethod.description}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {transportMethod.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(transportMethod)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t("details")}
                            </button>
                            <button
                              onClick={() => openEditModal(transportMethod)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() =>
                                openDeleteConfirmation(transportMethod)
                              }
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
                {t("edit_transport_method")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("transport_method_name")}{" "}
                    <span className="text-red-500">*</span>
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
                    {t("transport_method_type")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  >
                    <option value="road">{t("road")}</option>
                    <option value="railway">{t("railway")}</option>
                    <option value="air">{t("air")}</option>
                    <option value="sea">{t("sea")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("transport_method_description")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                    rows={4}
                  />
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
                  onClick={handleUpdateTransportMethod}
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedTransportMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDetailModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("transport_method_details")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("transport_method_name")}
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedTransportMethod.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("transport_method_description")}
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedTransportMethod.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("transport_method_type")}
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {selectedTransportMethod.type}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("date_creation")}
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(selectedTransportMethod.created_at)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("last_update")}
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(selectedTransportMethod.updated_at)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeDetailModal}
                  className="px-4 py-2"
                >
                  {t("close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {transportMethodToDelete && (
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
                <strong>{transportMethodToDelete.name}</strong> ?
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
                  onClick={handleDeleteTransportMethod}
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

export default TransportMethodsListPage;
