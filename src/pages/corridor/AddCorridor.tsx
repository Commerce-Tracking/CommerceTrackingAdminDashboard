import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface Country {
  id: number;
  name: string;
  iso: string;
  status: string;
}

interface City {
  id: number;
  name: string;
  country_id: number;
}

const AddCorridor = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    country_start_id: "",
    country_end_id: "",
    city_start_id: "",
    city_end_id: "",
    distance: "",
    nbre_checkpoints: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(true);
  const [citiesLoading, setCitiesLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Récupérer la liste des pays
  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
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
        setCountries(response.data.result.data || []);
        console.log("Pays chargés:", response.data.result.data);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des pays:", err);
      toast.error(t("error"), {
        description: "Erreur lors du chargement des pays",
      });
    } finally {
      setCountriesLoading(false);
    }
  };

  // Récupérer la liste des villes
  const fetchCities = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/cities?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCities(response.data.result.data || []);
        console.log("Villes chargées:", response.data.result.data);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des villes:", err);
      toast.error(t("error"), {
        description: "Erreur lors du chargement des villes",
      });
    } finally {
      setCitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchCities();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Si on change un pays, réinitialiser les villes correspondantes
    if (name === "country_start_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        city_start_id: "", // Réinitialiser la ville de départ
      }));
    } else if (name === "country_end_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        city_end_id: "", // Réinitialiser la ville d'arrivée
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t("corridor_name") + " " + t("is_required"));
      return false;
    }
    if (!formData.description.trim()) {
      setError(t("corridor_description") + " " + t("is_required"));
      return false;
    }
    if (!formData.country_start_id) {
      setError(t("corridor_country_start") + " " + t("is_required"));
      return false;
    }
    if (!formData.country_end_id) {
      setError(t("corridor_country_end") + " " + t("is_required"));
      return false;
    }
    if (!formData.city_start_id) {
      setError(t("corridor_city_start") + " " + t("is_required"));
      return false;
    }
    if (!formData.city_end_id) {
      setError(t("corridor_city_end") + " " + t("is_required"));
      return false;
    }
    if (!formData.distance.trim()) {
      setError(t("corridor_distance") + " " + t("is_required"));
      return false;
    }
    // Le nombre de checkpoints est optionnel
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Soumission du formulaire avec données :", formData);

    if (!validateForm()) {
      toast.error(t("error"), {
        description: error,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Vous devez être connecté pour ajouter un corridor.");
        toast.error(t("auth_error"), {
          description:
            "Aucun token d'authentification trouvé. Redirection vers la connexion...",
        });
        setTimeout(() => navigate("/signin"), 3000);
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/corridors",
        {
          ...formData,
          country_start_id: parseInt(formData.country_start_id),
          country_end_id: parseInt(formData.country_end_id),
          city_start_id: parseInt(formData.city_start_id),
          city_end_id: parseInt(formData.city_end_id),
          distance: parseFloat(formData.distance),
          nbre_checkpoints: formData.nbre_checkpoints
            ? parseInt(formData.nbre_checkpoints)
            : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API :", response.data);
      toast.success(t("success"), {
        description:
          response.data.message || t("corridor_created_successfully"),
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        country_start_id: "",
        country_end_id: "",
        city_start_id: "",
        city_end_id: "",
        distance: "",
        nbre_checkpoints: "",
      });
    } catch (err: any) {
      console.error("Erreur API :", err);
      let errorMessage = "Erreur lors de l'ajout du corridor.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage =
          "Token invalide ou non autorisé. Veuillez vous reconnecter.";
        toast.error(t("auth_error"), {
          description: errorMessage,
        });
        setTimeout(() => navigate("/signin"), 3000);
      } else {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
        toast.error(t("error"), {
          description: errorMessage,
        });
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les villes par pays
  const getCitiesByCountry = (countryId: string) => {
    if (!countryId) return [];
    const filteredCities = cities.filter(
      (city) => city.country_id === parseInt(countryId)
    );
    console.log(`Villes pour le pays ${countryId}:`, filteredCities);
    return filteredCities;
  };

  return (
    <>
      <PageMeta
        title="CT | Ajouter un corridor"
        description="Ajouter un nouveau corridor pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_corridors")} />
      <div className="space-y-6 p-4">
        <ComponentCard title={t("corridor_form_title")}>
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du corridor */}
              <div>
                <Label>
                  {t("corridor_name")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("enter_corridor_name")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div>
                <Label>
                  {t("corridor_description")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t("enter_corridor_description")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Pays de départ */}
              <div>
                <Label>
                  {t("corridor_country_start")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="country_start_id"
                  value={formData.country_start_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading || countriesLoading}
                >
                  <option value="">{t("select_country")}</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.iso})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pays d'arrivée */}
              <div>
                <Label>
                  {t("corridor_country_end")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="country_end_id"
                  value={formData.country_end_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading || countriesLoading}
                >
                  <option value="">{t("select_country")}</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.iso})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ville de départ */}
              <div>
                <Label>
                  {t("corridor_city_start")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="city_start_id"
                  value={formData.city_start_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={
                    loading || citiesLoading || !formData.country_start_id
                  }
                >
                  <option value="">{t("select_city")}</option>
                  {getCitiesByCountry(formData.country_start_id).map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ville d'arrivée */}
              <div>
                <Label>
                  {t("corridor_city_end")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="city_end_id"
                  value={formData.city_end_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={
                    loading || citiesLoading || !formData.country_end_id
                  }
                >
                  <option value="">{t("select_city")}</option>
                  {getCitiesByCountry(formData.country_end_id).map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Distance */}
              <div>
                <Label>
                  {t("corridor_distance")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <input
                  name="distance"
                  type="number"
                  step="0.1"
                  value={formData.distance}
                  onChange={handleInputChange}
                  placeholder={t("enter_corridor_distance")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
              </div>

              {/* Nombre de checkpoints */}
              <div>
                <Label>{t("corridor_checkpoints")}</Label>
                <input
                  name="nbre_checkpoints"
                  type="number"
                  value={formData.nbre_checkpoints}
                  onChange={handleInputChange}
                  placeholder={t("enter_corridor_checkpoints")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {error && <p className="text-red-600 mt-2">{error}</p>}

            <div className="flex gap-4">
              <Button className="px-6 py-2" disabled={loading}>
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {t("add")}
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
};

export default AddCorridor;
