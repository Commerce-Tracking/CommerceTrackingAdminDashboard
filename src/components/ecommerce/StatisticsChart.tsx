import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useTranslation } from "react-i18next";
import { useValidationStats } from "../../context/ValidationStatsContext";

export default function StatisticsChart() {
  const { t } = useTranslation();
  const { stats, loading, error, isSessionExpired } = useValidationStats();

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    if (!stats?.monthly_accepted_by_supervisor || !stats?.monthly_rejected) {
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
        acceptedData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        rejectedData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
    }

    // Créer des tableaux de 12 mois avec des données initialisées à 0
    const acceptedData = new Array(12).fill(0);
    const rejectedData = new Array(12).fill(0);
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

    // Mapper les données acceptées par superviseur
    stats.monthly_accepted_by_supervisor.forEach((item) => {
      const monthIndex = item.month - 1; // Convertir de 1-12 à 0-11
      if (monthIndex >= 0 && monthIndex < 12) {
        acceptedData[monthIndex] = item.count;
      }
    });

    // Mapper les données rejetées
    stats.monthly_rejected.forEach((item) => {
      const monthIndex = item.month - 1; // Convertir de 1-12 à 0-11
      if (monthIndex >= 0 && monthIndex < 12) {
        rejectedData[monthIndex] = item.total_rejected;
      }
    });

    return {
      categories: monthNames,
      acceptedData,
      rejectedData,
    };
  };

  const chartData = prepareChartData();

  const options: ApexOptions = {
    legend: {
      show: true, // Afficher la légende pour distinguer les deux courbes
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#1A6C30", "#FF6B6B"], // Vert principal et Rouge pour les rejetées
    chart: {
      fontFamily: "DM Sans, sans-serif",
      height: 310,
      type: "area", // Graphique en aires
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth", // Courbes lisses
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number, { seriesIndex }) => {
          const label = seriesIndex === 0 ? "validées" : "rejetées";
          return `${val} collectes ${label}`;
        },
      },
    },
    xaxis: {
      type: "category",
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6f7c86"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: t("validated_collections") || "Collectes validées",
      data: chartData.acceptedData,
    },
    {
      name: t("rejected_collections") || "Collectes rejetées",
      data: chartData.rejectedData,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-[310px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error && !isSessionExpired) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 pb-5 pt-5 dark:border-red-800 dark:bg-red-900/20 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-[310px] text-red-600 dark:text-red-400">
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
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex items-center justify-center h-[310px] text-gray-500">
          <span>Aucune donnée disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("statistics_chart_title") || "Statistiques"}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {t("statistics_chart_subtitle") ||
              "Vue globale sur les activités annuelles"}
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          {/*<ChartTab />*/}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
