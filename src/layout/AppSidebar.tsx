import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Earth,
  IdCardLanyard,
  LocationEditIcon,
  SettingsIcon,
  Truck,
  DollarSign,
  Building2,
  Route,
  Plus,
  Package,
  Tag,
  MapPin,
} from "lucide-react";
import {
  ChevronDownIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  PencilIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { BiExport } from "react-icons/bi";
import { useTranslation } from "react-i18next";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const dashboardItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: t("dashboard"),
      path: "/",
    },
  ];

  const usersItems: NavItem[] = [
    {
      name: t("collectors_list"),
      icon: <GroupIcon />,
      path: "/collectors/list",
    },
    {
      name: t("add_collector"),
      icon: <Plus />,
      path: "/collectors/add",
    },
    // {
    //   icon: <PencilIcon />,
    //   name: t("create_collector"),
    //   path: "/create-user",
    // },
    {
      icon: <UserCircleIcon />,
      name: t("role_management"),
      path: "/role-managment",
    },
  ];

  const localities: NavItem[] = [
    {
      icon: <Earth />,
      name: t("country_list"),
      path: "/countries-list",
    },
    {
      icon: <Earth />,
      name: t("add_country"),
      path: "/pays",
    },
    {
      icon: <Building2 />,
      name: t("city_list"),
      path: "/cities-list",
    },
    {
      icon: <Building2 />,
      name: t("add_city"),
      path: "/cities/add",
    },
    {
      icon: <Route />,
      name: t("corridors_list"),
      path: "/corridors/list",
    },
    {
      icon: <Plus />,
      name: t("add_corridors"),
      path: "/corridors/add",
    },
    {
      icon: <MapPin />,
      name: t("add_collection_point"),
      path: "/collection-points/add",
    },
    {
      icon: <MapPin />,
      name: t("collection_points_list"),
      path: "/collection-points/list",
    },
    {
      icon: <DollarSign />,
      name: t("currency_list"),
      path: "/currencies/list",
    },
    {
      icon: <DollarSign />,
      name: t("add_currency"),
      path: "/currencies/add",
    },
  ];

  const productsItems: NavItem[] = [
    {
      icon: <Tag />,
      name: t("product_types_list"),
      path: "/product-types/list",
    },
    {
      icon: <Plus />,
      name: t("add_product_type"),
      path: "/product-types/add",
    },
    {
      icon: <Package />,
      name: t("products_list"),
      path: "/products/list",
    },
    {
      icon: <Plus />,
      name: t("add_product"),
      path: "/products/add",
    },
    {
      icon: <Tag />,
      name: t("product_natures_list"),
      path: "/product-natures/list",
    },
    {
      icon: <Tag />,
      name: t("unities_list"),
      path: "/unities/list",
    },
    {
      icon: <Plus />,
      name: t("add_unity"),
      path: "/unities/add",
    },
  ];

  const servicesItems: NavItem[] = [
    {
      icon: <SettingsIcon />,
      name: t("services_list"),
      path: "/services/list",
    },
    {
      icon: <Plus />,
      name: t("add_service"),
      path: "/services/add",
    },
    {
      icon: <Truck />,
      name: t("transport_methods_list"),
      path: "/transport-methods/list",
    },
    {
      icon: <Plus />,
      name: t("add_transport_method"),
      path: "/transport-methods/add",
    },
    {
      icon: <Truck />,
      name: t("transport_modes_list"),
      path: "/transport-modes/list",
    },
    {
      icon: <Plus />,
      name: t("add_transport_mode"),
      path: "/transport-modes/add",
    },
  ];

  //   const reportingItems: NavItem[] = [
  //   {
  //     icon: <FileIcon />,
  //     name: t("generate_reports"),
  //     path: "/reportings",
  //   },
  //   {
  //     icon: <TableIcon />,
  //     name: t("view_reports"),
  //     path: "/reportings/list",
  //   },
  //   {
  //     icon: <PieChartIcon />,
  //     name: t("statistics"),
  //     path: "/statistics",
  //   }
  // ];

  const othersItems: NavItem[] = [
    {
      icon: <BiExport />,
      name: t("export_data"),
      path: "/export-csv",
    },
  ];

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "dashboard" | "users" | "reporting" | "" | "localities" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["users", "reporting", "", "localities", "others"].forEach((menuType) => {
      const items = othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as (typeof openSubmenu)["type"],
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: (typeof openSubmenu)["type"]
  ) => {
    setOpenSubmenu((prevOpenSubmenu) =>
      prevOpenSubmenu &&
      prevOpenSubmenu.type === menuType &&
      prevOpenSubmenu.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuSection = (
    label: string,
    items: NavItem[],
    menuType: (typeof openSubmenu)["type"]
  ) => (
    <div>
      <h2
        className={`sidebar-section-title mb-4 w-[290px] ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        {isExpanded || isHovered || isMobileOpen ? (
          t(label)
        ) : (
          <HorizontaLDots className="size-6" />
        )}
      </h2>
      {renderMenuItems(items, menuType)}
    </div>
  );

  const renderMenuItems = (
    items: NavItem[],
    menuType: (typeof openSubmenu)["type"]
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`sidebar-menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "sidebar-menu-item-active"
                  : "sidebar-menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span className="menu-item-icon-size">{nav.icon}</span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500 dark:text-brand-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`sidebar-menu-item group ${
                  isActive(nav.path)
                    ? "sidebar-menu-item-active"
                    : "sidebar-menu-item-inactive"
                }`}
              >
                <span className="sidebar-icon-size">{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`sidebar-container fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 text-gray-800 dark:text-gray-200 h-screen transition-all duration-300 ease-in-out z-50 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`pt-6 pb-3 flex ${
          !isExpanded && !isHovered
            ? "lg:justify-center lg:items-center"
            : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/Plan de travail 1.png"
                alt="Logo"
                width={120}
                height={30}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/Plan de travail 1.svg"
                alt="Logo"
                width={150}
                height={30}
              />
            </>
          ) : (
            <img
              src="/images/logo/Plan de travail 1.png"
              alt="Logo"
              width={50}
              height={50}
              className="mx-auto"
            />
          )}
        </Link>
      </div>

      <div className="sidebar-nav flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="sidebar-menu-group">
          <div className="flex flex-col gap-4">
            {renderMenuSection("dashboard", dashboardItems, "dashboard")}
            {renderMenuSection("user_management", usersItems, "users")}
            {renderMenuSection(
              "entities_and_localities",
              localities,
              "localities"
            )}
            {renderMenuSection(
              "products_management",
              productsItems,
              "products"
            )}
            {renderMenuSection(
              "services_and_transports",
              servicesItems,
              "services"
            )}
            {/* {renderMenuSection("reporting", reportingItems, "reporting")} */}

            {renderMenuSection("others", othersItems, "others")}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
