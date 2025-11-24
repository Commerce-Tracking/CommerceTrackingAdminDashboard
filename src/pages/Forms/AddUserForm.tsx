import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserInputs from "../../components/form/form-elements/UserInputs.tsx";
import {useTranslation} from "react-i18next";


export default function AddUserFormElements() {

 const { t, i18n } = useTranslation();
          
              const changeLanguage = (lng: string) => {
                  i18n.changeLanguage(lng);
              };

  return (
    <div>
      <PageMeta
        title="Commerce Tracking Backoffice | Admin"
        description="Opération Fluidité Routière Agro-bétail"
      />
      <PageBreadcrumb pageTitle={t('add_collector')} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
        <div className="space-y-12">
          <UserInputs />
        </div>

      </div>
    </div>
  );
}
