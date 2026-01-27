import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeIcon, EyeCloseIcon } from "../../icons";
import { toast } from "sonner";

// Interface pour les donnÃ©es de formulaire
interface FormData {
  organization_id: string;
  team_manager_id: string;
  country_id: string;
  collection_point_id: string;
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
  actor_role: "collector";
  password: string;
  confirm_password: string;
}

// Interface pour les pays
interface Country {
  id: number;
  public_id: string;
  name: string;
  iso: string;
  prefix: string;
  flag: string;
  status: string;
}

// Interface pour les points de collecte
interface CollectionPoint {
  id: number;
  public_id: string;
  name: string;
  locality: string;
  region: string | null;
  country_id: number;
  status: string;
}

// Interface pour les team managers
interface TeamManager {
  id: number;
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  actor_role: string;
  country_id: number;
}

// Interface pour les organisations
interface Organization {
  id: number;
  public_id: string;
  name: string;
  description: string;
  address: string;
  type: string;
  country_id: number;
  metadata: {
    city?: string;
    email?: string;
    phone?: string;
    region?: string;
    website?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function AddCollector() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>(
    []
  );
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    organization_id: "",
    team_manager_id: "",
    country_id: "",
    collection_point_id: "",
    last_name: "",
    first_name: "",
    phone: "",
    email: "",
    gender: "M",
    address: "",
    marital_status: "single",
    status: "active",
    date_of_birth: "",
    place_of_birth: "",
    nationality: "",
    actor_role: "collector",
    password: "",
    confirm_password: "",
  });

  // Charger les donnÃ©es de rÃ©fÃ©rence
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoadingData(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Token d'authentification manquant");
          return;
        }

        // Charger les pays
        const countriesResponse = await axiosInstance.get(
          "/common-data/countries",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const countriesData =
          countriesResponse.data.result?.data ||
          countriesResponse.data.data ||
          countriesResponse.data.result ||
          [];
        setCountries(countriesData);

        // Charger les points de collecte
        const collectionPointsResponse = await axiosInstance.get(
          "/admin/reference-data/collection-points",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const collectionPointsData =
          collectionPointsResponse.data.result?.data ||
          collectionPointsResponse.data.data ||
          collectionPointsResponse.data.result ||
          [];
        setCollectionPoints(collectionPointsData);

        // Charger les team managers
        const teamManagersResponse = await axiosInstance.get(
          "/admin/actors?actor_role=team_manager",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const teamManagersData =
          teamManagersResponse.data.result?.data ||
          teamManagersResponse.data.data ||
          teamManagersResponse.data.result ||
          [];
        setTeamManagers(teamManagersData);

        // Charger les organisations
        const organizationsResponse = await axiosInstance.get(
          "/admin/reference-data/organizations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const organizationsData =
          organizationsResponse.data.result?.data ||
          organizationsResponse.data.data ||
          organizationsResponse.data.result ||
          [];
        setOrganizations(organizationsData);

      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "/signin";
          return;
        }
        setError("Erreur lors du chargement des donnÃ©es de rÃ©fÃ©rence");
      } finally {
        setLoadingData(false);
      }
    };

    fetchReferenceData();
  }, []);

  // GÃ©rer les changements dans le formulaire
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Effacer l'erreur du champ quand l'utilisateur tape
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Si le pays change, rÃ©initialiser le point de collecte
    if (name === "country_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        collection_point_id: "", // RÃ©initialiser le point de collecte
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Fonction pour dÃ©finir une erreur de champ spÃ©cifique
  const setFieldError = (fieldName: string, errorMessage: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: errorMessage,
    }));
  };

  // Fonction pour effacer toutes les erreurs
  const clearAllErrors = () => {
    setError(null);
    setFieldErrors({});
  };

  // Fonction pour obtenir la classe CSS d'un champ avec erreur
  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = fieldErrors[fieldName];
    return hasError
      ? `${baseClassName} border-red-500 focus:ring-red-500`
      : baseClassName;
  };

  // Fonction pour afficher l'erreur d'un champ
  const renderFieldError = (fieldName: string) => {
    const error = fieldErrors[fieldName];
    if (!error) return null;

    return (
      <div className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</div>
    );
  };

  // Valider le formulaire
  const validateForm = () => {

    // Effacer toutes les erreurs prÃ©cÃ©dentes
    clearAllErrors();
    let isValid = true;

    // Validation des champs obligatoires
    if (!formData.first_name.trim()) {
      setFieldError("first_name", "Le prÃ©nom est requis");
      isValid = false;
    }
    if (!formData.last_name.trim()) {
      setFieldError("last_name", "Le nom est requis");
      isValid = false;
    }
    if (!formData.email.trim()) {
      setFieldError("email", "L'email est requis");
      isValid = false;
    } else {
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setFieldError("email", "L'email n'est pas valide");
        isValid = false;
      }
    }
    if (!formData.phone.trim()) {
      setFieldError("phone", "Le tÃ©lÃ©phone est requis");
      isValid = false;
    }
    if (!formData.country_id) {
      setFieldError("country_id", "Le pays est requis");
      isValid = false;
    }

    // VÃ©rifier que le pays sÃ©lectionnÃ© existe
    const selectedCountry = countries.find(
      (c) => c.id === parseInt(formData.country_id)
    );
    if (formData.country_id && !selectedCountry) {
      setFieldError("country_id", "Le pays sÃ©lectionnÃ© n'est pas valide");
      isValid = false;
    }
    if (!formData.password.trim()) {
      setFieldError("password", "Le mot de passe est requis");
      isValid = false;
    }
    if (formData.password && formData.password !== formData.confirm_password) {
      setFieldError(
        "confirm_password",
        "Les mots de passe ne correspondent pas"
      );
      isValid = false;
    }
    if (formData.password && formData.password.length < 6) {
      setFieldError(
        "password",
        "Le mot de passe doit contenir au moins 6 caractÃ¨res"
      );
      isValid = false;
    }

    // Validation des IDs numÃ©riques
    if (formData.team_manager_id && isNaN(parseInt(formData.team_manager_id))) {
      setFieldError(
        "team_manager_id",
        "L'ID du chef d'Ã©quipe n'est pas valide"
      );
      isValid = false;
    }
    if (
      formData.collection_point_id &&
      isNaN(parseInt(formData.collection_point_id))
    ) {
      setFieldError(
        "collection_point_id",
        "L'ID du point de collecte n'est pas valide"
      );
      isValid = false;
    }
    if (formData.organization_id && isNaN(parseInt(formData.organization_id))) {
      setFieldError(
        "organization_id",
        "L'ID de l'organisation n'est pas valide"
      );
      isValid = false;
    }

    // Validation de compatibilitÃ© pays/point de collecte
    if (formData.collection_point_id) {
      const selectedCollectionPoint = collectionPoints.find(
        (cp) => cp.id === parseInt(formData.collection_point_id)
      );
      if (
        selectedCollectionPoint &&
        selectedCollectionPoint.country_id !== parseInt(formData.country_id)
      ) {
        setFieldError(
          "collection_point_id",
          "Le point de collecte doit appartenir au mÃªme pays que l'acteur"
        );
        isValid = false;
      }
    }

    return isValid;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      // PrÃ©parer les donnÃ©es pour l'API
      const apiData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        marital_status: formData.marital_status,
        status: formData.status,
        actor_role: formData.actor_role,
        password: formData.password,
        country_id: parseInt(formData.country_id),
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.address.trim()) {
        apiData.address = formData.address.trim();
      }
      if (formData.date_of_birth) {
        apiData.date_of_birth = formData.date_of_birth;
      }
      if (formData.place_of_birth.trim()) {
        apiData.place_of_birth = formData.place_of_birth.trim();
      }
      if (formData.nationality.trim()) {
        apiData.nationality = formData.nationality.trim();
      }
      if (formData.organization_id) {
        apiData.organization_id = parseInt(formData.organization_id);
      }
      if (formData.team_manager_id) {
        apiData.team_manager_id = parseInt(formData.team_manager_id);
      }
      if (formData.collection_point_id) {
        apiData.collection_point_id = parseInt(formData.collection_point_id);
      }



      const response = await axiosInstance.post("/admin/actors", apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      if (response.data.success) {
        toast.success(
          t("collector_created_successfully") || "Collecteur crÃ©Ã© avec succÃ¨s"
        );
        handleReset();
      } else {

        // Traiter l'erreur comme une erreur de validation
        const errorMessage =
          response.data.message || "Erreur lors de la crÃ©ation du collecteur";

        // Mapper l'erreur au champ appropriÃ©
        if (
          errorMessage.includes("tÃ©lÃ©phone") ||
          errorMessage.includes("phone") ||
          errorMessage
            .toLowerCase()
            .includes("utilisateur avec le tÃ©lÃ©phone") ||
          errorMessage.toLowerCase().includes("existe dÃ©jÃ ") ||
          errorMessage.toLowerCase().includes("phone already exists")
        ) {
          setFieldError("phone", errorMessage);
          toast.error(errorMessage);
        } else if (
          errorMessage.includes("email") ||
          errorMessage.toLowerCase().includes("utilisateur avec l'email") ||
          errorMessage.toLowerCase().includes("email already exists")
        ) {
          setFieldError("email", errorMessage);
          toast.error(errorMessage);
        } else {
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (err: any) {

      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      } else if (err.response?.status === 422 || err.response?.status === 400) {
        // Erreurs de validation - mapper aux champs spÃ©cifiques
        const validationErrors =
          err.response?.data?.errors || err.response?.data?.message;

        if (typeof validationErrors === "object" && validationErrors !== null) {
          // Mapper les erreurs aux champs
          Object.keys(validationErrors).forEach((field) => {
            const errorMessage = Array.isArray(validationErrors[field])
              ? validationErrors[field].join(", ")
              : validationErrors[field];
            setFieldError(field, errorMessage);
          });
        } else if (typeof validationErrors === "string") {
          // Si c'est une erreur gÃ©nÃ©rale, essayer de l'analyser
          if (
            validationErrors.includes("email") ||
            validationErrors
              .toLowerCase()
              .includes("utilisateur avec l'email") ||
            validationErrors.toLowerCase().includes("email existe dÃ©jÃ ")
          ) {
            setFieldError("email", validationErrors);
            toast.error(validationErrors);
          } else if (
            validationErrors.includes("tÃ©lÃ©phone") ||
            validationErrors.includes("phone") ||
            validationErrors.includes("97333302") || // NumÃ©ro spÃ©cifique dÃ©tectÃ©
            validationErrors
              .toLowerCase()
              .includes("utilisateur avec le tÃ©lÃ©phone") ||
            validationErrors.toLowerCase().includes("existe dÃ©jÃ ") ||
            validationErrors.toLowerCase().includes("dÃ©jÃ  existant")
          ) {
            setFieldError("phone", validationErrors);
            toast.error(validationErrors);
          } else if (
            validationErrors.includes("pays") ||
            validationErrors.includes("country")
          ) {
            setFieldError("country_id", validationErrors);
            toast.error(validationErrors);
          } else if (
            validationErrors.includes("point de collecte") ||
            validationErrors.includes("collection point")
          ) {
            setFieldError("collection_point_id", validationErrors);
            toast.error(validationErrors);
          } else {
            setError(validationErrors);
            toast.error(validationErrors);
          }
        } else {
          setError("Erreur de validation des donnÃ©es");
        }
      } else if (err.response?.status === 409) {
        // Erreur de conflit (duplication) - traiter comme erreur de validation
        const conflictMessage =
          err.response?.data?.message || "Conflit dÃ©tectÃ©";

        if (
          conflictMessage.includes("tÃ©lÃ©phone") ||
          conflictMessage.includes("phone") ||
          conflictMessage
            .toLowerCase()
            .includes("utilisateur avec le tÃ©lÃ©phone") ||
          conflictMessage.toLowerCase().includes("existe dÃ©jÃ ")
        ) {
          setFieldError("phone", conflictMessage);
          toast.error(conflictMessage);
        } else if (
          conflictMessage.includes("email") ||
          conflictMessage.toLowerCase().includes("utilisateur avec l'email")
        ) {
          setFieldError("email", conflictMessage);
          toast.error(conflictMessage);
        } else {
          setError(conflictMessage);
          toast.error(conflictMessage);
        }
      } else if (err.response?.status === 500) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Erreur interne du serveur (500). Veuillez vÃ©rifier les donnÃ©es envoyÃ©es.";
        setError(`Erreur serveur: ${errorMessage}`);
        toast.error(`Erreur serveur: ${errorMessage}`);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.errors ||
          err.message ||
          "Erreur lors de la crÃ©ation du collecteur";

        const finalErrorMessage = Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage;
        setError(finalErrorMessage);
        toast.error(finalErrorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // RÃ©initialiser le formulaire
  const handleReset = () => {
    setFormData({
      organization_id: "",
      team_manager_id: "",
      country_id: "",
      collection_point_id: "",
      last_name: "",
      first_name: "",
      phone: "",
      email: "",
      gender: "M",
      address: "",
      marital_status: "single",
      status: "active",
      date_of_birth: "",
      place_of_birth: "",
      nationality: "",
      actor_role: "collector",
      password: "",
      confirm_password: "",
    });
    clearAllErrors();
  };

  if (loadingData) {
    return (
      <div className="page-container">
        <PageMeta
          title="Commerce Tracking | Ajouter Collecteur"
          description="Ajouter un nouveau collecteur"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Chargement des donnÃ©es...</span>
        </div>
      </div>
    );
  }

  if (error && !loadingData) {
    return (
      <div className="page-container">
        <PageMeta
          title="Commerce Tracking | Ajouter Collecteur"
          description="Ajouter un nouveau collecteur"
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
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              RÃ©essayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageMeta
        title="Commerce Tracking | Ajouter Collecteur"
        description="Ajouter un nouveau collecteur"
      />

      <PageBreadcrumb
        pageTitle={t("add_collector") || "Ajouter un Collecteur"}
      />

      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_collector") || "Ajouter un Collecteur"}>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  {t("personal_information") || "Informations personnelles"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("first_name") || "PrÃ©nom"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={getFieldClassName(
                        "first_name",
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      )}
                      required
                      disabled={loading}
                    />
                    {renderFieldError("first_name")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("last_name") || "Nom"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={getFieldClassName(
                        "last_name",
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      )}
                      required
                      disabled={loading}
                    />
                    {renderFieldError("last_name")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("email") || "Email"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={getFieldClassName(
                        "email",
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      )}
                      required
                      disabled={loading}
                    />
                    {renderFieldError("email")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("phone") || "TÃ©lÃ©phone"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={getFieldClassName(
                        "phone",
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      )}
                      required
                      disabled={loading}
                    />
                    {renderFieldError("phone")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("gender") || "Genre"}
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={loading}
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
                      value={formData.marital_status}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="single">
                        {t("single") || "CÃ©libataire"}
                      </option>
                      <option value="married">
                        {t("married") || "MariÃ©(e)"}
                      </option>
                      <option value="divorced">
                        {t("divorced") || "DivorcÃ©(e)"}
                      </option>
                      <option value="widowed">
                        {t("widowed") || "Veuf/Veuve"}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("date_of_birth") || "Date de naissance"}
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      disabled={loading}
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
                      value={formData.place_of_birth}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("nationality") || "NationalitÃ©"}
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("status") || "Statut"}
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="active">{t("active") || "Actif"}</option>
                      <option value="inactive">
                        {t("inactive") || "Inactif"}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("address") || "Adresse"}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  {t("professional_information") ||
                    "Informations professionnelles"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("country") || "Pays"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country_id"
                      value={formData.country_id}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className={getFieldClassName(
                        "country_id",
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      )}
                    >
                      <option value="">
                        {t("select_country") || "SÃ©lectionner un pays"}
                      </option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    {renderFieldError("country_id")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("team_manager") || "Chef d'Ã©quipe"}
                    </label>
                    <select
                      name="team_manager_id"
                      value={formData.team_manager_id}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">
                        {t("select_team_manager") ||
                          "SÃ©lectionner un chef d'Ã©quipe"}
                      </option>
                      {teamManagers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.first_name} {manager.last_name} (
                          {manager.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("collection_point") || "Point de collecte"}
                    </label>
                    <select
                      name="collection_point_id"
                      value={formData.collection_point_id}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">
                        {t("select_collection_point") ||
                          "SÃ©lectionner un point de collecte"}
                      </option>
                      {collectionPoints
                        .filter(
                          (point) =>
                            !formData.country_id ||
                            point.country_id === parseInt(formData.country_id)
                        )
                        .map((point) => (
                          <option key={point.id} value={point.id}>
                            {point.name} - {point.locality}
                            {point.region && `, ${point.region}`}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("organization") || "Organisation"}
                    </label>
                    <select
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">
                        {t("select_organization") ||
                          "SÃ©lectionner une organisation"}
                      </option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                          {org.metadata?.city ? ` - ${org.metadata.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations de connexion */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  {t("connection_information") || "Informations de connexion"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("password") || "Mot de passe"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          "password",
                          "w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        )}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    {renderFieldError("password")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("confirm_password") || "Confirmer le mot de passe"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          "confirm_password",
                          "w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        )}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                      <span
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                    {renderFieldError("confirm_password")}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("reset") || "RÃ©initialiser"}
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-700 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
                >
                  {loading
                    ? t("creating") || "CrÃ©ation..."
                    : t("create") || "CrÃ©er"}
                </button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
