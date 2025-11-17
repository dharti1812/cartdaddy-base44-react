import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Orders from "./Orders";

import Retailers from "./Retailers";

import Dispatch from "./Dispatch";

import Analytics from "./Analytics";

import Settings from "./Settings";

import RetailerPortal from "./RetailerPortal";

import RetailerOnboarding from "./RetailerOnboarding";

import APIDocumentation from "./APIDocumentation";

import IntegrationGuide from "./IntegrationGuide";

import CashfreeSetup from "./CashfreeSetup";

import LiveTracking from "./LiveTracking";

import RetailerDashboard from "./RetailerDashboard";

import TrackOrder from "./TrackOrder";

import DeliveryPartnerLogin from "./DeliveryPartnerLogin";

import DeliveryPartnerPortal from "./DeliveryPartnerPortal";

import RetailerLiveTracking from "./RetailerLiveTracking";

import DeliveryPartnerOnboarding from "./DeliveryPartnerOnboarding";

import ManageDeliveryPartners from "./ManageDeliveryPartners";

import DeliveryBoyPortal from "./DeliveryBoyPortal";

import TestSARV from "./TestSARV";

import DebugSARV from "./DebugSARV";

import CheckSmartPingConfig from "./CheckSmartPingConfig";

import PortalSelector from "./PortalSelector";

import Home from "./Home";

import SARVBackendSetup from "./SARVBackendSetup";

import RetailerLogin from "./RetailerLogin";

import DeliveryBoyLogin from "./DeliveryBoyLogin";

import Verifications from "./Verifications";

import SuperAdminDashboard from "./SuperAdminDashboard";

import CustomerCRM from "./CustomerCRM";

import AdminLogin from "./AdminLogin";

import SuperAdminLogin from "./SuperAdminLogin";

import ProductGenerator from "./ProductGenerator";

import ProtectedRoute from "./ProtectedRoute";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {

    Dashboard: Dashboard,

    Orders: Orders,

    Retailers: Retailers,

    Dispatch: Dispatch,

    Analytics: Analytics,

    Settings: Settings,

    RetailerPortal: RetailerPortal,

    RetailerOnboarding: RetailerOnboarding,

    APIDocumentation: APIDocumentation,

    IntegrationGuide: IntegrationGuide,

    CashfreeSetup: CashfreeSetup,

    LiveTracking: LiveTracking,

    RetailerDashboard: RetailerDashboard,

    TrackOrder: TrackOrder,

    DeliveryPartnerLogin: DeliveryPartnerLogin,

    DeliveryPartnerPortal: DeliveryPartnerPortal,

    RetailerLiveTracking: RetailerLiveTracking,

    DeliveryPartnerOnboarding: DeliveryPartnerOnboarding,

    ManageDeliveryPartners: ManageDeliveryPartners,

    DeliveryBoyPortal: DeliveryBoyPortal,

    TestSARV: TestSARV,

    DebugSARV: DebugSARV,

    CheckSmartPingConfig: CheckSmartPingConfig,

    PortalSelector: PortalSelector,

    Home: Home,

    SARVBackendSetup: SARVBackendSetup,

    RetailerLogin: RetailerLogin,

    DeliveryBoyLogin: DeliveryBoyLogin,

    Verifications: Verifications,

    SuperAdminDashboard: SuperAdminDashboard,

    CustomerCRM: CustomerCRM,

    AdminLogin: AdminLogin,

    SuperAdminLogin: SuperAdminLogin,

    ProductGenerator: ProductGenerator,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>

                <Route
                    path="/"
                    element={
                        (() => {
                        const user = JSON.parse(sessionStorage.getItem("user"));
                        const token = sessionStorage.getItem("token");

                        if (user && token) {
                            if (user.user_type === "admin") {
                            return <Navigate to="/Dashboard" replace />;
                            } else {
                            return <Navigate to="/SuperAdminLogin" replace />;
                            }
                        }

                        return <Navigate to="/portalSelector" replace />;
                        })()
                    }
                    />


                <Route
                    path="/Dashboard"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                
                <Route path="/Orders" element={<Orders />} />

                <Route path="/Retailers" element={<Retailers />} />

                <Route path="/Dispatch" element={<Dispatch />} />

                <Route path="/Analytics" element={<Analytics />} />

                <Route path="/Settings" element={<Settings />} />

                <Route path="/RetailerPortal" element={<RetailerPortal />} />

                <Route path="/RetailerOnboarding" element={<RetailerOnboarding />} />

                <Route path="/APIDocumentation" element={<APIDocumentation />} />

                <Route path="/IntegrationGuide" element={<IntegrationGuide />} />

                <Route path="/CashfreeSetup" element={<CashfreeSetup />} />

                <Route path="/LiveTracking" element={<LiveTracking />} />

                <Route path="/RetailerDashboard" element={<RetailerDashboard />} />

                <Route path="/TrackOrder" element={<TrackOrder />} />

                <Route path="/DeliveryPartnerLogin" element={<DeliveryPartnerLogin />} />

                <Route path="/DeliveryPartnerPortal" element={<DeliveryPartnerPortal />} />

                <Route path="/RetailerLiveTracking" element={<RetailerLiveTracking />} />

                <Route path="/DeliveryPartnerOnboarding" element={<DeliveryPartnerOnboarding />} />

                <Route path="/ManageDeliveryPartners" element={<ManageDeliveryPartners />} />

                <Route path="/DeliveryBoyPortal" element={<DeliveryBoyPortal />} />

                <Route path="/TestSARV" element={<TestSARV />} />

                <Route path="/DebugSARV" element={<DebugSARV />} />

                <Route path="/CheckSmartPingConfig" element={<CheckSmartPingConfig />} />

                <Route path="/PortalSelector" element={<PortalSelector />} />

                <Route path="/Home" element={<Home />} />

                <Route path="/SARVBackendSetup" element={<SARVBackendSetup />} />

                <Route path="/RetailerLogin" element={<RetailerLogin />} />

                <Route path="/DeliveryBoyLogin" element={<DeliveryBoyLogin />} />

                <Route path="/Verifications" element={<Verifications />} />

                <Route path="/SuperAdminDashboard" element={<SuperAdminDashboard />} />

                <Route path="/CustomerCRM" element={<CustomerCRM />} />

                <Route path="/AdminLogin" element={<AdminLogin />} />

                <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />

                <Route path="/ProductGenerator" element={<ProductGenerator />} />

            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}