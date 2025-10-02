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

const AddCity = () => {
  const [formData, setFormData] = useState({
    name: "",
    country_id: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(true);
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

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t("city_name") + " " + t("is_required"));
      return false;
    }
    if (!formData.country_id) {
      setError(t("city_country") + " " + t("is_required"));
      return false;
    }
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
        setError("Vous devez être connecté pour ajouter une ville.");
        toast.error(t("auth_error"), {
          description:
            "Aucun token d'authentification trouvé. Redirection vers la connexion...",
        });
        setTimeout(() => navigate("/signin"), 3000);
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/cities",
        {
          ...formData,
          country_id: parseInt(formData.country_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API :", response.data);
      toast.success(t("success"), {
        description: response.data.message || t("city_created_successfully"),
      });

      // Reset form
      setFormData({
        name: "",
        country_id: "",
      });
    } catch (err: any) {
      console.error("Erreur API :", err);
      let errorMessage = "Erreur lors de l'ajout de la ville.";
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

  return (
    <>
      <PageMeta
        title="OFR | Ajouter une ville"
        description="Ajouter une nouvelle ville pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_city")} />
      <div className="space-y-6 p-4">
        <ComponentCard title={t("city_form_title")}>
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom de la ville */}
              <div>
                <Label>
                  {t("city_name")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("enter_city_name")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Pays */}
              <div>
                <Label>
                  {t("city_country")} <span className="text-error-500">*</span>
                </Label>
                <select
                  name="country_id"
                  value={formData.country_id}
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

export default AddCity;
