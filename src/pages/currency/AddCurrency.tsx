import React, { useState, useRef } from "react";
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

const AddCurrency = () => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    symbol: "",
    status: "active",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currencySymbols = [
    { value: "₿", label: "₿ - Bitcoin" },
    { value: "₵", label: "₵ - Cedi ghanéen" },
    { value: "FC", label: "FC - Franc congolais" },
    { value: "FCFA", label: "FCFA - Franc CFA" },
    { value: "$", label: "$ - Dollar américain" },
    { value: "€", label: "€ - Euro" },
    { value: "₾", label: "₾ - Lari géorgien" },
    { value: "₺", label: "₺ - Lire turque" },
    { value: "£", label: "£ - Livre sterling" },
    { value: "L", label: "L - Loti lesothan" },
    { value: "₼", label: "₼ - Manat azerbaïdjanais" },
    { value: "M", label: "M - Metical mozambicain" },
    { value: "₦", label: "₦ - Naira nigérian" },
    { value: "N", label: "N - Naira nigérian" },
    { value: "P", label: "P - Pula botswanais" },
    { value: "₹", label: "₹ - Roupie indienne" },
    { value: "₨", label: "₨ - Roupie mauricienne" },
    { value: "₽", label: "₽ - Rouble russe" },
    { value: "R", label: "R - Rand sud-africain" },
    { value: "₪", label: "₪ - Shekel israélien" },
    { value: "S", label: "S - Shilling somalien" },
    { value: "₸", label: "₸ - Tenge kazakh" },
    { value: "T", label: "T - Tugrik mongol" },
    { value: "₴", label: "₴ - Hryvnia ukrainienne" },
    { value: "W", label: "W - Won nord-coréen" },
    { value: "₩", label: "₩ - Won sud-coréen" },
    { value: "¥", label: "¥ - Yen japonais" },
    { value: "Z", label: "Z - Zloty polonais" },
    { value: "K", label: "K - Kwacha zambien" },
    { value: "Kz", label: "Kz - Kwanza angolais" },
  ];

  const currencyCodes = [
    { value: "AOA", label: "AOA - Kwanza angolais" },
    { value: "ARS", label: "ARS - Peso argentin" },
    { value: "AUD", label: "AUD - Dollar australien" },
    { value: "AZN", label: "AZN - Manat azerbaïdjanais" },
    { value: "BIF", label: "BIF - Franc burundais" },
    { value: "BND", label: "BND - Dollar brunéien" },
    { value: "BRL", label: "BRL - Real brésilien" },
    { value: "BWP", label: "BWP - Pula botswanais" },
    { value: "BTC", label: "BTC - Bitcoin" },
    { value: "CAD", label: "CAD - Dollar canadien" },
    { value: "CDF", label: "CDF - Franc congolais" },
    { value: "CHF", label: "CHF - Franc suisse" },
    { value: "CLP", label: "CLP - Peso chilien" },
    { value: "CNY", label: "CNY - Yuan chinois" },
    { value: "COP", label: "COP - Peso colombien" },
    { value: "DKK", label: "DKK - Couronne danoise" },
    { value: "DZD", label: "DZD - Dinar algérien" },
    { value: "EGP", label: "EGP - Livre égyptienne" },
    { value: "ETB", label: "ETB - Birr éthiopien" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - Livre sterling" },
    { value: "GEL", label: "GEL - Lari géorgien" },
    { value: "GHS", label: "GHS - Cedi ghanéen" },
    { value: "HKD", label: "HKD - Dollar de Hong Kong" },
    { value: "ILS", label: "ILS - Shekel israélien" },
    { value: "INR", label: "INR - Roupie indienne" },
    { value: "JPY", label: "JPY - Yen japonais" },
    { value: "KES", label: "KES - Shilling kényan" },
    { value: "KPW", label: "KPW - Won nord-coréen" },
    { value: "KRW", label: "KRW - Won sud-coréen" },
    { value: "KZT", label: "KZT - Tenge kazakh" },
    { value: "LSL", label: "LSL - Loti lesothan" },
    { value: "LYD", label: "LYD - Dinar libyen" },
    { value: "MAD", label: "MAD - Dirham marocain" },
    { value: "MNT", label: "MNT - Tugrik mongol" },
    { value: "MUR", label: "MUR - Roupie mauricienne" },
    { value: "MXN", label: "MXN - Peso mexicain" },
    { value: "MZN", label: "MZN - Metical mozambicain" },
    { value: "MWK", label: "MWK - Kwacha malawien" },
    { value: "NGN", label: "NGN - Naira nigérian" },
    { value: "NOK", label: "NOK - Couronne norvégienne" },
    { value: "NZD", label: "NZD - Dollar néo-zélandais" },
    { value: "PEN", label: "PEN - Sol péruvien" },
    { value: "PLN", label: "PLN - Zloty polonais" },
    { value: "RUB", label: "RUB - Rouble russe" },
    { value: "RWF", label: "RWF - Franc rwandais" },
    { value: "SEK", label: "SEK - Couronne suédoise" },
    { value: "SGD", label: "SGD - Dollar singapourien" },
    { value: "SOS", label: "SOS - Shilling somalien" },
    { value: "TND", label: "TND - Dinar tunisien" },
    { value: "TRY", label: "TRY - Lire turque" },
    { value: "TZS", label: "TZS - Shilling tanzanien" },
    { value: "UAH", label: "UAH - Hryvnia ukrainienne" },
    { value: "UGX", label: "UGX - Shilling ougandais" },
    { value: "USD", label: "USD - Dollar américain" },
    { value: "VEF", label: "VEF - Bolivar vénézuélien" },
    { value: "XAF", label: "XAF - Franc CFA (Afrique centrale)" },
    { value: "XOF", label: "XOF - Franc CFA (Afrique de l'Ouest)" },
    { value: "ZAR", label: "ZAR - Rand sud-africain" },
    { value: "ZMW", label: "ZMW - Kwacha zambien" },
    { value: "ZWL", label: "ZWL - Dollar zimbabwéen" },
  ];

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
      setError(t("currency_name") + " " + t("is_required"));
      return false;
    }
    if (!formData.code.trim()) {
      setError(t("currency_code") + " " + t("is_required"));
      return false;
    }
    if (!formData.symbol.trim()) {
      setError(t("currency_symbol") + " " + t("is_required"));
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
        setError("Vous devez être connecté pour ajouter une devise.");
        toast.error(t("auth_error"), {
          description:
            "Aucun token d'authentification trouvé. Redirection vers la connexion...",
        });
        setTimeout(() => navigate("/signin"), 3000);
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/currencies",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API :", response.data);
      toast.success(t("success"), {
        description:
          response.data.message || t("currency_created_successfully"),
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        symbol: "",
        status: "active",
      });
    } catch (err: any) {
      console.error("Erreur API :", err);
      let errorMessage = "Erreur lors de l'ajout de la devise.";
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
        title="OFR | Ajouter une devise"
        description="Ajouter une nouvelle devise pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("currency_form_title")} />
      <div className="space-y-6 p-4">
        <ComponentCard title={t("currency_form_title")}>
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>
                  {t("currency_name")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t("enter_currency_name")}
                  className="w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <Label>
                  {t("currency_code")} <span className="text-error-500">*</span>
                </Label>
                <select
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                >
                  <option value="">{t("select_currency_code")}</option>
                  {currencyCodes.map((code) => (
                    <option key={code.value} value={code.value}>
                      {code.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>
                  {t("currency_symbol")}{" "}
                  <span className="text-error-500">*</span>
                </Label>
                <select
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={loading}
                >
                  <option value="">{t("select_currency_symbol")}</option>
                  {currencySymbols.map((symbol) => (
                    <option key={symbol.value} value={symbol.value}>
                      {symbol.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>
                  {t("currency_status")}{" "}
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

export default AddCurrency;
