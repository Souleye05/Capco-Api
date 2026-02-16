import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import AgendaPage from "@/pages/AgendaPage";
import AffairesPage from "@/pages/contentieux/AffairesPage";
import AffaireDetailPage from "@/pages/contentieux/AffaireDetailPage";
import AudiencesPage from "@/pages/contentieux/AudiencesPage";
import DossiersPage from "@/pages/recouvrement/DossiersPage";
import DossierDetailPage from "@/pages/recouvrement/DossierDetailPage";
import PaiementsPage from "@/pages/recouvrement/PaiementsPage";
import ImmeublesPage from "@/pages/immobilier/ImmeublesPage";
import ImmeubleDetailPage from "@/pages/immobilier/ImmeubleDetailPage";
import LotsPage from "@/pages/immobilier/LotsPage";
import LocatairesPage from "@/pages/immobilier/LocatairesPage";
import LoyersPage from "@/pages/immobilier/LoyersPage";
import ImpayesPage from "@/pages/immobilier/ImpayesPage";
import RapportsPage from "@/pages/immobilier/RapportsPage";
import ClientsPage from "@/pages/conseil/ClientsPage";
import ClientDetailPage from "@/pages/conseil/ClientDetailPage";
import FacturesPage from "@/pages/conseil/FacturesPage";
import AlertesPage from "@/pages/AlertesPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import UsersPage from "@/pages/admin/UsersPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />
            
            {/* Protected routes */}
            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<AgendaPage />} />
              
              {/* Contentieux */}
              <Route path="/contentieux" element={<Navigate to="/contentieux/affaires" replace />} />
              <Route path="/contentieux/affaires" element={<AffairesPage />} />
              <Route path="/contentieux/affaires/:id" element={<AffaireDetailPage />} />
              <Route path="/contentieux/audiences" element={<AudiencesPage />} />
              
              {/* Recouvrement */}
              <Route path="/recouvrement" element={<Navigate to="/recouvrement/dossiers" replace />} />
              <Route path="/recouvrement/dossiers" element={<DossiersPage />} />
              <Route path="/recouvrement/dossiers/:id" element={<DossierDetailPage />} />
              <Route path="/recouvrement/paiements" element={<PaiementsPage />} />
              
              {/* Immobilier */}
              <Route path="/immobilier" element={<Navigate to="/immobilier/immeubles" replace />} />
              <Route path="/immobilier/immeubles" element={<ImmeublesPage />} />
              <Route path="/immobilier/immeubles/:id" element={<ImmeubleDetailPage />} />
              <Route path="/immobilier/lots" element={<LotsPage />} />
              <Route path="/immobilier/locataires" element={<LocatairesPage />} />
              <Route path="/immobilier/loyers" element={<LoyersPage />} />
              <Route path="/immobilier/impayes" element={<ImpayesPage />} />
              <Route path="/immobilier/rapports" element={<RapportsPage />} />
              
              {/* Conseils / Assistance juridique */}
              <Route path="/conseil" element={<Navigate to="/conseil/clients" replace />} />
              <Route path="/conseil/clients" element={<ClientsPage />} />
              <Route path="/conseil/clients/:id" element={<ClientDetailPage />} />
              <Route path="/conseil/factures" element={<FacturesPage />} />
              
              {/* Admin */}
              <Route path="/alertes" element={<AlertesPage />} />
              <Route path="/utilisateurs" element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="/parametres" element={<Dashboard />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
