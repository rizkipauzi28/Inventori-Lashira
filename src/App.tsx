import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Sidebar,
  AlertBanner,
  LoginPage,
  LandingPage,
  DashboardView,
  IngredientsView,
  UnitsCategoriesView,
  ProductsView,
  RecipesView,
  ProductionView,
  StockView,
  SalesView,
  ExpensesView,
  FinancialReportView,
  ProductAnalysisView,
  SettingsView
} from './components';
import { User, AppSettings, DashboardSummary } from './types';
import { api } from './services/api';

export function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('landing');
  const [targetRecipeProductId, setTargetRecipeProductId] = useState<number | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lashira_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Global Alerts State
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);

  // Load Settings & Dashboard Alerts
  const refreshGlobalState = async () => {
    try {
      const [setRes, sumRes] = await Promise.all([
        api.getSettings(),
        api.getDashboardSummary()
      ]);
      if (setRes.success) setSettings(setRes.data);
      if (sumRes.success) setSummaryData(sumRes.data);
    } catch (err) {
      console.error('Failed to load global state:', err);
    }
  };

  useEffect(() => {
    refreshGlobalState();
  }, [currentView]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('lashira_user', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lashira_user');
    setCurrentView('landing');
  };

  const handleNavigate = (view: string, productId?: number) => {
    if (view === 'recipes' && productId) {
      setTargetRecipeProductId(productId);
    } else {
      setTargetRecipeProductId(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is on landing page
  if (currentView === 'landing' && !currentUser) {
    return (
      <LandingPage
        onOpenLogin={() => setCurrentView('login')}
        settings={settings}
      />
    );
  }

  // If user is on login page
  if (currentView === 'login' && !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        settings={settings}
      />
    );
  }

  // If user is logged out but on protected view, prompt login
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        settings={settings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        alertsCount={(summaryData?.low_stock_ingredients.length || 0) + (summaryData?.low_stock_products.length || 0)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Global Warning / Stock Alerts Banner */}
            {summaryData && (
              <AlertBanner
                lowStockIngredients={summaryData.low_stock_ingredients}
                lowStockProducts={summaryData.low_stock_products}
                onNavigate={handleNavigate}
              />
            )}

            {/* Dynamic Active View Component */}
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={handleNavigate}
                currentUser={currentUser}
              />
            )}

            {currentView === 'ingredients' && (
              <IngredientsView currentUser={currentUser} />
            )}

            {currentView === 'units_categories' && (
              <UnitsCategoriesView />
            )}

            {currentView === 'products' && (
              <ProductsView onNavigateToRecipe={(pId) => handleNavigate('recipes', pId)} />
            )}

            {currentView === 'recipes' && (
              <RecipesView initialProductId={targetRecipeProductId} />
            )}

            {currentView === 'production' && (
              <ProductionView currentUser={currentUser} />
            )}

            {currentView === 'stock' && (
              <StockView />
            )}

            {currentView === 'sales' && (
              <SalesView currentUser={currentUser} settings={settings} />
            )}

            {currentView === 'expenses' && (
              <ExpensesView currentUser={currentUser} />
            )}

            {currentView === 'reports' && (
              <FinancialReportView settings={settings} />
            )}

            {currentView === 'analysis' && (
              <ProductAnalysisView />
            )}

            {currentView === 'settings' && (
              <SettingsView
                settings={settings}
                currentUser={currentUser}
                onSettingsUpdated={(newSet) => setSettings(newSet)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
