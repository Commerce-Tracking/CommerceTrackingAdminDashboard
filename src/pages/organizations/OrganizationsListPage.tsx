import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { ModalHeader } from "../../components/ui/modal/ModalHeader";
import { Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Interface pour les données des organisations
interface Organization {
  id: number;
  public_id: string;
  name: string;
  description: string;
  address: string;
  type: string;
  country_id: number;
  metadata: {
    city: string;
    logo: string | null;
    email: string;
    phone: string;
    region: string;
    website: string;
    postal_code: string | null;
  };
  logo: string | null;
  coordinates: any | null;
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
  actors: any[];
}

interface OrganizationsResponse {
  success: boolean;
  message: string;
  result: {
    data: Organization[];
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

export default function OrganizationsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    address: "",
    type: "public",
    phone: "",
    email: "",
    website: "",
    metadata: {
      city: "",
      email: "",
      phone: "",
      region: "",
      website: "",
      postal_code: "",
    },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fonction pour récupérer les organisations
  const fetchOrganizations = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      let url = `/admin/reference-data/organizations?page=${page}&limit=${pagination.limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      console.log("🔄 Appel API organizations:", url);
      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const apiResponse: OrganizationsResponse = response.data;
        setOrganizations(apiResponse.result.data);
        setPagination(apiResponse.result.pagination);
        console.log(
          "✅ Organisations récupérées avec succès:",
          apiResponse.result.data.length
        );
      } else {
        setError("Erreur lors de la récupération des organisations");
        console.error("❌ Erreur API organizations:", response.data);
      }
    } catch (err: any) {
      console.error(
        "❌ Erreur lors de la récupération des organisations:",
        err
      );
      if (err.response?.status === 401) {
        console.log(
          "🔒 Session expirée, redirection vers la page de connexion..."
        );
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        setError(
          err.message || "Erreur lors de la récupération des organisations"
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
        fetchOrganizations(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Chargement initial
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fonction pour ouvrir le modal de détails
  const openDetailModal = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsDetailModalOpen(true);
  };

  // Fonction pour fermer le modal
  const closeDetailModal = () => {
    setSelectedOrganization(null);
    setIsDetailModalOpen(false);
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (organization: Organization) => {
    console.log("📋 Organisation sélectionnée:", organization);
    console.log("📋 Metadata:", organization.metadata);
    console.log("📋 Phone:", organization.metadata?.phone);
    console.log("📋 Email:", organization.metadata?.email);
    console.log("📋 Website:", organization.metadata?.website);

    setSelectedOrganization(organization);
    setEditFormData({
      name: organization.name,
      description: organization.description,
      address: organization.address,
      type: organization.type,
      phone: organization.metadata?.phone || "",
      email: organization.metadata?.email || "",
      website: organization.metadata?.website || "",
      metadata: {
        city: organization.metadata?.city || "",
        email: organization.metadata?.email || "",
        phone: organization.metadata?.phone || "",
        region: organization.metadata?.region || "",
        website: organization.metadata?.website || "",
        postal_code: organization.metadata?.postal_code || "",
      },
    });
    setIsEditModalOpen(true);
  };

  // Fonction pour fermer le modal d'édition
  const closeEditModal = () => {
    setSelectedOrganization(null);
    setIsEditModalOpen(false);
    setEditFormData({
      name: "",
      description: "",
      address: "",
      type: "public",
      phone: "",
      email: "",
      website: "",
      metadata: {
        city: "",
        email: "",
        phone: "",
        region: "",
        website: "",
        postal_code: "",
      },
    });
  };

  // Fonction pour ouvrir le modal de suppression
  const openDeleteModal = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsDeleteModalOpen(true);
  };

  // Fonction pour fermer le modal de suppression
  const closeDeleteModal = () => {
    setSelectedOrganization(null);
    setIsDeleteModalOpen(false);
  };

  // Fonction pour gérer les changements dans le formulaire d'édition
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("metadata.")) {
      const metadataField = name.split(".")[1];
      setEditFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value,
        },
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
      setError("Le nom de l'organisation est requis");
      return false;
    }
    if (!editFormData.description || !editFormData.description.trim()) {
      setError("La description est requise");
      return false;
    }
    if (!editFormData.address || !editFormData.address.trim()) {
      setError("L'adresse est requise");
      return false;
    }
    return true;
  };

  // Fonction pour mettre à jour une organisation
  const handleUpdateOrganization = async () => {
    if (!selectedOrganization) return;

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

      // Construire les données avec les champs optionnels
      const apiData: any = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        address: editFormData.address.trim(),
        type: editFormData.type,
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (editFormData.phone && editFormData.phone.trim()) {
        apiData.phone = editFormData.phone.trim();
      }
      if (editFormData.email && editFormData.email.trim()) {
        apiData.email = editFormData.email.trim();
      }
      if (editFormData.website && editFormData.website.trim()) {
        apiData.website = editFormData.website.trim();
      }

      console.log("🔄 Mise à jour de l'organisation:", apiData);
      console.log("🔄 ID de l'organisation:", selectedOrganization.id);
      console.log("🔄 Token:", token ? "Présent" : "Manquant");

      const response = await axiosInstance.put(
        `/admin/reference-data/organizations/${selectedOrganization.id}`,
        apiData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🔄 Réponse API:", response);
      console.log("🔄 Status:", response.status);
      console.log("🔄 Data:", response.data);

      if (response.data.success) {
        console.log(
          "✅ Organisation mise à jour avec succès:",
          response.data.result
        );
        // Rafraîchir la liste
        fetchOrganizations(pagination.page, searchTerm);
        closeEditModal();
      } else {
        console.log("❌ Erreur dans la réponse:", response.data);
        setError(
          response.data.message ||
            "Erreur lors de la mise à jour de l'organisation"
        );
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de la mise à jour:", err);
      console.error("❌ Status:", err.response?.status);
      console.error("❌ Data:", err.response?.data);
      console.error("❌ Message:", err.message);
      console.error(
        "❌ Erreur complète:",
        JSON.stringify(err.response?.data, null, 2)
      );

      // Afficher un toast avec l'erreur
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la mise à jour de l'organisation";
      toast.error(errorMessage);
      setError(errorMessage);

      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour supprimer une organisation
  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const response = await axiosInstance.delete(
        `/admin/reference-data/organizations/${selectedOrganization.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Rafraîchir la liste
        fetchOrganizations(pagination.page, searchTerm);
        closeDeleteModal();
        console.log("✅ Organisation supprimée avec succès");
      } else {
        setError(response.data.message || "Erreur lors de la suppression");
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de la suppression:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        setError(
          err.message || "Erreur lors de la suppression de l'organisation"
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    fetchOrganizations(newPage, searchTerm);
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

  // Fonction pour obtenir la couleur du type
  const getTypeColor = (type: string) => {
    return type === "public" ? "text-blue-600" : "text-green-600";
  };

  // Fonction pour traduire le type
  const getTypeTranslation = (type: string) => {
    switch (type) {
      case "public":
        return t("public") || "Public";
      case "private":
        return t("private") || "Privé";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageMeta
          title="Commerce Tracking | Organisations"
          description="Liste des organisations"
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
          title="Commerce Tracking | Organisations"
          description="Liste des organisations"
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
        title="Commerce Tracking | Organisations"
        description="Liste des organisations"
      />

      <PageBreadcrumb pageTitle={t("organizations_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_organization")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/organizations/add")}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("add_organization") || "Ajouter une Organisation"}
              </Button>
            </div>
          </div>

          {/* Organizations Table */}
          <ComponentCard title={t("organizations_list")}>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loading")}...
                </p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? t("no_organizations_found")
                    : t("no_organizations")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("organization_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("type")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((organization) => (
                      <tr
                        key={organization.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium">
                                {organization.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {organization.metadata?.email || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                              organization.type
                            )}`}
                          >
                            {getTypeTranslation(organization.type)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {organization.country.flag}
                            </span>
                            <span className="text-sm">
                              {organization.country.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(organization)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t("details")}
                            </button>
                            <button
                              onClick={() => openEditModal(organization)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => openDeleteModal(organization)}
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
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        className="max-w-4xl"
      >
        <ModalHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("organization_details") || "Détails de l'Organisation"}
          </h3>
        </ModalHeader>
        <div className="px-6 py-4">
          {selectedOrganization && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("general_information") || "Informations générales"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("organization_name") || "Nom de l'organisation"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("type") || "Type"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {getTypeTranslation(selectedOrganization.type)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("description") || "Description"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("address") || "Adresse"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("contact_information") || "Informations de contact"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("email") || "Email"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.metadata?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("phone") || "Téléphone"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.metadata?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("website") || "Site web"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.metadata?.website ? (
                        <a
                          href={selectedOrganization.metadata.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedOrganization.metadata.website}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations géographiques */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("geographic_information") || "Informations géographiques"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("country") || "Pays"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedOrganization.country.flag}{" "}
                      {selectedOrganization.country.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("dates") || "Dates"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("created_at") || "Créé le"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(selectedOrganization.created_at)}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-10">
            {t("edit")} {t("organization")}
          </h3>
        </ModalHeader>
        <div className="px-6 py-4">
          {selectedOrganization && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateOrganization();
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
                        Erreur
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("organization_name") || "Nom de l'organisation"}{" "}
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
                    {t("type") || "Type"}
                  </label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="public">{t("public") || "Public"}</option>
                    <option value="private">{t("private") || "Privé"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("description") || "Description"}{" "}
                  <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("address") || "Adresse"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  rows={2}
                  disabled={editLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("phone") || "Téléphone"}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("email") || "Email"}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Site web */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("website") || "Site web"}
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={editFormData.website}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
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
            onClick={handleUpdateOrganization}
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
      {selectedOrganization && isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDeleteModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("confirm_delete")}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("delete_organization_message") ||
                  "Êtes-vous sûr de vouloir supprimer l'organisation"}{" "}
                <strong>{selectedOrganization.name}</strong> ?
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="px-4 py-2"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleDeleteOrganization}
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
    </div>
  );
}
