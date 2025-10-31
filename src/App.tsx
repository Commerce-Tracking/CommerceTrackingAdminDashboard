import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Toaster } from "sonner";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ReportsTables from "./pages/Tables/ReportsTables.tsx";
import UsersTables from "./pages/Tables/UsersTables.tsx";
import AddUserFormElements from "./pages/Forms/AddUserForm.tsx";
import AddReportFormElements from "./pages/Forms/AddReportForm.tsx";
import PrivateRoute from "./components/auth/PrivateRoute.tsx";
import { ValidationStatsProvider } from "./context/ValidationStatsContext";
import { TotalCollectionsProvider } from "./context/TotalCollectionsContext";
import { AcceptedBySupervisorProvider } from "./context/AcceptedBySupervisorContext";
import { PendingCollectionsProvider } from "./context/PendingCollectionsContext";
import { RejectedByLevelProvider } from "./context/RejectedByLevelContext";
import { MonthlyCollectionsProvider } from "./context/MonthlyCollectionsContext";
import { ModalProvider } from "./context/ModalContext";
import { PrimeReactProvider } from "primereact/api";
import ComplaintProvider from "./providers/complaints/ComplaintProvider.tsx";
import ComplaintsTables from "./pages/Tables/ComplaintsTables.tsx";
import ComplaintsTypesTables from "./pages/Tables/ComplaintsTypesTables.tsx";
import AddPays from "./pages/pays/AddPays.tsx";
import CountriesListPage from "./pages/pays/CountriesListPage.tsx";
import AddCorridor from "./pages/corridor/AddCorridor.tsx";
import CorridorsListPage from "./pages/corridor/CorridorsListPage.tsx";
import AddCity from "./pages/city/AddCity.tsx";
import CitiesListPage from "./pages/city/CitiesListPage.tsx";
import UsersRolesTables from "./pages/Tables/UsersRolesTables.tsx";
import ReportsListPage from "./pages/Tables/ReportsListPage.tsx";

import AddCurrency from "./pages/currency/AddCurrency.tsx";
import CurrencyListPage from "./pages/currency/CurrencyListPage.tsx";
import AddProductType from "./pages/product-types/AddProductType.tsx";
import ProductTypesListPage from "./pages/product-types/ProductTypesListPage.tsx";
import AddProduct from "./pages/products/AddProduct.tsx";
import ProductsListPage from "./pages/products/ProductsListPage.tsx";
import CollectorsListPage from "./pages/collectors/CollectorsListPage";
import AddCollector from "./pages/collectors/AddCollector";
import SupervisorsListPage from "./pages/supervisors/SupervisorsListPage";
import AddSupervisor from "./pages/supervisors/AddSupervisor";
import TeamManagersListPage from "./pages/team-managers/TeamManagersListPage";
import AddTeamManager from "./pages/team-managers/AddTeamManager";
import AddCollectionPoint from "./pages/collection-points/AddCollectionPoint";
import CollectionPointsListPage from "./pages/collection-points/CollectionPointsListPage";
import ProductNaturesListPage from "./pages/product-natures/ProductNaturesListPage.tsx";
import AddProductNature from "./pages/product-natures/AddProductNature";
import AddService from "./pages/services/AddService.tsx";
import ServicesListPage from "./pages/services/ServicesListPage.tsx";
import AddTransportMethod from "./pages/transport-methods/AddTransportMethod.tsx";
import TransportMethodsListPage from "./pages/transport-methods/TransportMethodsListPage.tsx";
import AddTransportMode from "./pages/transport-modes/AddTransportMode.tsx";
import TransportModesListPage from "./pages/transport-modes/TransportModesListPage.tsx";
import AddUnity from "./pages/unities/AddUnity.tsx";
import UnitiesListPage from "./pages/unities/UnitiesListPage.tsx";
import CSVExportPage from "./pages/Export/CSVExportPage.tsx";
import OrganizationsListPage from "./pages/organizations/OrganizationsListPage";
import AddOrganization from "./pages/organizations/AddOrganization";
import AddAnimal from "./pages/animals/AddAnimal";
import AnimalsListPage from "./pages/animals/AnimalsListPage";
import AddAnimalType from "./pages/animals/AddAnimalType";
import AnimalTypesListPage from "./pages/animals/AnimalTypesListPage";

export default function App() {
  return (
    <>
      <PrimeReactProvider>
        {/*<PrimeReactProvider value={{locale: 'en'}}>*/}
        <ComplaintProvider>
          <ValidationStatsProvider>
            <TotalCollectionsProvider>
              <AcceptedBySupervisorProvider>
                <PendingCollectionsProvider>
                  <RejectedByLevelProvider>
                    <MonthlyCollectionsProvider>
                      <ModalProvider>
                        <ScrollToTop />
                        <Routes>
                          {/* Dashboard Layout */}

                          <Route element={<PrivateRoute />}>
                            <Route element={<AppLayout />}>
                              <Route index path="/" element={<Home />} />

                              <Route path="/pays" element={<AddPays />} />
                              <Route
                                path="/countries-list"
                                element={<CountriesListPage />}
                              />
                              <Route path="/cities/add" element={<AddCity />} />
                              <Route
                                path="/cities-list"
                                element={<CitiesListPage />}
                              />
                              <Route
                                path="/corridors/add"
                                element={<AddCorridor />}
                              />
                              <Route
                                path="/corridors/list"
                                element={<CorridorsListPage />}
                              />

                              <Route
                                path="/currencies/add"
                                element={<AddCurrency />}
                              />
                              <Route
                                path="/currencies/list"
                                element={<CurrencyListPage />}
                              />

                              <Route
                                path="/product-types/add"
                                element={<AddProductType />}
                              />
                              <Route
                                path="/product-types/list"
                                element={<ProductTypesListPage />}
                              />

                              <Route
                                path="/products/add"
                                element={<AddProduct />}
                              />
                              <Route
                                path="/products/list"
                                element={<ProductsListPage />}
                              />
                              <Route
                                path="/product-natures/add"
                                element={<AddProductNature />}
                              />
                              <Route
                                path="/animals/add"
                                element={<AddAnimal />}
                              />
                              <Route
                                path="/animals/list"
                                element={<AnimalsListPage />}
                              />
                              <Route
                                path="/animals/type/add"
                                element={<AddAnimalType />}
                              />
                              <Route
                                path="/animals/types/list"
                                element={<AnimalTypesListPage />}
                              />

                              <Route
                                path="/collectors/list"
                                element={<CollectorsListPage />}
                              />

                              <Route
                                path="/collectors/add"
                                element={<AddCollector />}
                              />

                              <Route
                                path="/supervisors/list"
                                element={<SupervisorsListPage />}
                              />

                              <Route
                                path="/supervisors/add"
                                element={<AddSupervisor />}
                              />

                              <Route
                                path="/team-managers/list"
                                element={<TeamManagersListPage />}
                              />

                              <Route
                                path="/team-managers/add"
                                element={<AddTeamManager />}
                              />

                              <Route
                                path="/collection-points/add"
                                element={<AddCollectionPoint />}
                              />

                              <Route
                                path="/collection-points/list"
                                element={<CollectionPointsListPage />}
                              />

                              <Route
                                path="/product-natures/list"
                                element={<ProductNaturesListPage />}
                              />

                              <Route
                                path="/services/add"
                                element={<AddService />}
                              />
                              <Route
                                path="/services/list"
                                element={<ServicesListPage />}
                              />

                              <Route
                                path="/transport-methods/add"
                                element={<AddTransportMethod />}
                              />
                              <Route
                                path="/transport-methods/list"
                                element={<TransportMethodsListPage />}
                              />

                              <Route
                                path="/transport-modes/add"
                                element={<AddTransportMode />}
                              />
                              <Route
                                path="/transport-modes/list"
                                element={<TransportModesListPage />}
                              />

                              <Route
                                path="/unities/add"
                                element={<AddUnity />}
                              />
                              <Route
                                path="/unities/list"
                                element={<UnitiesListPage />}
                              />

                              {/* Export Page */}
                              <Route
                                path="/export-csv"
                                element={<CSVExportPage />}
                              />

                              {/* Organizations Page */}
                              <Route
                                path="/organizations/list"
                                element={<OrganizationsListPage />}
                              />
                              <Route
                                path="/organizations/add"
                                element={<AddOrganization />}
                              />

                              {/* Complaints Page */}
                              <Route
                                path="/complaints"
                                element={<ComplaintsTables />}
                              />
                              <Route
                                path="/complaints-types"
                                element={<ComplaintsTypesTables />}
                              />
                              {/*<Route path="/complaints-types" element={<ReportsTables />} />*/}

                              {/* Users Page */}
                              <Route path="/users" element={<UsersTables />} />
                              <Route
                                path="/create-user"
                                element={<AddUserFormElements />}
                              />
                              <Route
                                path="/role-managment"
                                element={<UsersRolesTables />}
                              />

                              {/* Reporting Page */}
                              <Route
                                path="/reportings"
                                element={<AddReportFormElements />}
                              />

                              <Route
                                path="/reportings/list"
                                element={<ReportsListPage />}
                              />

                              <Route path="/statistics" element={<Home />} />
                              <Route
                                path="/view-data"
                                element={<ReportsTables />}
                              />

                              <Route
                                path="/profile"
                                element={<UserProfiles />}
                              />
                              <Route path="/calendar" element={<Calendar />} />
                              <Route path="/blank" element={<Blank />} />

                              {/* Forms */}
                              <Route
                                path="/form-elements"
                                element={<FormElements />}
                              />

                              {/* Tables */}
                              <Route
                                path="/basic-tables"
                                element={<BasicTables />}
                              />

                              {/* Ui Elements */}
                              <Route path="/alerts" element={<Alerts />} />
                              <Route path="/avatars" element={<Avatars />} />
                              <Route path="/badge" element={<Badges />} />
                              <Route path="/buttons" element={<Buttons />} />
                              <Route path="/images" element={<Images />} />
                              <Route path="/videos" element={<Videos />} />

                              {/* Charts */}
                              <Route
                                path="/line-chart"
                                element={<LineChart />}
                              />
                              <Route path="/bar-chart" element={<BarChart />} />
                            </Route>
                          </Route>

                          {/* Auth Layout */}
                          <Route path="/signin" element={<SignIn />} />
                          <Route path="/signup" element={<SignUp />} />

                          {/* Fallback Route */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ModalProvider>
                    </MonthlyCollectionsProvider>
                  </RejectedByLevelProvider>
                </PendingCollectionsProvider>
              </AcceptedBySupervisorProvider>
            </TotalCollectionsProvider>
          </ValidationStatsProvider>
        </ComplaintProvider>
      </PrimeReactProvider>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
