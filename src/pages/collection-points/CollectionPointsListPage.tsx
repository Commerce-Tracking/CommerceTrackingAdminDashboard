import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { ModalHeader } from "../../components/ui/modal/ModalHeader";
import { MapPin, Plus } from "lucide-react";

// Interface pour les données des points de collecte
interface CollectionPoint {
  id: number;
  public_id: string;
  name: string;
  description: string;
  country_id: number;
  corridor_id: number | null;
  collection_point_type_id: number;
  locality: string;
  region: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  is_formal: boolean;
  customs_post_code: string | null;
  is_border_crossing: boolean;
  is_market: boolean;
  is_fluvial: boolean;
  is_checkpoint: boolean;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  country: {
    id: number;
    public_id: string;
    name: string;
    iso: string;
    prefix: string;
    flag: string;
    currency_id: number;
    status: string;
    metadata: {
      capital: string;
      currency: string;
      languages: string[];
      population: number;
      superficie: number;
    };
    created_at: string;
    updated_at: string;
  };
  corridor: any | null;
  collectionPointType: {
    id: number;
    public_id: string;
    name: string;
    description: string;
    category: string;
    requires_documentation: number;
    has_infrastructure: number;
    created_at: string;
    updated_at: string;
  };
}

interface CollectionPointsResponse {
  success: boolean;
  message: string;
  result: {
    data: CollectionPoint[];
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

export default function CollectionPointsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollectionPoint, setSelectedCollectionPoint] =
    useState<CollectionPoint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    locality: "",
    region: "",
    customs_post_code: "",
    latitude: "",
    longitude: "",
    collection_point_type_id: "",
    is_formal: true,
    is_border_crossing: false,
    is_market: false,
    is_fluvial: false,
    is_checkpoint: false,
    status: "active",
  });
  const [collectionPointTypes, setCollectionPointTypes] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fonction pour récupérer les points de collecte
  const fetchCollectionPoints = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      let url = `/admin/reference-data/collection-points?page=${page}&limit=${pagination.limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const apiResponse: CollectionPointsResponse = response.data;
        setCollectionPoints(apiResponse.result.data);
        setPagination(apiResponse.result.pagination);
      } else {
        setError("Erreur lors de la récupération des points de collecte");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        setError(
          err.message || "Erreur lors de la récupération des points de collecte"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer la recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchCollectionPoints(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fonction pour charger les types de points de collecte
  const fetchCollectionPointTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/common-data/collection-point-types",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const typesData =
          response.data.result?.data ||
          response.data.data ||
          response.data.result ||
          [];
        setCollectionPointTypes(Array.isArray(typesData) ? typesData : []);
      }
    } catch (err: any) {
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchCollectionPoints();
    fetchCollectionPointTypes();
  }, []);

  // Fonction pour ouvrir le modal de détails
  const openDetailModal = (collectionPoint: CollectionPoint) => {
    setSelectedCollectionPoint(collectionPoint);
    setIsDetailModalOpen(true);
  };

  // Fonction pour fermer le modal
  const closeDetailModal = () => {
    setSelectedCollectionPoint(null);
    setIsDetailModalOpen(false);
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (collectionPoint: CollectionPoint) => {
    setSelectedCollectionPoint(collectionPoint);
    setEditFormData({
      name: collectionPoint.name,
      description: collectionPoint.description || "",
      locality: collectionPoint.locality,
      region: collectionPoint.region || "",
      customs_post_code: collectionPoint.customs_post_code || "",
      latitude: collectionPoint.coordinates?.latitude?.toString() || "",
      longitude: collectionPoint.coordinates?.longitude?.toString() || "",
      collection_point_type_id:
        collectionPoint.collection_point_type_id?.toString() || "",
      is_formal: collectionPoint.is_formal,
      is_border_crossing: collectionPoint.is_border_crossing,
      is_market: collectionPoint.is_market,
      is_fluvial: collectionPoint.is_fluvial,
      is_checkpoint: collectionPoint.is_checkpoint,
      status: collectionPoint.status,
    });
    setIsEditModalOpen(true);
  };

  // Fonction pour fermer le modal d'édition
  const closeEditModal = () => {
    setSelectedCollectionPoint(null);
    setIsEditModalOpen(false);
    setEditFormData({
      name: "",
      description: "",
      locality: "",
      region: "",
      customs_post_code: "",
      latitude: "",
      longitude: "",
      collection_point_type_id: "",
      is_formal: true,
      is_border_crossing: false,
      is_market: false,
      is_fluvial: false,
      is_checkpoint: false,
      status: "active",
    });
  };

  // Fonction pour gérer les changements dans le formulaire d'édition
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Fonction pour valider le formulaire d'édition
  const validateEditForm = () => {
    if (!editFormData.name || !editFormData.name.trim()) {
      setError("Le nom du point de collecte est requis");
      return false;
    }
    if (!editFormData.locality || !editFormData.locality.trim()) {
      setError("La localité est requise");
      return false;
    }
    if (
      !editFormData.collection_point_type_id ||
      !editFormData.collection_point_type_id.trim()
    ) {
      setError("Le type de point de collecte est requis");
      return false;
    }
    if (editFormData.latitude && isNaN(Number(editFormData.latitude))) {
      setError("La latitude doit être un nombre valide");
      return false;
    }
    if (editFormData.longitude && isNaN(Number(editFormData.longitude))) {
      setError("La longitude doit être un nombre valide");
      return false;
    }
    return true;
  };

  // Fonction pour mettre à jour un point de collecte
  const handleUpdateCollectionPoint = async () => {
    if (!selectedCollectionPoint) return;

    if (!validateEditForm()) {
      return;
    }

    try {
      setEditLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      // Préparer les données pour l'API
      const apiData: any = {
        name: editFormData.name.trim(),
        description: editFormData.description
          ? editFormData.description.trim() || null
          : null,
        locality: editFormData.locality
          ? editFormData.locality.trim() || null
          : null,
        region: editFormData.region ? editFormData.region.trim() || null : null,
        customs_post_code: editFormData.customs_post_code
          ? editFormData.customs_post_code.trim() || null
          : null,
        collection_point_type_id: editFormData.collection_point_type_id
          ? parseInt(editFormData.collection_point_type_id)
          : null,
        is_formal: editFormData.is_formal,
        is_border_crossing: editFormData.is_border_crossing,
        is_market: editFormData.is_market,
        is_fluvial: editFormData.is_fluvial,
        is_checkpoint: editFormData.is_checkpoint,
        status: editFormData.status,
      };

      // Coordonnées - envoyer null si vide, sinon les valeurs
      if (editFormData.latitude && editFormData.longitude) {
        apiData.coordinates = {
          latitude: parseFloat(editFormData.latitude),
          longitude: parseFloat(editFormData.longitude),
        };
      } else {
        apiData.coordinates = null;
      }


      const response = await axiosInstance.put(
        `/admin/reference-data/collection-points/${selectedCollectionPoint.id}`,
        apiData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Rafraîchir la liste
        fetchCollectionPoints(pagination.page, searchTerm);
        closeEditModal();
      } else {
        setError(
          response.data.message ||
            "Erreur lors de la mise à jour du point de collecte"
        );
      }
    } catch (err: any) {

      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        // Afficher les détails de validation si disponibles
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.errors ||
          err.message ||
          "Erreur lors de la mise à jour du point de collecte";

        setError(
          Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
        );
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour ouvrir le modal de suppression
  const openDeleteModal = (collectionPoint: CollectionPoint) => {
    setSelectedCollectionPoint(collectionPoint);
    setIsDeleteModalOpen(true);
  };

  // Fonction pour fermer le modal de suppression
  const closeDeleteModal = () => {
    setSelectedCollectionPoint(null);
    setIsDeleteModalOpen(false);
  };

  // Fonction pour supprimer un point de collecte
  const handleDeleteCollectionPoint = async () => {
    if (!selectedCollectionPoint) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const response = await axiosInstance.delete(
        `/admin/reference-data/collection-points/${selectedCollectionPoint.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Rafraîchir la liste
        fetchCollectionPoints(pagination.page, searchTerm);
        closeDeleteModal();
      } else {
        setError(response.data.message || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        setError(
          err.message || "Erreur lors de la suppression du point de collecte"
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    fetchCollectionPoints(newPage, searchTerm);
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    return status === "active" ? "text-green-600" : "text-red-600";
  };

  // Fonction pour obtenir les caractéristiques
  const getCharacteristics = (collectionPoint: CollectionPoint) => {
    const characteristics: string[] = [];
    if (collectionPoint.is_formal) characteristics.push("Formel");
    if (collectionPoint.is_border_crossing)
      characteristics.push("Passage frontalier");
    if (collectionPoint.is_market) characteristics.push("Marché");
    if (collectionPoint.is_fluvial) characteristics.push("Fluvial");
    if (collectionPoint.is_checkpoint)
      characteristics.push("Point de contrôle");
    return characteristics.join(", ") || "Aucune";
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageMeta
          title="Commerce Tracking | Points de Collecte"
          description="Liste des points de collecte"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageMeta
          title="Commerce Tracking | Points de Collecte"
          description="Liste des points de collecte"
        />
        <div className="flex items-center justify-center h-64 text-red-600">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4"
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
            <p className="text-lg font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageMeta
        title="Commerce Tracking | Points de Collecte"
        description="Liste des points de collecte"
      />

      <PageBreadcrumb
        pageTitle={
          t("collection_points_list") || "Liste des Points de Collecte"
        }
      />

      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={
                  t("search_collection_point") ||
                  "Rechercher un point de collecte..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={() => navigate("/collection-points/add")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("add_collection_point") || "Ajouter un Point de Collecte"}
            </Button>
          </div>

          {/* Collection Points Table */}
          <ComponentCard
            title={
              t("collection_points_list") || "Liste des Points de Collecte"
            }
          >
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loading")}...
                </p>
              </div>
            ) : collectionPoints.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? t("no_collection_points_found") ||
                      "Aucun point de collecte trouvé"
                    : t("no_collection_points") || "Aucun point de collecte"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("collection_point_name") || "Nom"}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("collection_point_type") || "Type"}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country") || "Pays"}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("locality") || "Localité"}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("characteristics") || "Caractéristiques"}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("status") || "Statut"}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("actions") || "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionPoints.map((collectionPoint) => (
                      <tr
                        key={collectionPoint.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium">
                                {collectionPoint.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {collectionPoint.locality}
                                {collectionPoint.region &&
                                  `, ${collectionPoint.region}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {collectionPoint.collectionPointType.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {collectionPoint.country.flag}
                            </span>
                            <span className="text-sm">
                              {collectionPoint.country.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="text-sm">
                            {collectionPoint.locality}
                          </div>
                          {collectionPoint.region && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {collectionPoint.region}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="text-xs">
                            {getCharacteristics(collectionPoint)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              collectionPoint.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {collectionPoint.status === "active"
                              ? t("active") || "Actif"
                              : t("inactive") || "Inactif"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(collectionPoint)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t("details") || "Détails"}
                            </button>
                            <button
                              onClick={() => openEditModal(collectionPoint)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded hover:bg-blue-800"
                            >
                              {t("edit") || "Modifier"}
                            </button>
                            <button
                              onClick={() => openDeleteModal(collectionPoint)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              {t("delete") || "Supprimer"}
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
                    {t("previous") || "Précédent"}
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
                    {t("next") || "Suivant"}
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        className="max-w-4xl"
      >
        <ModalHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("collection_point_details") || "Détails du Point de Collecte"}
          </h3>
        </ModalHeader>
        <div className="px-6 py-4">
          {selectedCollectionPoint && (
            <div className="space-y-6">
              {/* Informations de base */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("basic_information") || "Informations de base"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("collection_point_name") || "Nom"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedCollectionPoint.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("collection_point_type") || "Type"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedCollectionPoint.collectionPointType.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("description") || "Description"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedCollectionPoint.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("status") || "Statut"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedCollectionPoint.status === "active"
                        ? t("active") || "Actif"
                        : t("inactive") || "Inactif"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Localisation */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("location") || "Localisation"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("country") || "Pays"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedCollectionPoint.country.flag}{" "}
                      {selectedCollectionPoint.country.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("locality") || "Localité"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedCollectionPoint.locality}
                    </p>
                  </div>
                  {selectedCollectionPoint.region && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("region") || "Région"}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedCollectionPoint.region}
                      </p>
                    </div>
                  )}
                  {selectedCollectionPoint.coordinates && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("coordinates") || "Coordonnées"}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedCollectionPoint.coordinates.latitude},{" "}
                        {selectedCollectionPoint.coordinates.longitude}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Caractéristiques */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("characteristics") || "Caractéristiques"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        selectedCollectionPoint.is_formal
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("formal_point") || "Point formel"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        selectedCollectionPoint.is_border_crossing
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("border_crossing") || "Passage frontalier"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        selectedCollectionPoint.is_market
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("market") || "Marché"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        selectedCollectionPoint.is_fluvial
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("fluvial") || "Fluvial"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        selectedCollectionPoint.is_checkpoint
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t("checkpoint") || "Point de contrôle"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("additional_information") ||
                    "Informations supplémentaires"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCollectionPoint.customs_post_code && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("customs_post_code") || "Code poste douanier"}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedCollectionPoint.customs_post_code}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("created_at") || "Créé le"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(selectedCollectionPoint.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button
            onClick={closeDetailModal}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            {t("close") || "Fermer"}
          </Button>
        </div>
      </Modal>

      {/* Modal d'édition */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        className="max-w-2xl"
      >
        <ModalHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-20">
            {t("edit_collection_point") || "Modifier Point de Collecte"}
          </h3>
        </ModalHeader>
        <div className="px-6 py-4">
          {selectedCollectionPoint && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateCollectionPoint();
              }}
              className="space-y-6"
            >
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        {t("error") || "Erreur"}
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("collection_point_name") || "Nom du point de collecte"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("status") || "Statut"}
                  </label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="active">{t("active") || "Actif"}</option>
                    <option value="inactive">
                      {t("inactive") || "Inactif"}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("collection_point_type") || "Type de point de collecte"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="collection_point_type_id"
                  value={editFormData.collection_point_type_id}
                  onChange={handleEditInputChange}
                  required
                  disabled={editLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">
                    {t("select_collection_point_type") ||
                      "Sélectionner un type"}
                  </option>
                  {collectionPointTypes &&
                    Array.isArray(collectionPointTypes) &&
                    collectionPointTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("description") || "Description"}
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  disabled={editLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("locality") || "Localité"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="locality"
                    value={editFormData.locality}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("region") || "Région"}
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={editFormData.region}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Coordonnées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("latitude") || "Latitude"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={editFormData.latitude}
                    onChange={handleEditInputChange}
                    placeholder="Ex: 7.3167"
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("longitude") || "Longitude"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={editFormData.longitude}
                    onChange={handleEditInputChange}
                    placeholder="Ex: 13.5833"
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Code douanier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("customs_post_code") || "Code poste douanier"}
                </label>
                <input
                  type="text"
                  name="customs_post_code"
                  value={editFormData.customs_post_code}
                  onChange={handleEditInputChange}
                  placeholder="Ex: NGD001"
                  disabled={editLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Caractéristiques */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  {t("characteristics") || "Caractéristiques"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_formal"
                      checked={editFormData.is_formal}
                      onChange={handleEditInputChange}
                      disabled={editLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("formal_point") || "Point formel"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_border_crossing"
                      checked={editFormData.is_border_crossing}
                      onChange={handleEditInputChange}
                      disabled={editLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("border_crossing") || "Passage frontalier"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_market"
                      checked={editFormData.is_market}
                      onChange={handleEditInputChange}
                      disabled={editLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("market") || "Marché"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_fluvial"
                      checked={editFormData.is_fluvial}
                      onChange={handleEditInputChange}
                      disabled={editLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("fluvial") || "Fluvial"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_checkpoint"
                      checked={editFormData.is_checkpoint}
                      onChange={handleEditInputChange}
                      disabled={editLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("checkpoint") || "Point de contrôle"}
                    </span>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={closeEditModal}
            disabled={editLoading}
            className="px-4 py-2"
          >
            {t("cancel") || "Annuler"}
          </Button>
          <Button
            onClick={handleUpdateCollectionPoint}
            disabled={editLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {editLoading
              ? t("updating") || "Mise à jour..."
              : t("update") || "Mettre à jour"}
          </Button>
        </div>
      </Modal>

      {/* Modal de suppression */}
      {selectedCollectionPoint && isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDeleteModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("confirm_delete") || "Confirmer la suppression"}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("delete_collection_point_message") ||
                  "Êtes-vous sûr de vouloir supprimer le point de collecte"}{" "}
                <strong>{selectedCollectionPoint.name}</strong> ?
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="px-4 py-2"
                >
                  {t("cancel") || "Annuler"}
                </Button>
                <Button
                  onClick={handleDeleteCollectionPoint}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteLoading
                    ? t("deleting") || "Suppression..."
                    : t("delete") || "Supprimer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
