import React, { useState } from "react";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

const AddUnity = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbol: "",
  });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        return;
      }

      // Validation
      if (!formData.name.trim()) {
        toast.error(t("error"), {
          description: t("unity_name") + " " + t("is_required"),
        });
        return;
      }
      if (!formData.description.trim()) {
        toast.error(t("error"), {
          description: t("unity_description") + " " + t("is_required"),
        });
        return;
      }
      if (!formData.symbol.trim()) {
        toast.error(t("error"), {
          description: t("unity_symbol") + " " + t("is_required"),
        });
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/unities",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Unité créée avec succès",
        });
        handleReset();
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      console.error("Erreur API:", err);
      let errorMessage = "Erreur lors de la création de l'unité.";
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
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      symbol: "",
    });
  };

  return (
    <>
      <PageMeta
        title="OFR | Ajouter une unité"
        description="Ajouter une nouvelle unité pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_unity")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_unity")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("unity_name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("enter_unity_name")}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("unity_symbol")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder={t("enter_unity_symbol")}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("unity_description")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t("enter_unity_description")}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("reset")}
                </Button>
                <Button type="submit" disabled={loading} className="px-6 py-2">
                  {loading ? t("creating") : t("create_unity")}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default AddUnity;
