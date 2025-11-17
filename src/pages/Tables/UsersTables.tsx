import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTableOne from "../../components/tables/BasicTables/UsersTableOne.tsx";
import {useTranslation} from "react-i18next";

export default function UsersTables() {
  const { t, i18n } = useTranslation();
          
              const changeLanguage = (lng: string) => {
                  i18n.changeLanguage(lng);
              };
  return (
    <>
      <PageMeta
        title="Commerce Tracking Backoffice | Admin"
        description="Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t('collector')} />
      <div className="space-y-6">
        <ComponentCard title={t('collector_list')}>
          <UsersTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
