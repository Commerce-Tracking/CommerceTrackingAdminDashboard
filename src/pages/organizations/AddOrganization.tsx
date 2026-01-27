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

// Interface pour les pays
interface Country {
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
}

export default function AddOrganization() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country_id: "",
    type: "public",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  // Fonction pour récupérer les pays
  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token d'authentification manquant");
        return;
      }

      const response = await axiosInstance.get(
        "/admin/reference-data/countries?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (response.data.success) {
        const countriesData = response.data.result?.data || [];
        setCountries(countriesData);
      } else {
      }
    } catch (err: any) {
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

  // Fonction pour réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      country_id: "",
      type: "public",
      address: "",
      phone: "",
      email: "",
      website: "",
    });
    clearAllErrors();
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
    if (!formData.name || !formData.name.trim()) {
      setFieldError(
        "name",
        t("organization_name_required") || "Le nom de l'organisation est requis"
      );
      return false;
    }

    if (!formData.description || !formData.description.trim()) {
      setFieldError(
        "description",
        t("description_required") || "La description est requise"
      );
      return false;
    }

    if (!formData.country_id) {
      setFieldError(
        "country_id",
        t("country_required") || "Le pays est requis"
      );
      return false;
    }

    if (!formData.type) {
      setFieldError("type", t("type_required") || "Le type est requis");
      return false;
    }

    if (!formData.address || !formData.address.trim()) {
      setFieldError(
        "address",
        t("address_required") || "L'adresse est requise"
      );
      return false;
    }

    // Validation de l'email (optionnel mais doit être valide si renseigné)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFieldError("email", t("invalid_email") || "Email invalide");
        return false;
      }
    }

    // Pas de validation stricte pour le site web
    // On laisse l'API gérer la validation

    return true;
  };

  // Fonction pour gérer la soumission du formulaire
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

      // Préparer les données pour l'API
      const apiData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        country_id: parseInt(formData.country_id),
        type: formData.type,
        address: formData.address.trim(),
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.phone && formData.phone.trim()) {
        apiData.phone = formData.phone.trim();
      }
      if (formData.email && formData.email.trim()) {
        apiData.email = formData.email.trim();
      }
      if (formData.website && formData.website.trim()) {
        apiData.website = formData.website.trim();
      }


      const response = await axiosInstance.post(
        "/admin/reference-data/organizations",
        apiData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );


      // Gérer les cas où l'API retourne success: false
      if (!response.data.success) {

        // Afficher un toast en rouge
        toast.error(response.data.message || t("error_creating_organization"));

        // Essayer de mapper les erreurs aux champs spécifiques
        if (response.data.errors) {
          Object.keys(response.data.errors).forEach((key) => {
            setFieldError(key, response.data.errors[key]);
          });
        }
        return;
      }

      // Afficher un toast de succès
      toast.success(
        response.data.message ||
          t("organization_created_successfully") ||
          "Organisation créée avec succès"
      );

      // Réinitialiser le formulaire
      handleReset();
    } catch (err: any) {

      // Afficher un toast en rouge
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t("error_creating_organization") ||
        "Erreur lors de la création de l'organisation";
      toast.error(errorMessage);

      // Mapper les erreurs de validation aux champs spécifiques
      if (err.response?.data?.errors) {
        Object.keys(err.response.data.errors).forEach((key) => {
          setFieldError(key, err.response.data.errors[key]);
        });
      }

      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        window.location.href = "/signin";
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageMeta
        title="Commerce Tracking | Ajouter Organisation"
        description="Ajouter une nouvelle organisation"
      />

      <PageBreadcrumb
        pageTitle={t("add_organization") || "Ajouter Organisation"}
      />

      <div className="page-container">
        <ComponentCard
          title={t("add_organization") || "Ajouter une Organisation"}
        >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom de l'organisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("organization_name") || "Nom de l'organisation"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={getFieldClassName("name")}
                  placeholder={
                    t("organization_name_placeholder") ||
                    "Ex: Ministère de l'Agriculture"
                  }
                  required
                  disabled={loading}
                />
                {renderFieldError("name")}
              </div>

              {/* Pays */}
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
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("description") || "Description"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={getFieldClassName("description")}
                placeholder={
                  t("description_placeholder") ||
                  "Description de l'organisation"
                }
                required
                disabled={loading}
              />
              {renderFieldError("description")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("address") || "Adresse"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={getFieldClassName("address")}
                  placeholder={
                    t("address_placeholder") ||
                    "Ex: 123 Avenue de la République"
                  }
                  required
                  disabled={loading}
                />
                {renderFieldError("address")}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("type") || "Type"} <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={getFieldClassName("type")}
                  required
                  disabled={loading}
                >
                  <option value="public">{t("public") || "Public"}</option>
                  <option value="private">{t("private") || "Privé"}</option>
                </select>
                {renderFieldError("type")}
              </div>
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
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={getFieldClassName("phone")}
                  placeholder={
                    t("phone_placeholder") || "Ex: +221 33 123 45 67"
                  }
                  disabled={loading}
                />
                {renderFieldError("phone")}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("email") || "Email"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={getFieldClassName("email")}
                  placeholder={t("email_placeholder") || "contact@example.com"}
                  disabled={loading}
                />
                {renderFieldError("email")}
              </div>

              {/* Site web */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("website") || "Site web"}
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={getFieldClassName("website")}
                  placeholder={
                    t("website_placeholder") || "https://example.com"
                  }
                  disabled={loading}
                />
                {renderFieldError("website")}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/organizations/list")}
                disabled={loading}
                className="px-6 py-2"
              >
                {t("cancel") || "Annuler"}
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded disabled:opacity-50"
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
  );
}
