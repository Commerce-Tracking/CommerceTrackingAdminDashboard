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

interface Product {
  id: number;
  public_id: string;
  name: string;
  name_eng: string;
  product_type_id: number;
  description: string;
  created_at: string;
  updated_at: string;
  productType?: {
    id: number;
    public_id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  productCodes?: {
    id: number;
    product_id: number;
    product_nature_id: number;
    hs_code: string;
    abbreviation: string;
    created_at: string;
    updated_at: string;
    productNature?: {
      id: number;
      name_fr: string;
      name_en: string;
      created_at: string;
      updated_at: string;
    };
  }[];
  collectionItems?: any[];
  tracasserieProducts?: any[];
  tracasserieControlPosts?: any[];
  mainProductTracasseries?: any[];
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
    data: Product[];
    pagination: PaginationInfo;
  };
  errors: any;
  except: any;
}

const ProductsListPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    name_eng: "",
    product_type_id: "",
    description: "",
  });
  const [editNaturesList, setEditNaturesList] = useState<
    { product_nature_id: number; hs_code: string }[]
  >([]);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [productNatures, setProductNatures] = useState<any[]>([]);
  const [editNatureFormData, setEditNatureFormData] = useState({
    product_nature_id: "",
    hs_code: "",
  });
  const { t, i18n } = useTranslation();

  // Récupérer la liste des types de produits pour le modal d'édition
  const fetchProductTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/product-types?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setProductTypes(response.data.result.data || []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des types de produits:", err);
    }
  };

  // Récupérer la liste des natures de produits pour le modal d'édition
  const fetchProductNatures = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/product-natures",
        {
          params: {
            page: 1,
            limit: 100,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setProductNatures(response.data.result.data || []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des natures de produits:", err);
    }
  };

  const fetchProducts = async (page: number = 1) => {
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

      // Construction de l'URL avec pagination fonctionnelle
      let url = `/admin/reference-data/products?page=${page}&limit=${pagination.limit}`;

      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const apiResponse: ApiResponse = response.data;
        setProducts(apiResponse.result.data || []);
        setPagination(apiResponse.result.pagination);
      } else {
        toast.error(t("error"), {
          description:
            response.data.message || "Erreur lors du chargement des produits",
        });
        setProducts([]);
      }
    } catch (err: any) {
      let errorMessage = "Erreur lors du chargement des produits.";
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
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchProductTypes();
    fetchProductNatures();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = () => {
    fetchProducts(1);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    fetchProducts(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Fonctions pour les détails
  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  // Fonctions pour l'édition
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      name_eng: product.name_eng || "",
      product_type_id: product.product_type_id.toString(),
      description: product.description || "",
    });

    // Charger les natures existantes
    if (product.productCodes && product.productCodes.length > 0) {
      const natures = product.productCodes.map((code) => ({
        product_nature_id: code.product_nature_id,
        hs_code: code.hs_code,
      }));
      setEditNaturesList(natures);
    } else {
      setEditNaturesList([]);
    }

    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setEditFormData({
      name: "",
      name_eng: "",
      product_type_id: "",
      description: "",
    });
    setEditNaturesList([]);
    setEditNatureFormData({
      product_nature_id: "",
      hs_code: "",
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

  const handleEditNatureFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditNatureFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddEditNature = () => {
    if (
      editNatureFormData.product_nature_id &&
      editNatureFormData.hs_code.trim()
    ) {
      const newNature = {
        product_nature_id: parseInt(editNatureFormData.product_nature_id),
        hs_code: editNatureFormData.hs_code.trim(),
      };
      setEditNaturesList([...editNaturesList, newNature]);
      setEditNatureFormData({
        product_nature_id: "",
        hs_code: "",
      });
    }
  };

  const handleRemoveEditNature = (index: number) => {
    const newList = editNaturesList.filter((_, i) => i !== index);
    setEditNaturesList(newList);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    // Validation
    if (!editFormData.name.trim()) {
      toast.error(t("error"), {
        description: t("product_name") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.name_eng.trim()) {
      toast.error(t("error"), {
        description: t("name_english") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.product_type_id) {
      toast.error(t("error"), {
        description: t("product_type") + " " + t("is_required"),
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

      const requestData: any = {
        name: editFormData.name.trim(),
        name_eng: editFormData.name_eng.trim(),
        product_type_id: parseInt(editFormData.product_type_id),
        description: editFormData.description?.trim() || null,
      };

      // Ajouter le tableau natures si des natures ont été modifiées
      if (editNaturesList.length > 0) {
        requestData.natures = editNaturesList;
      }

      console.log("🔄 Payload de modification:", requestData);
      console.log("📋 Natures à envoyer:", editNaturesList);
      console.log("📊 Nombre de natures:", editNaturesList.length);

      const response = await axiosInstance.put(
        `/admin/reference-data/products/${editingProduct.id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Réponse API mise à jour :", response.data);
      console.log("📦 Produit mis à jour:", response.data.result);

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message || "Produit mis à jour avec succès",
        });

        // Fermer le modal
        closeEditModal();

        // Attendre un peu avant de rafraîchir pour que le backend ait le temps de mettre à jour
        setTimeout(() => {
          fetchProducts(pagination.page);
        }, 500);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise à jour",
        });
      }
    } catch (err: any) {
      console.error("Erreur API mise à jour :", err);
      let errorMessage = "Erreur lors de la mise à jour du produit.";
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
  const openDeleteConfirmation = (product: Product) => {
    setProductToDelete(product);
  };

  const closeDeleteConfirmation = () => {
    setProductToDelete(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) {
      console.error("❌ Aucun produit à supprimer");
      return;
    }

    console.log("📦 Produit à supprimer:", productToDelete);
    console.log("🆔 ID du produit:", productToDelete.id);

    setDeleteLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        return;
      }

      console.log("🔄 Suppression du produit ID:", productToDelete.id);
      console.log(
        "🔗 URL:",
        `/admin/reference-data/products/${productToDelete.id}`
      );

      const response = await axiosInstance.delete(
        `/admin/reference-data/products/${productToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "📨 Réponse API suppression complète:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("📊 Status HTTP:", response.status);

      if (response.data.success) {
        console.log("✅ Produit supprimé avec succès");
        console.log("🆔 ID du produit supprimé:", productToDelete.id);
        console.log("📋 Produits avant suppression:", products.length);

        // Fermer la confirmation
        closeDeleteConfirmation();

        // Mettre à jour la liste locale en supprimant le produit
        const filteredProducts = products.filter(
          (p) => p.id !== productToDelete.id
        );
        console.log("📋 Produits après filtrage:", filteredProducts.length);

        // Mettre à jour la liste locale
        setProducts(filteredProducts);

        // Ajuster le total après suppression
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));

        toast.success(t("success"), {
          description: response.data.message || "Produit supprimé avec succès",
        });

        // Vérifier après un court délai si le produit est toujours présent côté serveur
        setTimeout(async () => {
          console.log("🔍 Vérification côté serveur après 2 secondes...");
          try {
            const verifyResponse = await axiosInstance.get(
              `/admin/reference-data/products/${productToDelete.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            console.log(
              "📊 Produit toujours présent côté serveur:",
              verifyResponse.data
            );
          } catch (verifyErr: any) {
            if (verifyErr.response?.status === 404) {
              console.log("✅ Produit bien supprimé côté serveur (404)");
            } else {
              console.log(
                "⚠️ Erreur lors de la vérification:",
                verifyErr.message
              );
            }
          }
        }, 2000);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      console.error("❌ Erreur API suppression:", err);
      console.error("📊 Status:", err.response?.status);
      console.error("📋 Détails:", err.response?.data);
      console.error("📋 Message:", err.message);

      let errorMessage = "Erreur lors de la suppression du produit.";
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
        title="CT | Liste des produits"
        description="Consulter la liste des produits pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("products_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_product")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Link to="/products/add">
              <Button className="px-6 py-2">{t("add_product")}</Button>
            </Link>
          </div>

          {/* Search and Clear buttons */}
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

          {/* Products Table */}
          <ComponentCard title={t("products_list")}>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loading")}...
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? t("no_search_results") : t("no_products_found")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("product_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("product_type")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("associated_product_codes")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("product_description")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {product.productType?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">
                          {product.productCodes?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div
                            className="max-w-xs truncate"
                            title={product.description}
                          >
                            {product.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(product)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t("details")}
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => openDeleteConfirmation(product)}
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

      {/* Detail Modal */}
      {isDetailModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDetailModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-10">
                {t("product_details")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_name")}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                    {selectedProduct.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_type")}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                    {selectedProduct.productType?.name || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("name_english")}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                    {selectedProduct.name_eng || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_description")}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 min-h-[100px] whitespace-pre-wrap">
                    {selectedProduct.description}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("associated_product_codes")} (
                    {selectedProduct.productCodes?.length || 0})
                  </label>
                  {selectedProduct.productCodes &&
                  selectedProduct.productCodes.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                      <div className="space-y-2">
                        {selectedProduct.productCodes.map((code, index) => (
                          <div
                            key={code.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {code.hs_code || "N/A"}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({code.abbreviation})
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {i18n.language === "fr"
                                  ? code.productNature?.name_fr
                                  : code.productNature?.name_en}
                                {code.productNature && " • "}
                                {t("product_nature_id")}:{" "}
                                {code.product_nature_id}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 text-center">
                      {t("no_product_codes_associated")}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("date_creation")}
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                      {formatDate(selectedProduct.created_at)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("last_update")}
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                      {formatDate(selectedProduct.updated_at)}
                    </div>
                  </div>
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
                <Button
                  onClick={() => {
                    closeDetailModal();
                    openEditModal(selectedProduct);
                  }}
                  className="px-4 py-2"
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
                {t("edit_product")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_name")} <span className="text-red-500">*</span>
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
                    {t("product_type")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="product_type_id"
                    value={editFormData.product_type_id}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  >
                    <option value="">{t("select_product_type")}</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("name_english")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name_eng"
                    value={editFormData.name_eng}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_description")}
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description || ""}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={4}
                    disabled={editLoading}
                  />
                </div>

                {/* Section pour ajouter des natures */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_nature") || "Nature du produit"}
                  </label>

                  <div className="mb-2">
                    <input
                      type="text"
                      name="hs_code"
                      value={editNatureFormData.hs_code}
                      onChange={handleEditNatureFormChange}
                      placeholder={t("hs_code") || "Code HS"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={editLoading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      name="product_nature_id"
                      value={editNatureFormData.product_nature_id}
                      onChange={handleEditNatureFormChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={editLoading}
                    >
                      <option value="">
                        {t("select_product_nature") ||
                          "Sélectionner une nature"}
                      </option>
                      {productNatures && productNatures.length > 0 ? (
                        productNatures.map((nature) => (
                          <option key={nature.id} value={nature.id}>
                            {nature.name_fr}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          Aucune nature disponible
                        </option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddEditNature}
                      disabled={
                        editLoading ||
                        !editNatureFormData.product_nature_id ||
                        !editNatureFormData.hs_code.trim()
                      }
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50"
                    >
                      {t("add")}
                    </button>
                  </div>

                  {/* Liste des natures ajoutées */}
                  {editNaturesList.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {editNaturesList.map((nature, index) => {
                        const natureDetails = productNatures.find(
                          (n) => n.id === nature.product_nature_id
                        );
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {natureDetails?.name_fr ||
                                  nature.product_nature_id}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {"•"}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                {nature.hs_code}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditNature(index)}
                              disabled={editLoading}
                              className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                              {t("remove")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  onClick={handleUpdateProduct}
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
      {productToDelete && (
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
                <strong>{productToDelete.name}</strong> ?
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
                  onClick={handleDeleteProduct}
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

export default ProductsListPage;
