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

interface NatureFormData {
  product_nature_id: number;
  hs_code: string;
}

interface ProductFormData {
  name: string;
  name_eng: string;
  product_type_id: string;
  product_nature_id: string;
  hs_code: string;
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

interface ProductNature {
  id: number;
  name_fr: string;
  name_en: string;
  created_at: string;
  updated_at: string;
}

const AddProduct = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productNatures, setProductNatures] = useState<ProductNature[]>([]);
  const [naturesList, setNaturesList] = useState<NatureFormData[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    name_eng: "",
    product_type_id: "",
    product_nature_id: "",
    hs_code: "",
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

  // Récupérer la liste des natures de produits
  const fetchProductNatures = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      // Limiter à 50 éléments pour éviter de surcharger le dropdown
      // Si besoin de plus, utiliser un input avec autocomplétion
      const response = await axiosInstance.get(
        "/admin/reference-data/product-natures",
        {
          params: {
            page: 1,
            limit: 100, // Augmenter la limite si vous avez plus d'options
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const naturesData = response.data.result.data || [];
        setProductNatures(naturesData);
        console.log(
          ` ${naturesData.length} natures de produits chargées (limité à 50)`
        );
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des natures de produits:", err);
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchProductNatures();
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

  const handleAddNature = () => {
    if (formData.product_nature_id && formData.hs_code.trim()) {
      const newNature: NatureFormData = {
        product_nature_id: parseInt(formData.product_nature_id),
        hs_code: formData.hs_code.trim(),
      };
      setNaturesList([...naturesList, newNature]);
      // Réinitialiser les champs
      setFormData((prev) => ({
        ...prev,
        product_nature_id: "",
        hs_code: "",
      }));
    }
  };

  const handleRemoveNature = (index: number) => {
    console.log("🗑️ Suppression de la nature à l'index:", index);
    console.log("📋 Liste actuelle:", naturesList);
    const newList = naturesList.filter((_, i) => i !== index);
    console.log("✨ Nouvelle liste:", newList);
    setNaturesList(newList);
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

      const requestData: any = {
        name: formData.name.trim(),
        name_eng: formData.name_eng.trim() || formData.name.trim(), // Utilise le nom français si anglais vide
        product_type_id: parseInt(formData.product_type_id),
        description: formData.description.trim(),
      };

      // Ajouter le tableau natures seulement s'il contient des éléments
      if (naturesList.length > 0) {
        requestData.natures = naturesList;
      }

      const response = await axiosInstance.post(
        "/admin/reference-data/products",
        requestData,
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
      name_eng: "",
      product_type_id: "",
      product_nature_id: "",
      hs_code: "",
      description: "",
    });
    setNaturesList([]);
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
                    {t("hs_code") || "Code HS"}
                  </label>
                  <Input
                    type="text"
                    name="hs_code"
                    value={formData.hs_code}
                    onChange={handleInputChange}
                    placeholder={t("enter_hs_code") || "Ex: 0901.11"}
                    className="w-full"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Section pour ajouter des natures */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("product_nature") || "Nature du produit"}
                </label>
                <div className="flex gap-2">
                  <select
                    name="product_nature_id"
                    value={formData.product_nature_id}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={loading}
                  >
                    <option value="">
                      {t("select_product_nature") || "Sélectionner une nature"}
                    </option>
                    {productNatures && productNatures.length > 0 ? (
                      productNatures.map((nature) => (
                        <option key={nature.id} value={nature.id}>
                          {nature.name_fr}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Aucune nature disponible
                      </option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddNature}
                    disabled={
                      loading ||
                      !formData.product_nature_id ||
                      !formData.hs_code.trim()
                    }
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50"
                  >
                    {t("add") || "Ajouter"}
                  </button>
                </div>

                {/* Liste des natures ajoutées */}
                {naturesList.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {naturesList.map((nature, index) => {
                      const natureDetails = productNatures.find(
                        (n) => n.id === nature.product_nature_id
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {natureDetails?.name_fr ||
                                nature.product_nature_id}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {"•"}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              {nature.hs_code}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveNature(index);
                            }}
                            disabled={loading}
                            className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            {t("remove") || "Supprimer"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("name_english")}
                  </label>
                  <Input
                    type="text"
                    name="name_eng"
                    value={formData.name_eng}
                    onChange={handleInputChange}
                    placeholder={t("enter_name_english")}
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("product_description")}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("enter_product_description")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={4}
                    disabled={loading}
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
                  onClick={() => navigate("/products/list")}
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {t("cancel")}
                </Button>
                <Button disabled={loading} className="px-6 py-2">
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
