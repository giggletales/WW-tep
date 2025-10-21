import { useState, useEffect, Suspense, Component, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import MembershipPlans from './components/MembershipPlans';
import PaymentFlow from './components/PaymentFlow';
// import PayPalPayment from './components/PayPalPayment';
// import StripePayment from './components/StripePayment';
import SuccessfulPaymentPage from './components/SuccessfulPaymentPage';
import Questionnaire from './components/Questionnaire';
import PropFirmSelection from './components/PropFirmSelection';
import AccountConfiguration from './components/AccountConfiguration';
import RiskConfiguration from './components/RiskConfiguration';
import TradingPlanGeneration from './components/TradingPlanGenerator';
import RiskManagementPage from './components/RiskManagementPage';
import RiskManagementPlan from './components/RiskManagementPlan';
import ComprehensiveRiskPlan from './components/ComprehensiveRiskPlan';
import UploadScreenshot from './components/UploadScreenshot';
import TradeMentor from './components/TradeMentor';
import Dashboard from './components/Dashboard';
import AdminMpinLogin from './components/AdminMpinLogin';
import AdminDashboard from './components/AdminDashboard';
import AffiliateLinks from './components/AffiliateLinks';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { UserProvider, useUser } from './contexts/UserContext';
import { TradingPlanProvider, useTradingPlan } from './contexts/TradingPlanContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { clearState } from './trading/dataStorage';
import Features from './components/Features';
import About from './components/About';
import Terms from './components/Terms';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQ from './components/FAQ';
import { SignalDistributionProvider } from './components/SignalDistributionService';
import AnimationTest from './components/AnimationTest';

import CustomerServiceMpinLogin from './components/CustomerServiceMpinLogin';
import CustomerServiceProtectedRoute from './components/CustomerServiceProtectedRoute';
import EnhancedCustomerServiceDashboard from './components/EnhancedCustomerServiceDashboard';
import CustomerDetail from './components/CustomerDetail';
import ContactSupport from './components/ContactSupport';
import AICoach from './components/AICoach';
import Lightning from './components/Lightning';
import Footer from './components/Footer';
import DatabaseDashboard from './components/DatabaseDashboard';

// Global Error Boundary for the entire app
class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              We encountered an error while loading the application. This might be due to a temporary issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
            <div className="mt-4 text-sm text-gray-400">
              <p>Error: {this.state.error?.message}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const { logout: userLogout } = useUser();
  const { logout: adminLogout } = useAdmin();
  const { resetPlan } = useTradingPlan();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    userLogout();
    resetPlan();
    clearState();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('trading_state_') || key.startsWith('dashboard_data_') || key.startsWith('user_backup_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('user_consent_accepted');
    window.location.href = '/signin';
  };

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  useEffect(() => {
    document.body.classList.add('perspective-body');
    return () => {
      document.body.classList.remove('perspective-body');
    };
  }, []);

  // Check if current route is a dashboard route
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/admin/dashboard') ||
                          location.pathname.startsWith('/customer-service/dashboard');

  return (
    <div className="min-h-screen" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/classic" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/membership" element={<MembershipPlans />} />
        <Route path="/payment-flow" element={<ProtectedRoute><PaymentFlow /></ProtectedRoute>} />
        {/* <Route path="/paypal-payment" element={<ProtectedRoute><PayPalPayment /></ProtectedRoute>} />
        <Route path="/stripe-payment" element={<ProtectedRoute><StripePayment /></ProtectedRoute>} /> */}
        <Route path="/successful-payment" element={<SuccessfulPaymentPage />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/risk-management" element={<RiskManagementPage />} />
        <Route path="/risk-management-plan" element={<RiskManagementPlan />} />
        <Route path="/comprehensive-risk-plan" element={<ComprehensiveRiskPlan />} />
        <Route path="/upload-screenshot" element={<UploadScreenshot />} />
        <Route path="/setup/prop-firm" element={<PropFirmSelection />} />
        <Route path="/setup/account" element={<AccountConfiguration />} />
        <Route path="/setup/risk" element={<RiskConfiguration />} />
        <Route path="/setup/plan" element={<TradingPlanGeneration />} />
        <Route
          path="/dashboard/:tab"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminMpinLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard onLogout={handleAdminLogout} />
            </AdminProtectedRoute>
          }
        />
        <Route path="/database" element={<DatabaseDashboard />} />
        <Route path="/affiliate-links" element={<AffiliateLinks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/payment" element={<PaymentFlow />} />
        <Route path="/trade-mentor/:tradeId" element={<TradeMentor />} />
        <Route path="/customer-service" element={<CustomerServiceMpinLogin />} />
          <Route
            path="/customer-service/dashboard"
            element={
              <CustomerServiceProtectedRoute>
                <EnhancedCustomerServiceDashboard />
              </CustomerServiceProtectedRoute>
            }
          />
          <Route
            path="/customer-service/customer/:id"
            element={
              <CustomerServiceProtectedRoute>
                <CustomerDetail />
              </CustomerServiceProtectedRoute>
            }
          />
        <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
        <Route path="/lightning" element={<Lightning><LandingPage /></Lightning>} />
        <Route path="/animation-test" element={<AnimationTest />} />
        </Routes>
      </Suspense>
      {/* Show footer on all pages except dashboards */}
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <SignalDistributionProvider>
        <AdminProvider>
          <UserProvider>
            <TradingPlanProvider>
              <Router>
                <AppContent />
              </Router>
            </TradingPlanProvider>
          </UserProvider>
        </AdminProvider>
      </SignalDistributionProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
