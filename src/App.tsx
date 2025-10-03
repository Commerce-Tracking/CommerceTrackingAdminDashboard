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
import { ModalProvider } from "./context/ModalContext.tsx";
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
import AddService from "./pages/services/AddService.tsx";
import ServicesListPage from "./pages/services/ServicesListPage.tsx";
import AddTransportMethod from "./pages/transport-methods/AddTransportMethod.tsx";
import TransportMethodsListPage from "./pages/transport-methods/TransportMethodsListPage.tsx";

export default function App() {
  return (
    <>
      <PrimeReactProvider>
        {/*<PrimeReactProvider value={{locale: 'en'}}>*/}
        <ComplaintProvider>
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
                  <Route path="/cities-list" element={<CitiesListPage />} />
                  <Route path="/corridors/add" element={<AddCorridor />} />
                  <Route
                    path="/corridors/list"
                    element={<CorridorsListPage />}
                  />

                  <Route path="/currencies/add" element={<AddCurrency />} />
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

                  <Route path="/products/add" element={<AddProduct />} />
                  <Route path="/products/list" element={<ProductsListPage />} />

                  <Route path="/services/add" element={<AddService />} />
                  <Route path="/services/list" element={<ServicesListPage />} />

                  <Route
                    path="/transport-methods/add"
                    element={<AddTransportMethod />}
                  />
                  <Route
                    path="/transport-methods/list"
                    element={<TransportMethodsListPage />}
                  />

                  {/* Complaints Page */}
                  <Route path="/complaints" element={<ComplaintsTables />} />
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
                  <Route path="/view-data" element={<ReportsTables />} />

                  <Route path="/profile" element={<UserProfiles />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/blank" element={<Blank />} />

                  {/* Forms */}
                  <Route path="/form-elements" element={<FormElements />} />

                  {/* Tables */}
                  <Route path="/basic-tables" element={<BasicTables />} />

                  {/* Ui Elements */}
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/avatars" element={<Avatars />} />
                  <Route path="/badge" element={<Badges />} />
                  <Route path="/buttons" element={<Buttons />} />
                  <Route path="/images" element={<Images />} />
                  <Route path="/videos" element={<Videos />} />

                  {/* Charts */}
                  <Route path="/line-chart" element={<LineChart />} />
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
        </ComplaintProvider>
      </PrimeReactProvider>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
