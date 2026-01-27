import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface ServiceFormData {
  name: string;
  description: string;
  type: string;
}

const AddService = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    type: "public",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error(t("error"), {
          description: t("service_name") + " " + t("is_required"),
        });
        return;
      }

      if (!formData.description.trim()) {
        toast.error(t("error"), {
          description: t("service_description") + " " + t("is_required"),
        });
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
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/services",
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Service créé avec succès",
        });

        // Réinitialiser le formulaire au lieu de rediriger
        handleReset();
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      let errorMessage = "Erreur lors de la création du service.";

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
      description: "",
      type: "public",
    });
  };

  return (
    <>
      <PageMeta
        title="CT | Ajouter un service"
        description="Ajouter un nouveau service pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_service")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_service")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("service_name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("enter_service_name")}
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("service_type")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                  >
                    <option value="public">{t("public")}</option>
                    <option value="private">{t("private")}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("service_description")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("enter_service_description")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={4}
                    disabled={loading}
                    required
                  />
                </div>
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
                  onClick={() => navigate("/services/list")}
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

export default AddService;
