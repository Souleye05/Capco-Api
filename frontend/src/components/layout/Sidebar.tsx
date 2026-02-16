import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Banknote,
  Building2,
  Calendar,
  Bell,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  Gavel,
  Menu,
  X,
  Briefcase,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import capcoLogo from '@/assets/capco-logo.png';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  children?: { to: string; label: string }[];
}

const NavItem = ({ to, icon, label, badge, children }: NavItemProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(location.pathname.startsWith(to));
  const isActive = location.pathname === to || (children && location.pathname.startsWith(to));

  if (children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'sidebar-nav-item w-full justify-between',
            isActive && 'sidebar-nav-item-active'
          )}
        >
          <span className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
          </span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="ml-9 mt-1 space-y-1">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  cn(
                    'block px-4 py-2 text-sm rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
                    isActive && 'bg-sidebar-accent text-sidebar-foreground font-medium'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn('sidebar-nav-item', isActive && 'sidebar-nav-item-active')
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrateur', color: 'bg-destructive/20 text-destructive' },
  collaborateur: { label: 'Collaborateur', color: 'bg-primary/20 text-primary' },
  compta: { label: 'Comptabilité', color: 'bg-success/20 text-success' },
};

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, role, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const roleInfo = role ? roleLabels[role] : roleLabels.collaborateur;

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center px-4 border-b border-sidebar-border">
            <img 
              src={capcoLogo} 
              alt="CAPCO" 
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard className="h-5 w-5" />} label="Tableau de bord" />
            <NavItem to="/agenda" icon={<Calendar className="h-5 w-5" />} label="Agenda" />
            
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                Modules
              </p>
            </div>

            <NavItem
              to="/contentieux"
              icon={<Gavel className="h-5 w-5" />}
              label="Contentieux"
              badge={1}
              children={[
                { to: '/contentieux/affaires', label: 'Affaires' },
                { to: '/contentieux/audiences', label: 'Audiences' }
              ]}
            />

            <NavItem
              to="/recouvrement"
              icon={<Banknote className="h-5 w-5" />}
              label="Recouvrement"
              children={[
                { to: '/recouvrement/dossiers', label: 'Dossiers' },
                { to: '/recouvrement/paiements', label: 'Paiements' }
              ]}
            />

            <NavItem
              to="/immobilier"
              icon={<Building2 className="h-5 w-5" />}
              label="Immobilier"
              children={[
                { to: '/immobilier/immeubles', label: 'Immeubles' },
                { to: '/immobilier/lots', label: 'Lots' },
                { to: '/immobilier/locataires', label: 'Locataires' },
                { to: '/immobilier/loyers', label: 'Loyers' },
                { to: '/immobilier/impayes', label: 'Impayés' },
                { to: '/immobilier/rapports', label: 'Rapports' }
              ]}
            />

            <NavItem
              to="/conseil"
              icon={<Briefcase className="h-5 w-5" />}
              label="Conseils"
              children={[
                { to: '/conseil/clients', label: 'Clients' },
                { to: '/conseil/factures', label: 'Factures' }
              ]}
            />

            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                Administration
              </p>
            </div>

            <NavItem to="/alertes" icon={<Bell className="h-5 w-5" />} label="Alertes" badge={3} />
            {isAdmin && (
              <NavItem to="/utilisateurs" icon={<Users className="h-5 w-5" />} label="Utilisateurs" />
            )}
            <NavItem to="/parametres" icon={<Settings className="h-5 w-5" />} label="Paramètres" />
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <ThemeToggle variant="sidebar" />
            
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-foreground">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email || 'Utilisateur'}
                </p>
                <Badge className={cn('text-xs', roleInfo.color)} variant="secondary">
                  {roleInfo.label}
                </Badge>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
