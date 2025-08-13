import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import useAuth from "../../providers/auth/useAuth.ts";
import {useEffect} from "react";

export default function Home() {

  // @ts-ignore
  const { userInfo, userData , authMe } = useAuth();

  useEffect(() => {
    authMe(userInfo.id);
    console.log(localStorage.getItem('lang'));
  }, []);

  return (
    <div className="page-container">
      <PageMeta
        title="OFR | Admin"
        description="Opération Fluidité Routière Agro-bétail"
      />
      
      <div className="page-header">
        <h1 className="page-title">Tableau de Bord</h1>
        <p className="page-subtitle">Vue d'ensemble de vos activités et statistiques</p>
      </div>
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Bilan des plaintes */}
        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        {/* Plaintes en temps réel */}
        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>


        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        {/* Statistiques */}
        <div className="col-span-12">
          <StatisticsChart />
        </div>

      </div>
    </div>
  );
}
