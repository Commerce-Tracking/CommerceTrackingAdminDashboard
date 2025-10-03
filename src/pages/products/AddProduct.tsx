import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axiosInstance from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface ProductFormData {
  name: string;
  product_type_id: string;
  HS_code: string;
  description: string;
}

interface ProductType {
  id: number;
  public_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  products?: any[];
}

const AddProduct = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    product_type_id: "",
    HS_code: "",
    description: "",
  });

  // Récupérer la liste des types de produits
  const fetchProductTypes = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await axiosInstance.get(
        "/admin/reference-data/product-types?page=1&limit=100",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setProductTypes(response.data.result.data || []);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des types de produits:", err);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

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
          description: t("product_name") + " " + t("is_required"),
        });
        return;
      }

      if (!formData.product_type_id) {
        toast.error(t("error"), {
          description: t("product_type") + " " + t("is_required"),
        });
        return;
      }

      if (!formData.HS_code.trim()) {
        toast.error(t("error"), {
          description: t("hs_code") + " " + t("is_required"),
        });
        return;
      }

      if (!formData.description.trim()) {
        toast.error(t("error"), {
          description: t("product_description") + " " + t("is_required"),
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
        "/admin/reference-data/products",
        {
          name: formData.name.trim(),
          product_type_id: parseInt(formData.product_type_id),
          HS_code: formData.HS_code.trim(),
          description: formData.description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Réponse API création produit :", response.data);

      if (response.data.success) {
        toast.success(t("success"), {
          description: response.data.message || "Produit créé avec succès",
        });

        // Réinitialiser le formulaire au lieu de rediriger
        handleReset();
      } else {
        toast.error(t("error"), {
          description: response.data.message || "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      console.error("Erreur API création produit :", err);
      let errorMessage = "Erreur lors de la création du produit.";

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
      product_type_id: "",
      HS_code: "",
      description: "",
    });
  };

  return (
    <>
      <PageMeta
        title="OFR | Ajouter un produit"
        description="Ajouter un nouveau produit pour Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t("add_product")} />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard title={t("add_product")}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_name")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("enter_product_name")}
                    className="w-full"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_type")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="product_type_id"
                    value={formData.product_type_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                    required
                  >
                    <option value="">{t("select_product_type")}</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("hs_code")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="HS_code"
                    value={formData.HS_code}
                    onChange={handleInputChange}
                    placeholder={t("enter_hs_code")}
                    className="w-full"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_description")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("enter_product_description")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={4}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("reset")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products/list")}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading} className="px-6 py-2">
                  {loading ? t("creating") : t("create")}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
