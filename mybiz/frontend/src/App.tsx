import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { IncomePage } from './pages/Income';
import { ExpensesPage } from './pages/Expenses';
import { BudgetsPage } from './pages/Budgets';
import { SavingsPage } from './pages/Savings';
import { CashFlowPage } from './pages/CashFlow';
import { BusinessPage } from './pages/Business';
import { CustomersPage } from './pages/Customers';
import { ProductsPage } from './pages/Products';
import { SalesPage } from './pages/Sales';
import { AnalyticsPage } from './pages/Analytics';
import { ForecastPage } from './pages/Forecast';
import { AIAdvisorPage } from './pages/AIAdvisor';
import { NotificationsPage } from './pages/Notifications';
import { ExportPage } from './pages/Export';
import { SettingsPage } from './pages/Settings';
import { LoadingSpinner } from './components/UI';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="savings" element={<SavingsPage />} />
            <Route path="cashflow" element={<CashFlowPage />} />
            <Route path="business" element={<BusinessPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="ai-advisor" element={<AIAdvisorPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
