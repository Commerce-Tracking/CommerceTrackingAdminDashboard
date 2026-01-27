import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeIcon } from "../../icons";
import { Modal } from "../../components/ui/modal";
import { ModalHeader } from "../../components/ui/modal/ModalHeader";
import { Plus } from "lucide-react";

// Interface pour les données des acteurs/chefs d'équipe
interface Actor {
  id: number;
  public_id: string;
  user_id: number;
  organization_id: number;
  team_manager_id: number | null;
  supervisor_id: number | null;
  country_id: number;
  collection_point_id: number | null;
  last_name: string;
  first_name: string;
  phone: string;
  email: string;
  gender: "M" | "F";
  address: string;
  marital_status: string;
  status: "active" | "inactive";
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  actor_role: "supervisor" | "team_manager" | "collector";
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    public_id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string | null;
    role_id: number;
    status: "active" | "inactive";
    is_online: number;
    last_connected_at: string | null;
    created_at: string;
    updated_at: string;
  };
  organization: {
    id: number;
    public_id: string;
    name: string;
    description: string;
    address: string;
    type: string;
    country_id: number;
    metadata: {
      city: string;
      email: string;
      phone: string;
      region: string;
      website: string;
    };
    created_at: string;
    updated_at: string;
  };
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
  collectionPoint: any | null;
  teamManager: Actor | null;
  supervisor: Actor | null;
}

interface ActorsResponse {
  success: boolean;
  message: string;
  result: {
    data: Actor[];
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

export default function TeamManagersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    gender: "M",
    marital_status: "single",
    date_of_birth: "",
    place_of_birth: "",
    nationality: "",
    country_id: "",
    supervisor_id: "",
    status: "active",
  });
  const [supervisors, setSupervisors] = useState<Actor[]>([]);
  const [filteredSupervisors, setFilteredSupervisors] = useState<Actor[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fonction pour récupérer les acteurs
  const fetchActors = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      let url = `/admin/actors?actor_role=team_manager&page=${page}&limit=${pagination.limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const apiResponse: ActorsResponse = response.data;
        setActors(apiResponse.result.data);
        setPagination(apiResponse.result.pagination);
      } else {
        setError("Erreur lors de la récupération des chefs d'équipe");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        setError(
          err.message || "Erreur lors de la récupération des chefs d'équipe"
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
        fetchActors(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fonction pour charger les éditeurs (supervisors)
  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/actors?actor_role=supervisor",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const supervisorsData = response.data.result.data || [];
        setSupervisors(supervisorsData);
        setFilteredSupervisors(supervisorsData);
      }
    } catch (err: any) {
    }
  };

  // Fonction pour charger les pays
  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get("/common-data/countries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCountries(response.data.result || []);
      }
    } catch (err: any) {
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchActors();
    fetchSupervisors();
    fetchCountries();
  }, []);

  // Fonction pour filtrer les éditeurs selon le pays sélectionné
  useEffect(() => {
    if (editFormData.country_id) {
      const filtered = supervisors.filter(
        (supervisor) =>
          supervisor.country_id === parseInt(editFormData.country_id)
      );
      setFilteredSupervisors(filtered);

      // Réinitialiser l'éditeur si le pays change
      if (editFormData.supervisor_id) {
        const currentSupervisor = supervisors.find(
          (s) => s.id === parseInt(editFormData.supervisor_id)
        );
        if (
          currentSupervisor &&
          currentSupervisor.country_id !== parseInt(editFormData.country_id)
        ) {
          setEditFormData((prev) => ({ ...prev, supervisor_id: "" }));
        }
      }
    } else {
      setFilteredSupervisors(supervisors);
    }
  }, [editFormData.country_id, supervisors]);

  // Fonction pour ouvrir le modal de détails
  const openDetailModal = (actor: Actor) => {
    setSelectedActor(actor);
    setIsDetailModalOpen(true);
  };

  // Fonction pour fermer le modal
  const closeDetailModal = () => {
    setSelectedActor(null);
    setIsDetailModalOpen(false);
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (actor: Actor) => {
    setSelectedActor(actor);
    setEditFormData({
      first_name: actor.first_name,
      last_name: actor.last_name,
      email: actor.email,
      phone: actor.phone,
      address: actor.address,
      gender: actor.gender,
      marital_status: actor.marital_status,
      date_of_birth: actor.date_of_birth,
      place_of_birth: actor.place_of_birth,
      nationality: actor.nationality,
      country_id: actor.country_id?.toString() || "",
      supervisor_id: actor.supervisor_id?.toString() || "",
      status: actor.status,
    });
    setIsEditModalOpen(true);
  };

  // Fonction pour fermer le modal d'édition
  const closeEditModal = () => {
    setSelectedActor(null);
    setIsEditModalOpen(false);
    setEditFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      gender: "M",
      marital_status: "single",
      date_of_birth: "",
      place_of_birth: "",
      nationality: "",
      country_id: "",
      supervisor_id: "",
      status: "active",
    });
  };

  // Fonction pour gérer les changements dans le formulaire d'édition
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

  // Fonction pour valider le formulaire d'édition
  const validateEditForm = () => {
    if (!editFormData.first_name || !editFormData.first_name.trim()) {
      setError("Le prénom est requis");
      return false;
    }
    if (!editFormData.last_name || !editFormData.last_name.trim()) {
      setError("Le nom est requis");
      return false;
    }
    if (!editFormData.email || !editFormData.email.trim()) {
      setError("L'email est requis");
      return false;
    }
    if (!editFormData.phone || !editFormData.phone.trim()) {
      setError("Le téléphone est requis");
      return false;
    }
    if (!editFormData.country_id || !editFormData.country_id.trim()) {
      setError("Le pays est requis");
      return false;
    }
    if (!editFormData.supervisor_id || !editFormData.supervisor_id.trim()) {
      setError("L'éditeur est requis");
      return false;
    }
    return true;
  };

  // Fonction pour mettre à jour un chef d'équipe
  const handleUpdateActor = async () => {
    if (!selectedActor) return;

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

      const apiData: any = {
        first_name: editFormData.first_name.trim(),
        last_name: editFormData.last_name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        address: editFormData.address ? editFormData.address.trim() : "",
        gender: editFormData.gender,
        marital_status: editFormData.marital_status,
        date_of_birth: editFormData.date_of_birth,
        place_of_birth: editFormData.place_of_birth
          ? editFormData.place_of_birth.trim()
          : "",
        nationality: editFormData.nationality
          ? editFormData.nationality.trim()
          : "",
        status: editFormData.status,
      };

      // Ajouter country_id si défini
      if (editFormData.country_id) {
        apiData.country_id = parseInt(editFormData.country_id);
      }

      // Ajouter supervisor_id si défini
      if (editFormData.supervisor_id) {
        apiData.supervisor_id = parseInt(editFormData.supervisor_id);
      } else {
        apiData.supervisor_id = null;
      }


      const response = await axiosInstance.put(
        `/admin/actors/${selectedActor.id}`,
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
        fetchActors(pagination.page, searchTerm);
        closeEditModal();
      } else {
        setError(
          response.data.message ||
            "Erreur lors de la mise à jour du chef d'équipe"
        );
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Erreur lors de la mise à jour du chef d'équipe"
        );
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour ouvrir le modal de suppression
  const openDeleteModal = (actor: Actor) => {
    setSelectedActor(actor);
    setIsDeleteModalOpen(true);
  };

  // Fonction pour fermer le modal de suppression
  const closeDeleteModal = () => {
    setSelectedActor(null);
    setIsDeleteModalOpen(false);
  };

  // Fonction pour supprimer un acteur
  const handleDeleteActor = async () => {
    if (!selectedActor) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const response = await axiosInstance.delete(
        `/admin/actors/${selectedActor.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Rafraîchir la liste
        fetchActors(pagination.page, searchTerm);
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
          err.message || "Erreur lors de la suppression du chef d'équipe"
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    fetchActors(newPage, searchTerm);
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

  // Fonction pour obtenir le statut en ligne
  const getOnlineStatus = (isOnline: number) => {
    return isOnline === 1 ? "En ligne" : "Hors ligne";
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    return status === "active" ? "text-green-600" : "text-red-600";
  };

  // Fonction pour obtenir la couleur du statut en ligne
  const getOnlineStatusColor = (isOnline: number) => {
    return isOnline === 1 ? "text-green-600" : "text-gray-500";
  };

  // Fonction pour traduire le rôle
  const getRoleTranslation = (role: string) => {
    switch (role) {
      case "supervisor":
        return t("supervisor") || "Superviseur";
      case "team_manager":
        return t("team_manager") || "Chef d'équipe";
      case "collector":
        return t("collector") || "Collecteur";
      default:
        return role;
    }
  };

  // Fonction pour traduire le statut marital
  const getMaritalStatusTranslation = (status: string) => {
    switch (status) {
      case "single":
        return t("single") || "Célibataire";
      case "married":
        return t("married") || "Marié(e)";
      case "divorced":
        return t("divorced") || "Divorcé(e)";
      case "widowed":
        return t("widowed") || "Veuf/Veuve";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageMeta
          title="Commerce Tracking | Chefs d'équipe"
          description="Liste des chefs d'équipe"
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
          title="Commerce Tracking | Chefs d'équipe"
          description="Liste des chefs d'équipe"
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
        title="Commerce Tracking | Chefs d'équipe"
        description="Liste des chefs d'équipe"
      />

      <PageBreadcrumb pageTitle={t("team_managers_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_team_manager")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/team-managers/add")}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("add_team_manager") || "Ajouter un Chef d'équipe"}
              </Button>
            </div>
          </div>

          {/* Team Managers Table */}
          <ComponentCard title={t("team_managers_list")}>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loading")}...
                </p>
              </div>
            ) : actors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? t("no_team_managers_found")
                    : t("no_team_managers")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("team_manager_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("role")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("country")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("status")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actors.map((actor) => (
                      <tr
                        key={actor.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {actor.first_name.charAt(0)}
                                  {actor.last_name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium">
                                {actor.first_name} {actor.last_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {actor.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {getRoleTranslation(actor.actor_role)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {actor.country.flag}
                            </span>
                            <span className="text-sm">
                              {actor.country.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              actor.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {actor.status === "active"
                              ? t("active")
                              : t("inactive")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(actor)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t("details")}
                            </button>
                            <button
                              onClick={() => openEditModal(actor)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => openDeleteModal(actor)}
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
            {t("team_manager_details") || "Détails du Chef d'équipe"}
          </h3>
        </ModalHeader>
        <div className="px-6 py-4">
          {selectedActor && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("personal_information") || "Informations personnelles"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("first_name") || "Prénom"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.first_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("last_name") || "Nom"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("email") || "Email"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("phone") || "Téléphone"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("gender") || "Genre"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.gender === "M"
                        ? t("male") || "Homme"
                        : t("female") || "Femme"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("marital_status") || "Statut marital"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {getMaritalStatusTranslation(
                        selectedActor.marital_status
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("date_of_birth") || "Date de naissance"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(selectedActor.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("place_of_birth") || "Lieu de naissance"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.place_of_birth}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("nationality") || "Nationalité"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.nationality}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("address") || "Adresse"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("professional_information") ||
                    "Informations professionnelles"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("role") || "Rôle"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {getRoleTranslation(selectedActor.actor_role)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("organization") || "Organisation"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.organization
                        ? selectedActor.organization.name
                        : t("no_organization") || "Aucune organisation"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("country") || "Pays"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.country.flag} {selectedActor.country.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("status") || "Statut"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.status === "active"
                        ? t("active") || "Actif"
                        : t("inactive") || "Inactif"}
                    </p>
                  </div>
                  {selectedActor.supervisor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("supervisor") || "Superviseur"}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedActor.supervisor.first_name}{" "}
                        {selectedActor.supervisor.last_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations de connexion */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t("connection_information") || "Informations de connexion"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("username") || "Nom d'utilisateur"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedActor.user.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("online_status") || "Statut en ligne"}
                    </label>
                    <p
                      className={`mt-1 text-sm ${getOnlineStatusColor(
                        selectedActor.user.is_online
                      )}`}
                    >
                      {getOnlineStatus(selectedActor.user.is_online)}
                    </p>
                  </div>
                  {selectedActor.user.last_connected_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("last_connection") || "Dernière connexion"}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(selectedActor.user.last_connected_at)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("created_at") || "Créé le"}
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(selectedActor.created_at)}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("edit")} {t("team_manager")}
          </h3>
        </ModalHeader>
        <div className="px-6 py-4">
          {selectedActor && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateActor();
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

              {/* Informations personnelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("first_name") || "Prénom"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editFormData.first_name}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("last_name") || "Nom"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={editFormData.last_name}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("email") || "Email"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("phone") || "Téléphone"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("address") || "Adresse"}
                </label>
                <textarea
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  rows={3}
                  disabled={editLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("gender") || "Genre"}
                  </label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="M">{t("male") || "Homme"}</option>
                    <option value="F">{t("female") || "Femme"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("marital_status") || "Statut marital"}
                  </label>
                  <select
                    name="marital_status"
                    value={editFormData.marital_status}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="single">
                      {t("single") || "Célibataire"}
                    </option>
                    <option value="married">
                      {t("married") || "Marié(e)"}
                    </option>
                    <option value="divorced">
                      {t("divorced") || "Divorcé(e)"}
                    </option>
                    <option value="widowed">
                      {t("widowed") || "Veuf/Veuve"}
                    </option>
                  </select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("date_of_birth") || "Date de naissance"}
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={editFormData.date_of_birth}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("place_of_birth") || "Lieu de naissance"}
                  </label>
                  <input
                    type="text"
                    name="place_of_birth"
                    value={editFormData.place_of_birth}
                    onChange={handleEditInputChange}
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("nationality") || "Nationalité"}
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={editFormData.nationality}
                  onChange={handleEditInputChange}
                  disabled={editLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("country") || "Pays"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="country_id"
                    value={editFormData.country_id}
                    onChange={handleEditInputChange}
                    required
                    disabled={editLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">
                      {t("select_country") || "Sélectionner un pays"}
                    </option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("supervisor") || "Éditeur"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supervisor_id"
                    value={editFormData.supervisor_id}
                    onChange={handleEditInputChange}
                    required
                    disabled={editLoading || !editFormData.country_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">
                      {t("select_supervisor") || "Sélectionner un éditeur"}
                    </option>
                    {filteredSupervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.first_name} {supervisor.last_name} (
                        {supervisor.email})
                      </option>
                    ))}
                  </select>
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
            onClick={handleUpdateActor}
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
      {selectedActor && isDeleteModalOpen && (
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
                {t("delete_team_manager_message") ||
                  "Êtes-vous sûr de vouloir supprimer le chef d'équipe"}{" "}
                <strong>
                  {selectedActor.first_name} {selectedActor.last_name}
                </strong>{" "}
                ?
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
                  onClick={handleDeleteActor}
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
