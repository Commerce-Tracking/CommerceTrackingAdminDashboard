import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { Earth, IdCardLanyard, LocationEditIcon, SettingsIcon, Truck } from 'lucide-react';
import {
  ChevronDownIcon, DocsIcon, FileIcon, FolderIcon,
  GridIcon, GroupIcon,
  HorizontaLDots,
  ListIcon,
  PencilIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { BiExport, BiSupport } from "react-icons/bi";
import { GrLocation } from "react-icons/gr";
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

  const navItems: NavItem[] = [
    {
      icon: <ListIcon />,
      name: t("obstacle_list"),
      path: "/complaints",
    },
    {
      icon: <DocsIcon />,
      name: t("obstacle_types"),
      path: "/complaints-types",
    }
  ];

  const usersItems: NavItem[] = [
    {
      name: t("user_list"),
      icon: <GroupIcon />,
      path: "/users",
    },
    {
      icon: <PencilIcon />,
      name: t("create_user"),
      path: "/create-user",
    },
    {
      icon: <UserCircleIcon />,
      name: t("role_management"),
      path: "/role-managment",
    },
  ];

  const reportingItems: NavItem[] = [
    {
      icon: <FileIcon />,
      name: t("generate_reports"),
      path: "/reportings",
    },
    {
      icon: <TableIcon />,
      name: t("view_reports"),
      path: "/reportings/list",
    },
    {
      icon: <PieChartIcon />,
      name: t("statistics"),
      path: "/statistics",
    }
  ];

  const localities: NavItem[] = [
    {
      icon: <IdCardLanyard />,
      name: t("entity_list"),
      path: "/entity/list",
    },
    {
      icon: <IdCardLanyard />,
      name: t("add_entity"),
      path: "/entity",
    },
    {
      icon: <Earth />,
      name: t("country_list"),
      path: "/countries",
    },
    {
      icon: <Earth />,
      name: t("add_country"),
      path: "/pays",
    },
    {
      icon: <GrLocation />,
      name: t("locality_list"),
      path: "/localities/list",
    },
    {
      icon: <LocationEditIcon />,
      name: t("add_locality"),
      path: "/localities",
    }
  ];

  const transports: NavItem[] = [
    {
      icon: <Truck />,
      name: t("transport_list"),
      path: "/transports",
    },
  ];

  const othersItems: NavItem[] = [
    {
      icon: <FolderIcon />,
      name: t("content_center"),
      path: "/types",
    },
    {
      icon: <SettingsIcon />,
      name: t("preferences"),
      path: "/types",
    },
    {
      icon: <BiExport />,
      name: t("export_data"),
      path: "/types",
    },
    {
      icon: <BiSupport />,
      name: t("customer_support"),
      path: "/types",
    }
  ];

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "dashboard" | "complaints" | "users" | "reporting" | "transports" | "localities" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["complaints", "users", "reporting", "transports", "localities", "others"].forEach((menuType) => {
      const items = menuType === "complaints" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as typeof openSubmenu["type"],
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
    menuType: typeof openSubmenu["type"]
  ) => {
    setOpenSubmenu((prevOpenSubmenu) =>
      prevOpenSubmenu &&
      prevOpenSubmenu.type === menuType &&
      prevOpenSubmenu.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const renderMenuSection = (label: string, items: NavItem[], menuType: typeof openSubmenu["type"]) => (
    <div>
      <h2
        className={`mb-4 text-xs uppercase flex leading-[20px] text-black w-[290px] dark:text-white ${
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
    menuType: typeof openSubmenu["type"]
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
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
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span className="menu-item-icon-size">{nav.icon}</span>
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`pt-6 pb-3 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.png"
                alt="Logo"
                width={200}
                height={30}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={200}
                height={30}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.png"
              alt="Logo"
              width={60}
              height={60}
            />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {renderMenuSection("dashboard", dashboardItems, "dashboard")}
            {renderMenuSection("complaints_management", navItems, "complaints")}
            {renderMenuSection("user_management", usersItems, "users")}
            {renderMenuSection("reporting", reportingItems, "reporting")}
            {renderMenuSection("transports", transports, "transports")}
            {renderMenuSection("entities_and_localities", localities, "localities")}
            {renderMenuSection("others", othersItems, "others")}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;