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

interface AnimalNatureFormData {
  name_fr: string;
  name_en: string;
}

const AddAnimalNature = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<AnimalNatureFormData>({
    name_fr: "",
    name_en: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!formData.name_fr.trim()) {
        toast.error(t("error"), {
          description:
            (t("animal_nature_name_fr") || "Nom FR") + " " + t("is_required"),
        });
        return;
      }

      if (!formData.name_en.trim()) {
        toast.error(t("error"), {
          description:
            (t("animal_nature_name_en") || "Nom EN") + " " + t("is_required"),
        });
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("auth_error"), {
          description: "Aucun token d'authentification trouvé.",
        });
        setTimeout(() => navigate("/signin"), 2000);
        return;
      }

      const payload = {
        name_fr: formData.name_fr.trim(),
        name_en: formData.name_en.trim(),
      };

      const response = await axiosInstance.post(
        "/admin/reference-data/animal-natures",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(t("success"), {
          description:
            response.data.message ||
            t("animal_nature_created_successfully") ||
            "Nature d'animal créée avec succès",
        });
        handleReset();
      } else {
        toast.error(t("error"), {
          description:
            response.data.message ||
            t("error_creating") ||
            "Erreur lors de la création",
        });
      }
    } catch (err: any) {
      let errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la création";
      toast.error(t("error"), { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ name_fr: "", name_en: "" });
  };

  return (
    <>
      <PageMeta
        title="OFR | Ajouter une nature d'animal"
        description="Ajouter une nouvelle nature d'animal"
      />
      <PageBreadcrumb
        pageTitle={t("add_animal_nature") || "Ajouter une nature d'animal"}
      />
      <div className="page-container">
        <div className="space-y-6">
          <ComponentCard
            title={t("add_animal_nature") || "Ajouter une nature d'animal"}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_nature_name_fr") || "Nom (FR)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name_fr"
                    value={formData.name_fr}
                    onChange={handleInputChange}
                    placeholder={
                      t("enter_animal_nature_name_fr") || "Entrez le nom FR"
                    }
                    className="w-full"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("animal_nature_name_en") || "Nom (EN)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleInputChange}
                    placeholder={
                      t("enter_animal_nature_name_en") || "Enter English name"
                    }
                    className="w-full"
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
                  onClick={() => navigate("/animals/add")}
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

export default AddAnimalNature;
