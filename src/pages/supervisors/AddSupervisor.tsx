import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { toast } from "sonner";

// Interface pour les données de référence
interface Country {
  id: number;
  public_id: string;
  name: string;
  iso: string;
  prefix: string;
  flag: string;
  status: string;
}

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
    email: string;
    phone: string;
    region: string;
    website: string;
  };
  created_at: string;
  updated_at: string;
}

export default function AddSupervisor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    country_id: "",
    organization_id: "",
    address: "",
    gender: "M",
    marital_status: "single",
    date_of_birth: "",
    place_of_birth: "",
    nationality: "",
    status: "active",
  });

  // Fonction pour récupérer les pays
  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const response = await axiosInstance.get("/common-data/countries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCountries(response.data.result || []);
        console.log("✅ Pays récupérés:", response.data.result?.length);
      } else {
        console.error("❌ Erreur API countries:", response.data);
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de la récupération des pays:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
      }
    }
  };

  // Fonction pour récupérer les organisations
  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const response = await axiosInstance.get(
        "/admin/reference-data/organizations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("📡 Réponse API organizations:", response.data);

      if (response.data.success) {
        const organizationsData =
          response.data.result?.data ||
          response.data.result ||
          response.data.data ||
          [];
        console.log("📊 Données organisations:", organizationsData);
        console.log("🔍 Type de données:", typeof organizationsData);
        console.log("🔍 Est un tableau:", Array.isArray(organizationsData));

        setOrganizations(organizationsData);
        console.log("✅ Organisations récupérées:", organizationsData.length);
      } else {
        console.error("❌ Erreur API organizations:", response.data);
      }
    } catch (err: any) {
      console.error(
        "❌ Erreur lors de la récupération des organisations:",
        err
      );
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
      }
    }
  };

  // Chargement initial des données
  useEffect(() => {
    fetchCountries();
    fetchOrganizations();
  }, []);

  // Fonction pour gérer les changements dans le formulaire
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

    // Effacer l'erreur du champ modifié
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Fonction pour définir une erreur de champ
  const setFieldError = (field: string, message: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  // Fonction pour effacer toutes les erreurs
  const clearAllErrors = () => {
    setFieldErrors({});
    setError(null);
  };

  // Fonction pour obtenir la classe CSS d'un champ
  const getFieldClassName = (fieldName: string) => {
    const baseClass =
      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white";
    const errorClass = "border-red-500 dark:border-red-500";
    const normalClass = "border-gray-300 dark:border-gray-600";

    return fieldErrors[fieldName]
      ? `${baseClass} ${errorClass}`
      : `${baseClass} ${normalClass}`;
  };

  // Fonction pour afficher l'erreur d'un champ
  const renderFieldError = (fieldName: string) => {
    return fieldErrors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
        {fieldErrors[fieldName]}
      </p>
    ) : null;
  };

  // Fonction pour valider le formulaire
  const validateForm = () => {
    clearAllErrors();

    // Validation des champs requis
    if (!formData.first_name || !formData.first_name.trim()) {
      setFieldError("first_name", "Le prénom est requis");
      return false;
    }

    if (!formData.last_name || !formData.last_name.trim()) {
      setFieldError("last_name", "Le nom est requis");
      return false;
    }

    if (!formData.email || !formData.email.trim()) {
      setFieldError("email", "L'email est requis");
      return false;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFieldError("email", "Format d'email invalide");
      return false;
    }

    if (!formData.phone || !formData.phone.trim()) {
      setFieldError("phone", "Le téléphone est requis");
      return false;
    }

    if (!formData.password || !formData.password.trim()) {
      setFieldError("password", "Le mot de passe est requis");
      return false;
    }

    if (formData.password.length < 6) {
      setFieldError(
        "password",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return false;
    }

    if (!formData.confirm_password || !formData.confirm_password.trim()) {
      setFieldError(
        "confirm_password",
        "La confirmation du mot de passe est requise"
      );
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      setFieldError(
        "confirm_password",
        "Les mots de passe ne correspondent pas"
      );
      return false;
    }

    if (!formData.country_id) {
      setFieldError("country_id", "Le pays est requis");
      return false;
    }

    return true;
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      clearAllErrors();

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      // Construction des données pour l'API
      const apiData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        country_id: parseInt(formData.country_id),
        organization_id: formData.organization_id
          ? parseInt(formData.organization_id)
          : null,
        address: formData.address ? formData.address.trim() : null,
        gender: formData.gender,
        marital_status: formData.marital_status,
        date_of_birth: formData.date_of_birth || null,
        place_of_birth: formData.place_of_birth
          ? formData.place_of_birth.trim()
          : null,
        nationality: formData.nationality ? formData.nationality.trim() : null,
        status: formData.status,
        actor_role: "supervisor",
        supervisor_id: null, // Un superviseur n'a pas de superviseur parent
      };

      console.log("🔄 Création du superviseur:", apiData);

      const response = await axiosInstance.post("/admin/actors", apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Réponse API:", response);

      if (response.data.success) {
        console.log("✅ Superviseur créé avec succès:", response.data.result);
        toast.success(
          t("supervisor_created_successfully") || "Superviseur créé avec succès"
        );
        handleReset();
      } else {
        console.log("❌ Réponse indique un échec:", response.data);

        // Utiliser le champ 'errors' en priorité, puis 'message'
        const errorMessage =
          response.data.errors ||
          response.data.message ||
          "Erreur lors de la création du superviseur";
        console.log("🚨 Message d'erreur de la réponse:", errorMessage);

        if (
          errorMessage.includes("téléphone") ||
          errorMessage.includes("phone") ||
          errorMessage
            .toLowerCase()
            .includes("utilisateur avec le téléphone") ||
          errorMessage.toLowerCase().includes("existe déjà") ||
          errorMessage.toLowerCase().includes("phone already exists")
        ) {
          console.log(
            "🎯 Erreur de réponse détectée comme téléphone:",
            errorMessage
          );
          setFieldError("phone", errorMessage);
          toast.error(errorMessage);
        } else if (
          errorMessage.includes("email") ||
          errorMessage.toLowerCase().includes("utilisateur avec l'email") ||
          errorMessage.toLowerCase().includes("email already exists")
        ) {
          console.log(
            "🎯 Erreur de réponse détectée comme email:",
            errorMessage
          );
          setFieldError("email", errorMessage);
          toast.error(errorMessage);
        } else if (
          errorMessage.includes("supervisor doit appartenir") ||
          errorMessage.includes("même pays") ||
          errorMessage.includes("supervisor must belong")
        ) {
          console.log(
            "🎯 Erreur de validation pays/superviseur:",
            errorMessage
          );
          setFieldError("country_id", errorMessage);
          toast.error(errorMessage);
        } else {
          console.log("❌ Erreur de réponse non mappée:", errorMessage);
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de la création:", err);

      if (err.response?.status === 422 || err.response?.status === 400) {
        const validationErrors =
          err.response?.data?.errors || err.response?.data?.message;
        console.log("🔍 Erreurs de validation:", validationErrors);

        if (typeof validationErrors === "object") {
          // Gestion des erreurs par champ
          Object.keys(validationErrors).forEach((field) => {
            setFieldError(field, validationErrors[field]);
          });
        } else if (typeof validationErrors === "string") {
          // Gestion des erreurs de chaîne
          if (
            validationErrors.includes("téléphone") ||
            validationErrors.includes("phone") ||
            validationErrors.includes("97333302") ||
            validationErrors
              .toLowerCase()
              .includes("utilisateur avec le téléphone") ||
            validationErrors.toLowerCase().includes("existe déjà") ||
            validationErrors.toLowerCase().includes("déjà existant")
          ) {
            setFieldError("phone", validationErrors);
            toast.error(validationErrors);
          } else if (
            validationErrors.includes("email") ||
            validationErrors
              .toLowerCase()
              .includes("utilisateur avec l'email") ||
            validationErrors.toLowerCase().includes("email existe déjà")
          ) {
            setFieldError("email", validationErrors);
            toast.error(validationErrors);
          } else if (
            validationErrors.includes("pays") ||
            validationErrors.includes("country")
          ) {
            setFieldError("country_id", validationErrors);
            toast.error(validationErrors);
          } else if (
            validationErrors.includes("supervisor doit appartenir") ||
            validationErrors.includes("même pays") ||
            validationErrors.includes("supervisor must belong")
          ) {
            setFieldError("country_id", validationErrors);
            toast.error(validationErrors);
          } else {
            setError(validationErrors);
            toast.error(validationErrors);
          }
        } else {
          setError("Erreur de validation des données");
          toast.error("Erreur de validation des données");
        }
      } else if (err.response?.status === 409) {
        const conflictMessage =
          err.response?.data?.message || "Conflit de données";
        if (
          conflictMessage.includes("téléphone") ||
          conflictMessage.includes("phone") ||
          conflictMessage
            .toLowerCase()
            .includes("utilisateur avec le téléphone") ||
          conflictMessage.toLowerCase().includes("existe déjà")
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
          "Erreur interne du serveur (500). Veuillez vérifier les données envoyées.";
        setError(`Erreur serveur: ${errorMessage}`);
        toast.error(`Erreur serveur: ${errorMessage}`);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.errors ||
          err.message ||
          "Erreur lors de la création du superviseur";
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

  // Fonction pour réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      country_id: "",
      organization_id: "",
      address: "",
      gender: "M",
      marital_status: "single",
      date_of_birth: "",
      place_of_birth: "",
      nationality: "",
      status: "active",
    });
    clearAllErrors();
  };

  return (
    <div className="page-container">
      <PageMeta
        title="Commerce Tracking | Ajouter un Superviseur"
        description="Formulaire d'ajout d'un superviseur"
      />

      <PageBreadcrumb pageTitle={t("add_supervisor")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_supervisor")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message d'erreur général */}
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
                      {t("first_name") || "Prénom"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={getFieldClassName("first_name")}
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
                      className={getFieldClassName("last_name")}
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
                      className={getFieldClassName("email")}
                      required
                      disabled={loading}
                    />
                    {renderFieldError("email")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("phone") || "Téléphone"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={getFieldClassName("phone")}
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
                      className={getFieldClassName("gender")}
                      disabled={loading}
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
                      className={getFieldClassName("marital_status")}
                      disabled={loading}
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
                      {t("date_of_birth") || "Date de naissance"}
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className={getFieldClassName("date_of_birth")}
                      disabled={loading}
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
                      className={getFieldClassName("place_of_birth")}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("nationality") || "Nationalité"}
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className={getFieldClassName("nationality")}
                      disabled={loading}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("address") || "Adresse"}
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={getFieldClassName("address")}
                      disabled={loading}
                    />
                  </div>
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
                      className={getFieldClassName("country_id")}
                      required
                      disabled={loading}
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
                    {renderFieldError("country_id")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("organization") || "Organisation"}
                    </label>
                    <select
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleInputChange}
                      className={getFieldClassName("organization_id")}
                      disabled={loading}
                    >
                      <option value="">
                        {t("select_organization") ||
                          "Sélectionner une organisation"}
                      </option>
                      {organizations &&
                        Array.isArray(organizations) &&
                        organizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>
                            {organization.name} -{" "}
                            {organization.metadata?.city || "N/A"}
                          </option>
                        ))}
                    </select>
                    {renderFieldError("organization_id")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("status") || "Statut"}
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={getFieldClassName("status")}
                      disabled={loading}
                    >
                      <option value="active">{t("active") || "Actif"}</option>
                      <option value="inactive">
                        {t("inactive") || "Inactif"}
                      </option>
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
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={getFieldClassName("password")}
                      required
                      disabled={loading}
                    />
                    {renderFieldError("password")}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("confirm_password") || "Confirmer le mot de passe"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className={getFieldClassName("confirm_password")}
                      required
                      disabled={loading}
                    />
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
                  {t("reset") || "Réinitialiser"}
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                >
                  {loading
                    ? t("creating") || "Création..."
                    : t("create") || "Créer"}
                </button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
