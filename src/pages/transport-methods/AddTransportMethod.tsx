import React, { useState } from "react";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface TransportMethodFormData {
  name: string;
  description: string;
}

const AddTransportMethod = () => {
  const [formData, setFormData] = useState<TransportMethodFormData>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

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

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error(t("error"), {
        description: t("transport_method_name") + " " + t("is_required"),
      });
      return false;
    }
    if (!formData.description.trim()) {
      toast.error(t("error"), {
        description: t("transport_method_description") + " " + t("is_required"),
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/transport-methods",
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API création mode de transport :", response.data);

      if (response.data.success) {
        // Remplacer "transport method" par "mode de transport" dans le message de l'API
        const apiMessage =
          response.data.message || "Mode de transport créé avec succès";
        const formattedMessage = apiMessage.replace(
          /transport method/gi,
          "mode de transport"
        );

        toast.success(t("success"), {
          description: formattedMessage,
        });

        // Réinitialiser le formulaire au lieu de rediriger
        handleReset();
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      console.error("Erreur API création mode de transport :", err);
      let errorMessage = "Erreur lors de la création du mode de transport.";
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
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
    });
    setError(null);
  };

  return (
    <>
      <PageMeta
        title="CT | Ajouter un mode de transport"
        description="Ajouter un nouveau mode de transport pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_transport_method")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_transport_method")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">
                    {t("transport_method_name")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("enter_transport_method_name")}
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    {t("transport_method_description")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("enter_transport_method_description")}
                    disabled={loading}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("reset")}
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50"
                >
                  {loading ? t("creating") : t("create_transport_method")}
                </button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default AddTransportMethod;
