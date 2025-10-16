import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { CalenderIcon } from "../../icons";
import { useTranslation } from "react-i18next";
import { useTotalCollections } from "../../context/TotalCollectionsContext";
import { useAcceptedBySupervisor } from "../../context/AcceptedBySupervisorContext";
import { useRejectedByLevel } from "../../context/RejectedByLevelContext";

export default function MonthlyTarget() {
  const { t } = useTranslation();
  const {
    totalCollections,
    loading: totalLoading,
    error: totalError,
    isSessionExpired: totalSessionExpired,
  } = useTotalCollections();
  const {
    totalAcceptedBySupervisor,
    loading: acceptedLoading,
    error: acceptedError,
    isSessionExpired: acceptedSessionExpired,
  } = useAcceptedBySupervisor();
  const {
    totalRejected,
    loading: rejectedLoading,
    error: rejectedError,
    isSessionExpired: rejectedSessionExpired,
  } = useRejectedByLevel();
  const [isOpen, setIsOpen] = useState(false);

  // Calculate percentage of accepted collections for the radial bar
  const acceptedPercentage = totalCollections
    ? (((totalAcceptedBySupervisor || 0) / totalCollections) * 100).toFixed(2)
    : 0;
  const series = [Number(acceptedPercentage)];

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const options: ApexOptions = {
    colors: ["#1A6C30"], // Vert principal de la nouvelle charte
    chart: {
      fontFamily: "DM Sans, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#e1e5ea", // Gris clair de la nouvelle palette
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1b2e3b", // Gris sombre de la nouvelle palette
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#1A6C30"], // Vert principal de la nouvelle charte
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (totalLoading || acceptedLoading || rejectedLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (
    (totalError || acceptedError || rejectedError) &&
    !totalSessionExpired &&
    !acceptedSessionExpired &&
    !rejectedSessionExpired
  ) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-6">
        <div className="flex items-center justify-center text-red-600 dark:text-red-400">
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
          <span>{totalError || acceptedError || rejectedError}</span>
        </div>
      </div>
    );
  }

  // Si la session est expirée, ne rien afficher (redirection en cours)
  if (totalSessionExpired || acceptedSessionExpired || rejectedSessionExpired) {
    return null;
  }

  if (
    totalCollections === null ||
    totalAcceptedBySupervisor === null ||
    totalRejected === null
  ) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-center text-gray-500">
          <span>Aucune donnée disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("collections_summary")}
            </h3>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <p className="flex items-center justify-center mt-1 gap-1 text-gray-500 text-theme-sm dark:text-gray-400">
                Aujourd'hui{" "}
                <CalenderIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
              </p>
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
                ...
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {t("collections_validation_message").replace(
            "{count}",
            (totalAcceptedBySupervisor || 0).toString()
          )}
        </p>
      </div>
      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-800 text-theme-xs dark:text-gray-400 sm:text-sm">
            {t("total_collections")}
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {totalCollections || 0}
          </p>
        </div>
        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            {t("validated_collections")}
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {totalAcceptedBySupervisor || 0}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                fill="#039855"
              />
            </svg>
          </p>
        </div>
        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            {t("rejected_collections")}
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {totalRejected || 0}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.26816 13.6632C7.4056 13.8192 7.60686 13.9176 7.8311 13.9176C7.83148 13.9176 7.83187 13.9176 7.83226 13.9176C8.02445 13.9178 8.21671 13.8447 8.36339 13.6981L12.3635 9.70076C12.6565 9.40797 12.6567 8.9331 12.3639 8.6401C12.0711 8.34711 11.5962 8.34694 11.3032 8.63973L8.5811 11.36L8.5811 2.5C8.5811 2.08579 8.24531 1.75 7.8311 1.75C7.41688 1.75 7.0811 2.08579 7.0811 2.5L7.0811 11.3556L4.36354 8.63975C4.07055 8.34695 3.59568 8.3471 3.30288 8.64009C3.01008 8.93307 3.01023 9.40794 3.30321 9.70075L7.26816 13.6632Z"
                fill="#D92D20"
              />
            </svg>
          </p>
        </div>
      </div>
    </div>
  );
}
