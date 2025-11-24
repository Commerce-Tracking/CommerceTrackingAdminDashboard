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

interface Animal {
  id: number;
  public_id: string;
  name: string;
  animal_type_id: number;
  created_at: string;
  updated_at: string;
  animalType?: {
    id: number;
    public_id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
  animalCodes?: {
    id: number;
    animal_id: number;
    animal_nature_id: number;
    hs_code: string;
    // abbreviation: string;
    created_at: string | null;
    updated_at: string | null;
    animalNature?: {
      id: number;
      name_fr?: string;
      name_en?: string;
      created_at: string;
      updated_at: string;
    };
  }[];
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
    data: Animal[];
    pagination: PaginationInfo;
  };
  errors: any;
  except: any;
}

const AnimalsListPage = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    animal_type_id: "",
  });
  const [editNaturesList, setEditNaturesList] = useState<
    { animal_nature_id: number; hs_code: string; }[]
  >([]);
  const [editNatureFormData, setEditNatureFormData] = useState({
    animal_nature_id: "",
    hs_code: "",
    // abbreviation: "",
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);
  const [animalTypes, setAnimalTypes] = useState<any[]>([]);
  const [animalNatures, setAnimalNatures] = useState<any[]>([]);
  const { t, i18n } = useTranslation();

  // Récupérer la liste des types d'animaux pour le modal d'édition
  const fetchAnimalTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get("/common-data/animal-types", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const data =
          response.data.result?.data ||
          response.data.result ||
          response.data.data ||
          [];
        setAnimalTypes(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des types d'animaux:", err);
    }
  };

  // Récupérer la liste des natures d'animaux pour le modal d'édition
  const fetchAnimalNatures = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/animal-natures",
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
        setAnimalNatures(response.data.result.data || []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des natures d'animaux:", err);
    }
  };

  const fetchAnimals = async (page: number = 1) => {
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

      // Construction des paramètres de requête - l'API nécessite toujours page et limit
      const params: any = {
        page: page || 1,
        limit: pagination.limit || 10,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axiosInstance.get(
        "/admin/reference-data/animals",
        {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const apiResponse: ApiResponse = response.data;
        setAnimals(apiResponse.result.data || []);
        setPagination(apiResponse.result.pagination);
      } else {
        toast.error(t("error"), {
          description:
            response.data.message || "Erreur lors du chargement des animaux",
        });
        setAnimals([]);
      }
    } catch (err: any) {
      console.error("Erreur API animaux:", err);
      console.error("URL:", err.config?.url);
      console.error("Status:", err.response?.status);
      console.error("Response:", err.response?.data);

      let errorMessage = "Erreur lors du chargement des animaux.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Token invalide ou non autorisé.";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
      } else if (err.response?.status === 400) {
        console.error("Détails de l'erreur 400:", err.response?.data);
        if (err.response?.data?.except) {
          console.error("Paramètres invalides:", err.response.data.except);
        }
        errorMessage =
          err.response?.data?.message ||
          "Requête invalide. Vérifiez les paramètres.";
        toast.error(t("error"), {
          description: errorMessage,
        });
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
        toast.error(t("error"), {
          description: errorMessage,
        });
      }
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals(1);
    fetchAnimalTypes();
    fetchAnimalNatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAnimals(1);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSearch = () => {
    fetchAnimals(1);
  };

  const handlePageChange = (page: number) => {
    fetchAnimals(page);
  };

  const clearFilters = () => {
    setSearchTerm("");
    fetchAnimals(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Fonctions pour les détails
  const openDetailModal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAnimal(null);
  };

  // Fonctions pour l'édition
  const openEditModal = (animal: Animal) => {
    setEditingAnimal(animal);
    setEditFormData({
      name: animal.name,
      animal_type_id: animal.animal_type_id.toString(),
    });

    // Charger les natures existantes (animalCodes)
    if (animal.animalCodes && animal.animalCodes.length > 0) {
      const natures = animal.animalCodes.map((code) => ({
        animal_nature_id: code.animal_nature_id,
        hs_code: code.hs_code,
        // abbreviation: code.abbreviation,
      }));
      setEditNaturesList(natures);
    } else {
      setEditNaturesList([]);
    }

    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAnimal(null);
    setEditFormData({
      name: "",
      animal_type_id: "",
    });
    setEditNaturesList([]);
    setEditNatureFormData({
      animal_nature_id: "",
      hs_code: "",
      // abbreviation: "",
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
      editNatureFormData.animal_nature_id &&
      editNatureFormData.hs_code.trim() 
      // editNatureFormData.abbreviation.trim()
    ) {
      const newNature = {
        animal_nature_id: parseInt(editNatureFormData.animal_nature_id),
        hs_code: editNatureFormData.hs_code.trim(),
        // abbreviation: editNatureFormData.abbreviation.trim(),
      };
      setEditNaturesList([...editNaturesList, newNature]);
      setEditNatureFormData({
        animal_nature_id: "",
        hs_code: "",
        // abbreviation: "",
      });
    }
  };

  const handleRemoveEditNature = (index: number) => {
    const newList = editNaturesList.filter((_, i) => i !== index);
    setEditNaturesList(newList);
  };

  const handleUpdateAnimal = async () => {
    if (!editingAnimal) return;

    // Validation
    if (!editFormData.name.trim()) {
      toast.error(t("error"), {
        description: t("animal_name") + " " + t("is_required"),
      });
      return;
    }
    if (!editFormData.animal_type_id) {
      toast.error(t("error"), {
        description: t("animal_type") + " " + t("is_required"),
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
        animal_type_id: parseInt(editFormData.animal_type_id),
      };

      // Ajouter le tableau natures si des natures ont été modifiées
      if (editNaturesList.length > 0) {
        requestData.natures = editNaturesList;
      }

      const response = await axiosInstance.put(
        `/admin/reference-data/animals/${editingAnimal.id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Animal mis à jour avec succès",
        });

        // Fermer le modal
        closeEditModal();

        // Rafraîchir la liste
        setTimeout(() => {
          fetchAnimals(pagination.page);
        }, 500);
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la mise à jour",
        });
      }
    } catch (err: any) {
      console.error("Erreur API mise à jour :", err);
      let errorMessage = "Erreur lors de la mise à jour de l'animal.";
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
  const openDeleteConfirmation = (animal: Animal) => {
    setAnimalToDelete(animal);
  };

  const closeDeleteConfirmation = () => {
    setAnimalToDelete(null);
  };

  const handleDeleteAnimal = async () => {
    if (!animalToDelete) {
      console.error("❌ Aucun animal à supprimer");
      return;
    }

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
        `/admin/reference-data/animals/${animalToDelete.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        closeDeleteConfirmation();

        // Mettre à jour la liste locale en supprimant l'animal
        const filteredAnimals = animals.filter(
          (a) => a.id !== animalToDelete.id
        );

        // Mettre à jour la liste locale
        setAnimals(filteredAnimals);

        // Ajuster le total après suppression
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));

        toast.success(t("success"), {
          description: response.data.message || "Animal supprimé avec succès",
        });
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la suppression",
        });
      }
    } catch (err: any) {
      console.error("❌ Erreur API suppression:", err);

      let errorMessage = "Erreur lors de la suppression de l'animal.";
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
        title="CT | Liste des animaux"
        description="Consulter la liste des animaux pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("animals_list")} />
      <div className="page-container">
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={t("search_animal")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Link to="/animals/add">
              <Button className="px-6 py-2">{t("add_animal")}</Button>
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

          {/* Animals Table */}
          <ComponentCard title={t("animals_list")}>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loading")}...
                </p>
              </div>
            ) : animals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? t("no_search_results") : t("no_animals_found")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("animal_name")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("animal_type")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {t("associated_codes") || "Codes associés"}
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
                    {animals.map((animal) => (
                      <tr
                        key={animal.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {animal.name}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {animal.animalType?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">
                          {animal.animalCodes?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatDate(animal.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openDetailModal(animal)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {t("details")}
                            </button>
                            <button
                              onClick={() => openEditModal(animal)}
                              className="px-3 py-1 text-sm bg-blue-900 text-white rounded hover:bg-blue-800"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => openDeleteConfirmation(animal)}
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
      {isDetailModalOpen && selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm"
            onClick={closeDetailModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-10">
                {t("animal_details") || "Détails de l'animal"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_name")}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                    {selectedAnimal.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_type")}
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                    {selectedAnimal.animalType?.name || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("associated_codes") || "Codes associés"} (
                    {selectedAnimal.animalCodes?.length || 0})
                  </label>
                  {selectedAnimal.animalCodes &&
                  selectedAnimal.animalCodes.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                      <div className="space-y-2">
                        {selectedAnimal.animalCodes.map((code, index) => (
                          <div
                            key={code.id || index}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {code.hs_code || "N/A"}
                                </span>
                                {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({code.abbreviation})
                                </span> */}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {i18n.language === "fr"
                                  ? code.animalNature?.name_fr
                                  : code.animalNature?.name_en}
                                {code.animalNature && " • "}
                                {t("animal_nature_id")}: {code.animal_nature_id}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 text-center">
                      {t("no_codes_associated") || "Aucun code associé"}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("date_creation")}
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                      {formatDate(selectedAnimal.created_at)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("last_update")}
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">
                      {formatDate(selectedAnimal.updated_at)}
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
                    openEditModal(selectedAnimal);
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
                {t("edit_animal") || "Modifier l'animal"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_name")} <span className="text-red-500">*</span>
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
                    {t("animal_type")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="animal_type_id"
                    value={editFormData.animal_type_id}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={editLoading}
                  >
                    <option value="">{t("select_animal_type")}</option>
                    {animalTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section pour ajouter des natures */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_nature") || "Nature de l'animal"}
                  </label>
                  <div className="mb-2 space-y-2">
                    <input
                      type="text"
                      name="hs_code"
                      value={editNatureFormData.hs_code}
                      onChange={handleEditNatureFormChange}
                      placeholder={t("hs_code") || "Code HS"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={editLoading}
                    />
                    {/* <input
                      type="text"
                      name="abbreviation"
                      value={editNatureFormData.abbreviation}
                      onChange={handleEditNatureFormChange}
                      placeholder={
                        t("enter_abbreviation") || "Abréviation (ex: BOV)"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={editLoading}
                    /> */}
                  </div>
                  <div className="flex gap-2">
                    <select
                      name="animal_nature_id"
                      value={editNatureFormData.animal_nature_id}
                      onChange={handleEditNatureFormChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={editLoading}
                    >
                      <option value="">
                        {t("select_animal_nature") || "Sélectionner une nature"}
                      </option>
                      {animalNatures && animalNatures.length > 0 ? (
                        animalNatures.map((nature) => (
                          <option key={nature.id} value={nature.id}>
                            {nature.name_fr || nature.name || nature.name_en}
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
                        !editNatureFormData.animal_nature_id ||
                        !editNatureFormData.hs_code.trim() 
                        // !editNatureFormData.abbreviation.trim()
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
                        const natureDetails = animalNatures.find(
                          (n) => n.id === nature.animal_nature_id
                        );
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {natureDetails?.name_fr ||
                                  natureDetails?.name ||
                                  natureDetails?.name_en ||
                                  nature.animal_nature_id}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {"•"}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                {nature.hs_code}
                              </span>
                              {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({nature.abbreviation})
                              </span> */}
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
                  onClick={handleUpdateAnimal}
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
      {animalToDelete && (
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
                <strong>{animalToDelete.name}</strong> ?
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
                  onClick={handleDeleteAnimal}
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

export default AnimalsListPage;
