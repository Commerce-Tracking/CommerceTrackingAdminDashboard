import React, { useState, useRef, useEffect } from "react";
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

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  status: string;
}

const AddPays = () => {
  const [formData, setFormData] = useState({
    name: "",
    iso: "",
    prefix: "",
    currency_id: "",
    status: "active",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Récupérer la liste des devises
  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        return;
      }

      const response = await axiosInstance.get(
        "/admin/reference-data/currencies?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCurrencies(response.data.result.data || []);
      }
    } catch (err: any) {
      toast.error(t("error"), {
        description: "Erreur lors du chargement des devises",
      });
    } finally {
      setCurrenciesLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
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
      setError(t("country_name") + " " + t("is_required"));
      return false;
    }
    if (!formData.iso.trim()) {
      setError(t("country_iso") + " " + t("is_required"));
      return false;
    }
    if (!formData.prefix.trim()) {
      setError(t("country_prefix") + " " + t("is_required"));
      return false;
    }
    if (!formData.currency_id) {
      setError(t("country_currency") + " " + t("is_required"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        setError("Vous devez être connecté pour ajouter un pays.");
        toast.error(t("auth_error"), {
          description:
            "Aucun token d'authentification trouvé. Redirection vers la connexion...",
        });
        setTimeout(() => navigate("/signin"), 3000);
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/countries",
        {
          ...formData,
          currency_id: parseInt(formData.currency_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(t("success"), {
        description: response.data.message || t("country_created_successfully"),
      });

      // Reset form
      setFormData({
        name: "",
        iso: "",
        prefix: "",
        currency_id: "",
        status: "active",
      });
    } catch (err: any) {
      let errorMessage = "Erreur lors de l'ajout du pays.";
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
        title="CT | Ajouter un pays"
        description="Ajouter un nouveau pays pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_country")} />
      <div className="space-y-6 p-4">
        <ComponentCard title={t("country_form_title")}>
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom du pays */}
              <div>
                <Label>
                  {t("country_name")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("enter_country_name")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Code ISO */}
              <div>
                <Label>
                  {t("country_iso")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="iso"
                  value={formData.iso}
                  onChange={handleInputChange}
                  placeholder={t("enter_country_iso")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Préfixe téléphonique */}
              <div>
                <Label>
                  {t("country_prefix")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleInputChange}
                  placeholder={t("enter_country_prefix")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Devise */}
              <div>
                <Label>
                  {t("country_currency")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="currency_id"
                  value={formData.currency_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading || currenciesLoading}
                >
                  <option value="">{t("select_currency")}</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <Label>
                  {t("country_status")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                >
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
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

export default AddPays;
