import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useValidationStats } from "../../context/ValidationStatsContext";

export default function MonthlySalesChart() {
  const { t } = useTranslation();
  const { stats, loading, error, isSessionExpired } = useValidationStats();
  const [isOpen, setIsOpen] = useState(false);

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    if (!stats?.monthly_collections) {
      return {
        categories: [
          "Jan",
          "Fev",
          "Mar",
          "Avr",
          "Mai",
          "Jun",
          "Jul",
          "Aou",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
    }

    // Créer un tableau de 12 mois avec des données initialisées à 0
    const monthlyData = new Array(12).fill(0);
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aou",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Mapper les données de l'API vers notre tableau
    stats.monthly_collections.forEach((item) => {
      const monthIndex = item.month - 1; // Convertir de 1-12 à 0-11
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex] = item.count;
      }
    });

    return {
      categories: monthNames,
      data: monthlyData,
    };
  };

  const chartData = prepareChartData();

  const options: ApexOptions = {
    colors: ["#1A6C30"], // Vert principal de la nouvelle charte
    chart: {
      fontFamily: "DM Sans, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val} collectes`,
      },
    },
  };

  const series = [
    {
      name: t("monthly_interventions") || "Interventions",
      data: chartData.data,
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-[180px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error && !isSessionExpired) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 px-5 pt-5 dark:border-red-800 dark:bg-red-900/20 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-[180px] text-red-600 dark:text-red-400">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Si la session est expirée, ne rien afficher (redirection en cours)
  if (isSessionExpired) {
    return null;
  }

  if (!stats) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-[180px] text-gray-500">
          <span>Aucune donnée disponible</span>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("monthly_interventions_chart") ||
            "Interventions réalisées par mois"}
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
