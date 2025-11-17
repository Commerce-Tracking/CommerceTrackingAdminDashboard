import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Search, Eye, Package, Hash } from "lucide-react";

interface ProductNature {
  id: number;
  name_fr: string;
  name_en: string;
  created_at: string;
  updated_at: string;
  productCodes: ProductCode[];
}

interface ProductCode {
  id: number;
  product_id: number;
  product_nature_id: number;
  hs_code: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  result: {
    data: ProductNature[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  errors: any;
  except: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ProductNaturesListPage = () => {
  const [productNatures, setProductNatures] = useState<ProductNature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedProductNature, setSelectedProductNature] =
    useState<ProductNature | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingProductNature, setEditingProductNature] =
    useState<ProductNature | null>(null);
  const [editFormData, setEditFormData] = useState({
    name_fr: "",
    name_en: "",
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [productNatureToDelete, setProductNatureToDelete] =
    useState<ProductNature | null>(null);
  const { t } = useTranslation();

  const fetchProductNatures = async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Token d'authentification manquant");
        setLoading(false);
        return;
      }

      let url = `/admin/reference-data/product-natures?page=${page}&limit=${pagination.limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Réponse API natures de produits :", response.data);

      if (response.data.success) {
        const apiResponse: ApiResponse = response.data;
        setProductNatures(apiResponse.result.data || []);
        setPagination(apiResponse.result.pagination);
      } else {
        console.error("Erreur API natures de produits :", response.data);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des natures de produits:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Redirection vers la page de connexion
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductNatures();
  }, []);

  // Debounce pour la recherche en temps réel
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductNatures(1, searchTerm);
    }, 500); // Attendre 500ms après la dernière frappe

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    fetchProductNatures(newPage, searchTerm);
  };

  const openDetailModal = (productNature: ProductNature) => {
    setSelectedProductNature(productNature);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProductNature(null);
  };

  // Fonctions pour l'édition
  const openEditModal = (productNature: ProductNature) => {
    setEditingProductNature(productNature);
    setEditFormData({
      name_fr: productNature.name_fr,
      name_en: productNature.name_en,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProductNature(null);
    setEditFormData({
      name_fr: "",
      name_en: "",
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProductNature = async () => {
    if (!editingProductNature) return;

    // Validation
    if (!editFormData.name_fr.trim()) {
      toast.error(t("error"), {
        description:
          (t("product_nature_name_fr") || "Nom FR") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.name_en.trim()) {
      toast.error(t("error"), {
        description:
          (t("product_nature_name_en") || "Nom EN") + " " + t("is_required"),
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
        `/admin/reference-data/product-natures/${editingProductNature.id}`,
        {
          name_fr: editFormData.name_fr.trim(),
          name_en: editFormData.name_en.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message ||
            "Nature de produit mise à jour avec succès",
        });

        closeEditModal();
        fetchProductNatures(pagination.page, searchTerm);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise à jour",
        });
      }
    } catch (err: any) {
      console.error("Erreur API mise à jour :", err);
      let errorMessage =
        "Erreur lors de la mise à jour de la nature de produit.";
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
  const openDeleteConfirmation = (productNature: ProductNature) => {
    setProductNatureToDelete(productNature);
  };

  const closeDeleteConfirmation = () => {
    setProductNatureToDelete(null);
  };

  const handleDeleteProductNature = async () => {
    if (!productNatureToDelete) return;

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
        `/admin/reference-data/product-natures/${productNatureToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message || "Nature de produit supprimée avec succès",
        });

        closeDeleteConfirmation();
        fetchProductNatures(pagination.page, searchTerm);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      console.error("Erreur API suppression :", err);
      let errorMessage =
        "Erreur lors de la suppression de la nature de produit.";
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

  const getProductNatureName = (productNature: ProductNature) => {
    const currentLanguage = localStorage.getItem("i18nextLng") || "fr";
    return currentLanguage === "en"
      ? productNature.name_en
      : productNature.name_fr;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <PageMeta
        title="CT | Natures de produits"
        description="Liste des natures de produits pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("product_natures_list")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("product_natures_list")}>
            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={t("search_product_nature")}
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tableau des natures de produits */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {t("loading")}...
                </span>
              </div>
            ) : productNatures.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t("no_product_natures_found")}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? t("no_search_results")
                    : t("no_product_natures_available")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("product_nature_name")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("associated_product_codes")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {productNatures.map((productNature) => (
                      <tr
                        key={productNature.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getProductNatureName(productNature)}
                              </div>
                              {/* <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {productNature.id}
                              </div> */}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Hash className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {productNature.productCodes.length}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(productNature)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              {t("details")}
                            </button>
                            <button
                              onClick={() => openEditModal(productNature)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded hover:bg-blue-800"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() =>
                                openDeleteConfirmation(productNature)
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

      {/* Modal de détails */}
      {isDetailModalOpen && selectedProductNature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDetailModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-10">
                  {t("product_nature_details")}
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Fermer</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations générales */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    {t("general_information")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("product_nature_id")}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedProductNature.id}
                      </p>
                    </div> */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("name_french")}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedProductNature.name_fr}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("name_english")}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedProductNature.name_en}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("created_at")}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedProductNature.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Codes produits associés */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    {t("associated_product_codes")} (
                    {selectedProductNature.productCodes.length})
                  </h4>
                  {selectedProductNature.productCodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {t("no_product_codes_associated")}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t("hs_code")}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t("abbreviation")}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t("product_id")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedProductNature.productCodes.map((code) => (
                            <tr key={code.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {code.hs_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {code.abbreviation}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {code.product_id}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={closeDetailModal}
                  className="px-6 py-2"
                >
                  {t("close")}
                </Button>
                <Button
                  onClick={() => {
                    closeDetailModal();
                    openEditModal(selectedProductNature);
                  }}
                  className="px-6 py-2"
                >
                  {t("edit")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {t("edit_product_nature") || "Modifier la nature de produit"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_nature_name_fr") || "Nom (FR)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name_fr"
                    value={editFormData.name_fr}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_nature_name_en") || "Nom (EN)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name_en"
                    value={editFormData.name_en}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
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
                  onClick={handleUpdateProductNature}
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
      {productNatureToDelete && (
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
                {t("delete_confirmation_message") ||
                  "Êtes-vous sûr de vouloir supprimer"}{" "}
                <strong>{getProductNatureName(productNatureToDelete)}</strong> ?
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
                  onClick={handleDeleteProductNature}
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

export default ProductNaturesListPage;
