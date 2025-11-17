import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface NatureFormData {
  animal_nature_id: number;
  hs_code: string;
  abbreviation: string;
}

interface AnimalFormData {
  name: string;
  animal_type_id: string;
  animal_nature_id: string;
  hs_code: string;
  abbreviation: string;
}

interface AnimalType {
  id: number;
  public_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface AnimalNature {
  id: number;
  name_fr?: string;
  name_en?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

const AddAnimal = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [animalNatures, setAnimalNatures] = useState<AnimalNature[]>([]);
  const [naturesList, setNaturesList] = useState<NatureFormData[]>([]);

  const [formData, setFormData] = useState<AnimalFormData>({
    name: "",
    animal_type_id: "",
    animal_nature_id: "",
    hs_code: "",
    abbreviation: "",
  });

  // Récupérer la liste des types d'animaux
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
        // Vérifier différentes structures de réponse possibles
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

  // Récupérer la liste des natures d'animaux
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
        const naturesData = response.data.result.data || [];
        setAnimalNatures(naturesData);
        console.log(`${naturesData.length} natures d'animaux chargées`);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des natures d'animaux:", err);
    }
  };

  useEffect(() => {
    fetchAnimalTypes();
    fetchAnimalNatures();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddNature = () => {
    if (
      formData.animal_nature_id &&
      formData.hs_code.trim() &&
      formData.abbreviation.trim()
    ) {
      const newNature: NatureFormData = {
        animal_nature_id: parseInt(formData.animal_nature_id),
        hs_code: formData.hs_code.trim(),
        abbreviation: formData.abbreviation.trim(),
      };
      setNaturesList([...naturesList, newNature]);
      // Réinitialiser les champs
      setFormData((prev) => ({
        ...prev,
        animal_nature_id: "",
        hs_code: "",
        abbreviation: "",
      }));
    }
  };

  const handleRemoveNature = (index: number) => {
    const newList = naturesList.filter((_, i) => i !== index);
    setNaturesList(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error(t("error"), {
          description: t("animal_name") + " " + t("is_required"),
        });
        setLoading(false);
        return;
      }

      if (!formData.animal_type_id) {
        toast.error(t("error"), {
          description: t("animal_type") + " " + t("is_required"),
        });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
        setLoading(false);
        return;
      }

      const requestData: any = {
        name: formData.name.trim(),
        animal_type_id: parseInt(formData.animal_type_id),
      };

      // Ajouter le tableau natures seulement s'il contient des éléments
      if (naturesList.length > 0) {
        requestData.natures = naturesList;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/animals",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API création animal :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message ||
            t("animal_created_successfully") ||
            "Animal créé avec succès",
        });

        // Réinitialiser le formulaire au lieu de rediriger
        handleReset();
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      console.error("Erreur API création animal :", err);
      let errorMessage = "Erreur lors de la création de l'animal.";

      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Token invalide ou non autorisé.";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        setTimeout(() => {
          navigate("/signin");
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

  const handleReset = () => {
    setFormData({
      name: "",
      animal_type_id: "",
      animal_nature_id: "",
      hs_code: "",
      abbreviation: "",
    });
    setNaturesList([]);
  };

  return (
    <>
      <PageMeta
        title="CT | Ajouter un animal"
        description="Ajouter un nouvel animal pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_animal")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_animal")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("enter_animal_name")}
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_type")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="animal_type_id"
                    value={formData.animal_type_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                  >
                    <option value="">{t("select_animal_type")}</option>
                    {animalTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section pour ajouter des natures */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("animal_nature") || "Nature de l'animal"}
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      name="animal_nature_id"
                      value={formData.animal_nature_id}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={loading}
                    >
                      <option value="">
                        {t("select_animal_nature") || "Sélectionner une nature"}
                      </option>
                      {animalNatures && animalNatures.length > 0 ? (
                        animalNatures.map((nature) => (
                          <option key={nature.id} value={nature.id}>
                            {nature.name_fr ||
                              nature.name_en ||
                              nature.name ||
                              `Nature ${nature.id}`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          Aucune nature disponible
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("hs_code") || "Code HS"}
                      </label>
                      <Input
                        type="text"
                        name="hs_code"
                        value={formData.hs_code}
                        onChange={handleInputChange}
                        placeholder={t("enter_hs_code") || "Ex: 0101.21"}
                        className="w-full"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("abbreviation") || "Abréviation"}
                      </label>
                      <Input
                        type="text"
                        name="abbreviation"
                        value={formData.abbreviation}
                        onChange={handleInputChange}
                        placeholder={t("enter_abbreviation") || "Ex: BOV"}
                        className="w-full"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNature}
                    disabled={
                      loading ||
                      !formData.animal_nature_id ||
                      !formData.hs_code.trim() ||
                      !formData.abbreviation.trim()
                    }
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50"
                  >
                    {t("add") || "Ajouter"}
                  </button>
                </div>

                {/* Liste des natures ajoutées */}
                {naturesList.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {naturesList.map((nature, index) => {
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
                                natureDetails?.name_en ||
                                natureDetails?.name ||
                                nature.animal_nature_id}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {"•"}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              {nature.hs_code}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {"•"}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {nature.abbreviation}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveNature(index);
                            }}
                            disabled={loading}
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

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("reset")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/animals/list")}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("cancel")}
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50"
                >
                  {loading ? t("creating") : t("create")}
                </button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default AddAnimal;
