import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { NestJSAuthProvider } from "@/contexts/NestJSAuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import AgendaPage from "@/pages/AgendaPage";
import AffairesPage from "@/pages/contentieux/AffairesPage";
import AffaireDetailPage from "@/pages/contentieux/AffaireDetailPage";
import AudiencesPage from "@/pages/contentieux/AudiencesPage";
import { AudienceDetailsPage } from "@/pages/contentieux/AudienceDetailsPage";
import HonorairesPage from "@/pages/contentieux/HonorairesPage";
import DepensesPage from "@/pages/contentieux/DepensesPage";
import DossiersPage from "@/pages/recouvrement/DossiersPage";
import DossierDetailPage from "@/pages/recouvrement/DossierDetailPage";
import PaiementsPage from "@/pages/recouvrement/PaiementsPage";
import ImmeublesPage from "@/pages/immobilier/ImmeublesPage";
import ImmeubleDetailPage from "@/pages/immobilier/ImmeubleDetailPage";
import LotsPage from "@/pages/immobilier/LotsPage";
import LocatairesPage from "@/pages/immobilier/LocatairesPage";
import LoyersPage from "@/pages/immobilier/LoyersPage";
import ImpayesPage from "@/pages/immobilier/ImpayesPage";
import ArrieresPage from "@/pages/immobilier/ArrieresPage";
import DepensesImmeublesPage from "@/pages/immobilier/DepensesPage";
import RapportsPage from "@/pages/immobilier/RapportsPage";
import ProprietairesPage from "@/pages/immobilier/ProprietairesPage";
import ClientsPage from "@/pages/conseil/ClientsPage";
import ClientDetailPage from "@/pages/conseil/ClientDetailPage";
import FacturesPage from "@/pages/conseil/FacturesPage";
import AlertesPage from "@/pages/AlertesPage";
import NestJSLogin from "@/pages/NestJSLogin";
import ChangePassword from "@/pages/ChangePassword";
import SignUpPage from "@/pages/auth/SignUpPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import UsersPage from "@/pages/admin/UsersPage";
import JuridictionsPage from "@/pages/admin/JuridictionsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Composant wrapper pour les routes protégées avec MainLayout
const ProtectedLayout = () => (
  <ProtectedRoute>
    <MainLayout>
      <Outlet />
    </MainLayout>
  </ProtectedRoute>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NestJSAuthProvider>
            <Routes>
              {/* Auth routes */}
              <Route path="/auth/login" element={<NestJSLogin />} />
              <Route path="/auth/signup" element={<SignUpPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/change-password" element={<ChangePassword />} />

              {/* Protected routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<AgendaPage />} />

                {/* Contentieux */}
                <Route path="/contentieux" element={<Navigate to="/contentieux/affaires" replace />} />
                <Route path="/contentieux/affaires" element={<AffairesPage />} />
                <Route path="/contentieux/affaires/:id" element={<AffaireDetailPage />} />
                <Route path="/contentieux/audiences" element={<AudiencesPage />} />
                <Route path="/contentieux/audiences/:id" element={<AudienceDetailsPage />} />
                <Route path="/contentieux/honoraires" element={<HonorairesPage />} />
                <Route path="/contentieux/depenses" element={<DepensesPage />} />

                {/* Recouvrement */}
                <Route path="/recouvrement" element={<Navigate to="/recouvrement/dossiers" replace />} />
                <Route path="/recouvrement/dossiers" element={<DossiersPage />} />
                <Route path="/recouvrement/dossiers/:id" element={<DossierDetailPage />} />
                <Route path="/recouvrement/paiements" element={<PaiementsPage />} />

                {/* Immobilier */}
                <Route path="/immobilier" element={<Navigate to="/immobilier/immeubles" replace />} />
                <Route path="/immobilier/proprietaires" element={<ProprietairesPage />} />
                <Route path="/immobilier/immeubles" element={<ImmeublesPage />} />
                <Route path="/immobilier/immeubles/:id" element={<ImmeubleDetailPage />} />
                <Route path="/immobilier/lots" element={<LotsPage />} />
                <Route path="/immobilier/locataires" element={<LocatairesPage />} />
                <Route path="/immobilier/loyers" element={<LoyersPage />} />
                <Route path="/immobilier/impayes" element={<ImpayesPage />} />
                <Route path="/immobilier/arrieres" element={<ArrieresPage />} />
                <Route path="/immobilier/depenses" element={<DepensesImmeublesPage />} />
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
                <Route path="/juridictions" element={
                  <ProtectedRoute requiredRole="admin">
                    <JuridictionsPage />
                  </ProtectedRoute>
                } />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/parametres" element={<Dashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </NestJSAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
