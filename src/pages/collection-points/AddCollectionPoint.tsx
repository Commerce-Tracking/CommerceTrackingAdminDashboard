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

// Interface pour les données du point de collecte
interface CollectionPointFormData {
  name: string;
  description: string;
  country_id: string;
  corridor_id: string;
  collection_point_type_id: string;
  locality: string;
  region: string;
  customs_post_code: string;
  latitude: string;
  longitude: string;
  is_formal: boolean;
  is_border_crossing: boolean;
  is_market: boolean;
  is_fluvial: boolean;
  is_checkpoint: boolean;
  status: string;
}

// Interface pour les données de référence
interface Country {
  id: number;
  name: string;
  flag: string;
}

interface Corridor {
  id: number;
  name: string;
  description: string;
}

interface CollectionPointType {
  id: number;
  name: string;
  description: string;
}

export default function AddCollectionPoint() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les données de référence
  const [countries, setCountries] = useState<Country[]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [collectionPointTypes, setCollectionPointTypes] = useState<
    CollectionPointType[]
  >([]);

  const [formData, setFormData] = useState<CollectionPointFormData>({
    name: "",
    description: "",
    country_id: "",
    corridor_id: "",
    collection_point_type_id: "",
    locality: "",
    region: "",
    customs_post_code: "",
    latitude: "",
    longitude: "",
    is_formal: true,
    is_border_crossing: false,
    is_market: false,
    is_fluvial: false,
    is_checkpoint: false,
    status: "active",
  });

  // Charger les données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Token d'authentification manquant");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Charger les pays
        const countriesResponse = await axiosInstance.get(
          "/admin/reference-data/countries",
          { headers }
        );
        if (countriesResponse.data.success) {
          setCountries(countriesResponse.data.result.data);
        }

        // Charger les corridors
        const corridorsResponse = await axiosInstance.get(
          "/admin/reference-data/corridors",
          { headers }
        );
        if (corridorsResponse.data.success) {
          setCorridors(corridorsResponse.data.result.data);
        }

        // Charger les types de points de collecte
        const typesResponse = await axiosInstance.get(
          "/common-data/collection-point-types",
          { headers }
        );
        if (typesResponse.data.success) {
          // Vérifier la structure de la réponse
          const typesData =
            typesResponse.data.result?.data ||
            typesResponse.data.data ||
            typesResponse.data.result ||
            [];
          setCollectionPointTypes(Array.isArray(typesData) ? typesData : []);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
          window.location.href = "/signin";
        }
      }
    };

    fetchReferenceData();
  }, []);

  // Gestion des changements de formulaire
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      setError("Le nom du point de collecte est requis");
      return false;
    }
    if (!formData.collection_point_type_id) {
      setError("Le type de point de collecte est requis");
      return false;
    }
    if (!formData.country_id) {
      setError("Le pays est requis");
      return false;
    }
    if (formData.latitude && isNaN(Number(formData.latitude))) {
      setError("La latitude doit être un nombre valide");
      return false;
    }
    if (formData.longitude && isNaN(Number(formData.longitude))) {
      setError("La longitude doit être un nombre valide");
      return false;
    }
    return true;
  };

  // Soumission du formulaire
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

      // Préparer les données pour l'API
      const apiData: any = {
        name: formData.name.trim(),
        country_id: parseInt(formData.country_id),
        collection_point_type_id: parseInt(formData.collection_point_type_id),
        description: formData.description
          ? formData.description.trim() || null
          : null,
        corridor_id: formData.corridor_id
          ? parseInt(formData.corridor_id)
          : null,
        locality: formData.locality ? formData.locality.trim() || null : null,
        region: formData.region ? formData.region.trim() || null : null,
        customs_post_code: formData.customs_post_code
          ? formData.customs_post_code.trim() || null
          : null,
        is_formal: formData.is_formal,
        is_border_crossing: formData.is_border_crossing,
        is_market: formData.is_market,
        is_fluvial: formData.is_fluvial,
        is_checkpoint: formData.is_checkpoint,
        status: formData.status,
      };

      // Coordonnées - envoyer null si vide, sinon les valeurs
      if (formData.latitude && formData.longitude) {
        apiData.coordinates = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        };
      } else {
        apiData.coordinates = null;
      }


      const response = await axiosInstance.post(
        "/admin/reference-data/collection-points",
        apiData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success(t("success") || "Succès", {
          description:
            response.data.message || "Point de collecte créé avec succès",
        });

        // Réinitialiser le formulaire
        handleReset();
      } else {
        setError(
          response.data.message ||
            "Erreur lors de la création du point de collecte"
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
          "Erreur lors de la création du point de collecte";

        setError(
          Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      country_id: "",
      corridor_id: "",
      collection_point_type_id: "",
      locality: "",
      region: "",
      customs_post_code: "",
      latitude: "",
      longitude: "",
      is_formal: true,
      is_border_crossing: false,
      is_market: false,
      is_fluvial: false,
      is_checkpoint: false,
      status: "active",
    });
    setError(null);
  };

  return (
    <div className="page-container">
      <PageMeta
        title="Commerce Tracking | Ajouter Point de Collecte"
        description="Ajouter un nouveau point de collecte"
      />

      <PageBreadcrumb
        pageTitle={t("add_collection_point") || "Ajouter un Point de Collecte"}
      />

      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard
            title={t("add_collection_point") || "Ajouter un Point de Collecte"}
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
                        Erreur
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
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={
                      t("collection_point_name_placeholder") ||
                      "Nom du point de collecte"
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("collection_point_type") || "Type de point de collecte"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="collection_point_type_id"
                    value={formData.collection_point_type_id}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("description") || "Description"}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={
                    t("description_placeholder") ||
                    "Description du point de collecte"
                  }
                  rows={3}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Localisation */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    {t("corridor") || "Corridor"}
                  </label>
                  <select
                    name="corridor_id"
                    value={formData.corridor_id}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">
                      {t("select_corridor") || "Sélectionner un corridor"}
                    </option>
                    {corridors.map((corridor) => (
                      <option key={corridor.id} value={corridor.id}>
                        {corridor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("locality") || "Localité"}
                  </label>
                  <Input
                    type="text"
                    name="locality"
                    value={formData.locality}
                    onChange={handleInputChange}
                    placeholder={
                      t("locality_placeholder") || "Nom de la localité"
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("region") || "Région"}
                  </label>
                  <Input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder={t("region_placeholder") || "Nom de la région"}
                    disabled={loading}
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
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder={t("latitude_placeholder") || "Ex: 7.3167"}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder={t("longitude_placeholder") || "Ex: 13.5833"}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Code douanier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("customs_post_code") || "Code poste douanier"}
                </label>
                <Input
                  type="text"
                  name="customs_post_code"
                  value={formData.customs_post_code}
                  onChange={handleInputChange}
                  placeholder={
                    t("customs_post_code_placeholder") || "Ex: NGD001"
                  }
                  disabled={loading}
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
                      checked={formData.is_formal}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("formal_point") || "Point formel"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_border_crossing"
                      checked={formData.is_border_crossing}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("border_crossing") || "Passage frontalier"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_market"
                      checked={formData.is_market}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("market") || "Marché"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_fluvial"
                      checked={formData.is_fluvial}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("fluvial") || "Fluvial"}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_checkpoint"
                      checked={formData.is_checkpoint}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t("checkpoint") || "Point de contrôle"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("status") || "Statut"}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">{t("active") || "Actif"}</option>
                  <option value="inactive">{t("inactive") || "Inactif"}</option>
                </select>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50"
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
