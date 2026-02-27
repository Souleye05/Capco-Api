import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Banknote,
  Building2,
  Calendar,
  Bell,
  Users,
  ChevronDown,
  Gavel,
  Menu,
  X,
  Briefcase,
  LogOut,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import capcoLogo from '@/assets/capco-logo.png';
import { mockAlertes } from '@/data/mockData';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItemConfig {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  children?: { to: string; label: string }[];
}

interface NavItemProps extends NavItemConfig {
  collapsed?: boolean;
}

const NavItem = ({ to, icon, label, badge, children, collapsed }: NavItemProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(location.pathname.startsWith(to));
  const isActive = location.pathname === to || (children && location.pathname.startsWith(to));

  if (children) {
    const content = (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
            isActive && 'text-sidebar-foreground bg-sidebar-accent font-medium',
            collapsed && 'justify-center px-2'
          )}
        >
          <span className="shrink-0">{icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{label}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
            </>
          )}
        </button>
        {isOpen && !collapsed && (
          <div className="ml-8 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-1.5 text-sm rounded-md transition-colors',
                    'text-sidebar-foreground/50 hover:text-sidebar-foreground',
                    isActive && 'text-sidebar-foreground font-medium bg-sidebar-accent'
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

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  }

  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
          isActive && 'text-sidebar-foreground bg-sidebar-accent font-medium',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] justify-center">
          {badge}
        </Badge>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">
          {label}
          {badge !== undefined && badge > 0 && ` (${badge})`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
};

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-destructive/10 text-destructive' },
  collaborateur: { label: 'Collab.', color: 'bg-primary/10 text-primary' },
  compta: { label: 'Compta', color: 'bg-success/10 text-success' },
};

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, roles, signOut, isAdmin } = useNestJSAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync sidebar width with layout
  useEffect(() => {
    const width = isCollapsed ? '80px' : '256px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [isCollapsed]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const userName = user?.email?.split('@')[0] || 'Utilisateur';

  const unreadAlerts = mockAlertes.filter(a => !a.lu).length;

  const navItems: NavItemConfig[] = [
    { to: '/', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Tableau de bord' },
    { to: '/agenda', icon: <Calendar className="h-4 w-4" />, label: 'Agenda' },
  ];

  const moduleItems: NavItemConfig[] = [
    {
      to: '/contentieux',
      icon: <Gavel className="h-4 w-4" />,
      label: 'Contentieux',
      children: [
        { to: '/contentieux/affaires', label: 'Affaires' },
        { to: '/contentieux/audiences', label: 'Audiences' },
        { to: '/contentieux/honoraires', label: 'Honoraires' },
        { to: '/contentieux/depenses', label: 'Dépenses' },
      ],
    },
    {
      to: '/recouvrement',
      icon: <Banknote className="h-4 w-4" />,
      label: 'Recouvrement',
      children: [
        { to: '/recouvrement/dossiers', label: 'Dossiers' },
        { to: '/recouvrement/paiements', label: 'Paiements' },
      ],
    },
    {
      to: '/immobilier',
      icon: <Building2 className="h-4 w-4" />,
      label: 'Immobilier',
      children: [
        { to: '/immobilier/immeubles', label: 'Immeubles' },
        { to: '/immobilier/lots', label: 'Lots' },
        { to: '/immobilier/locataires', label: 'Locataires' },
        { to: '/immobilier/loyers', label: 'Loyers' },
        { to: '/immobilier/impayes', label: 'Impayés' },
        { to: '/immobilier/arrieres', label: 'Arriérés' },
        { to: '/immobilier/depenses', label: 'Dépenses' },
        { to: '/immobilier/rapports', label: 'Rapports' },
      ],
    },
    {
      to: '/conseil',
      icon: <Briefcase className="h-4 w-4" />,
      label: 'Conseils',
      children: [
        { to: '/conseil/clients', label: 'Clients' },
        { to: '/conseil/factures', label: 'Factures' },
      ],
    },
  ];

  const adminItems: NavItemConfig[] = [
    ...(isAdmin ? [{ to: '/utilisateurs', icon: <Users className="h-4 w-4" />, label: 'Utilisateurs' }] : []),
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-9 w-9 bg-background/80 backdrop-blur-md shadow-sm border border-border"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
          sidebarWidth,
          'lg:translate-x-0 overflow-hidden',
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn(
            "h-16 flex items-center border-b border-sidebar-border/50 shrink-0 transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "justify-between px-6"
          )}>
            {!isCollapsed && (
              <img
                src={capcoLogo}
                alt="CAPCO"
                className="h-9 w-auto object-contain cursor-pointer transition-transform hover:scale-105"
                onClick={() => navigate('/')}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 text-sidebar-foreground/40 hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={isCollapsed} />
            ))}

            {!isCollapsed && (
              <div className="pt-6 pb-2 px-4">
                <p className="text-[10px] font-bold text-sidebar-foreground/20 uppercase tracking-widest">
                  Écosystèmes
                </p>
              </div>
            )}
            {isCollapsed && <div className="my-4 border-t border-sidebar-border/50 mx-4" />}

            {moduleItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={isCollapsed} />
            ))}

            {(adminItems.length > 0) && (
              <>
                {!isCollapsed && (
                  <div className="pt-6 pb-2 px-4">
                    <p className="text-[10px] font-bold text-sidebar-foreground/20 uppercase tracking-widest">
                      Administration
                    </p>
                  </div>
                )}
                {isCollapsed && <div className="my-4 border-t border-sidebar-border/50 mx-4" />}
                {adminItems.map((item) => (
                  <NavItem key={item.to} {...item} collapsed={isCollapsed} />
                ))}
              </>
            )}
          </nav>

          {/* Footer Section - REDESIGNED */}
          <div className={cn(
            "mt-auto border-t border-sidebar-border bg-sidebar-accent/30 p-4 transition-all duration-300",
            isCollapsed ? "items-center" : "space-y-4"
          )}>


            {/* 2. User Info */}
            <div className={cn(
              "flex items-center gap-3 rounded-2xl p-2 transition-all duration-300",
              !isCollapsed && "hover:bg-sidebar-accent cursor-pointer group"
            )}>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/20 group-hover:border-primary/40 transition-all">
                <span className="text-sm font-bold text-primary">{userInitials}</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate capitalize">
                    {userName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                    {roles?.[0] || 'Collaborateur'}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Logout */}
            <div className={cn(
              "flex items-center gap-2",
              isCollapsed ? "flex-col" : "justify-between"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 rounded-xl transition-all",
                  isCollapsed ? "w-10 hover:bg-destructive/10 hover:text-destructive" : "flex-1 justify-start px-3 hover:bg-destructive/10 hover:text-destructive"
                )}
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="ml-3 text-sm font-medium">Déconnexion</span>}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function useSidebarWidth() {
  // This is a simple approach - the sidebar manages its own collapsed state internally
  // The MainLayout just needs the max width for the margin
  return 'lg:ml-60';
}
