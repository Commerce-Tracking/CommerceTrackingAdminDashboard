import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface TransportMethod {
  id: number;
  public_id: string;
  name: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
}

const AddTransportMode = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    transport_method_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [transportMethods, setTransportMethods] = useState<TransportMethod[]>(
    []
  );
  const { t } = useTranslation();

  // Charger les modes de transport (transport-methods)
  const fetchTransportMethods = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/transport-methods?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setTransportMethods(response.data.result.data || []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des modes de transport:", err);
    }
  };

  useEffect(() => {
    fetchTransportMethods();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
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
          description: t("transport_mode_name") + " " + t("is_required"),
        });
        return;
      }
      if (!formData.description.trim()) {
        toast.error(t("error"), {
          description: t("transport_mode_description") + " " + t("is_required"),
        });
        return;
      }
      if (!formData.transport_method_id) {
        toast.error(t("error"), {
          description: t("transport_method") + " " + t("is_required"),
        });
        return;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/transport-modes",
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          transport_method_id: parseInt(formData.transport_method_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Remplacer "transport mode" par "moyen de transport" dans le message de l'API
        const apiMessage =
          response.data.message || "Moyen de transport créé avec succès";
        const formattedMessage = apiMessage.replace(
          /transport mode/gi,
          "moyen de transport"
        );

        toast.success(t("success"), {
          description: formattedMessage,
        });
        handleReset();
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      console.error("Erreur API:", err);
      let errorMessage = "Erreur lors de la création du moyen de transport.";
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
      transport_method_id: "",
    });
  };

  return (
    <>
      <PageMeta
        title="OFR | Ajouter un moyen de transport"
        description="Ajouter un nouveau moyen de transport pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_transport_mode")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_transport_mode")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("transport_mode_name")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("enter_transport_mode_name")}
                    disabled={loading}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("transport_method")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="transport_method_id"
                    value={formData.transport_method_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={loading}
                  >
                    <option value="">{t("select_transport_method")}</option>
                    {transportMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("transport_mode_description")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t("enter_transport_mode_description")}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-3">
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
                  {loading ? t("creating") : t("create_transport_mode")}
                </button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default AddTransportMode;
