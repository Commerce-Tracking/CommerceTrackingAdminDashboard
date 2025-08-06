import React, { useEffect, useState } from "react";
import { FileIcon, ListIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import axiosInstance from "../../api/axios";

export default function EcommerceMetrics() {
  const [stats, setStats] = useState<{ totalPlaintes: number; totalReportings: number }>({
    totalPlaintes: 0,
    totalReportings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axiosInstance.get("/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats({
          totalPlaintes: res.data.totalPlaintes || 0,
          totalReportings: res.data.totalReportings || 0,
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques :", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Plaintes Totales */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Plaintes Totales</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.totalPlaintes.toLocaleString()}
            </h4>
          </div>
          <Badge color="success">Voir tout</Badge>
        </div>
      </div>

      {/* Reportings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <FileIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Reportings</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats.totalReportings.toLocaleString()}
            </h4>
          </div>
          <Badge color="error">Voir tout</Badge>
        </div>
      </div>
    </div>
  );
}


