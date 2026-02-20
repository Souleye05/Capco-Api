import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const primaryRole = roles?.[0] || 'collaborateur';
  const roleInfo = primaryRole ? roleLabels[primaryRole] : roleLabels.collaborateur;

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
    { to: '/alertes', icon: <Bell className="h-4 w-4" />, label: 'Alertes', badge: 3 },
    ...(isAdmin ? [{ to: '/utilisateurs', icon: <Users className="h-4 w-4" />, label: 'Utilisateurs' }] : []),
  ];

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-60';

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-9 w-9"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out',
          sidebarWidth,
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0 w-60' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Collapse toggle */}
          <div className={cn(
            "h-14 flex items-center border-b border-sidebar-border shrink-0",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            {!isCollapsed && (
              <img src={capcoLogo} alt="CAPCO" className="h-8 w-auto object-contain" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={isCollapsed} />
            ))}

            {!isCollapsed && (
              <div className="pt-4 pb-1.5 px-3">
                <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
                  Modules
                </p>
              </div>
            )}
            {isCollapsed && <div className="my-2 border-t border-sidebar-border" />}

            {moduleItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={isCollapsed} />
            ))}

            {!isCollapsed && (
              <div className="pt-4 pb-1.5 px-3">
                <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
                  Administration
                </p>
              </div>
            )}
            {isCollapsed && <div className="my-2 border-t border-sidebar-border" />}

            {adminItems.map((item) => (
              <NavItem key={item.to} {...item} collapsed={isCollapsed} />
            ))}
          </nav>

          {/* Footer */}
          <div className={cn(
            "border-t border-sidebar-border p-2 space-y-1",
            isCollapsed && "flex flex-col items-center"
          )}>
            <ThemeToggle variant="sidebar" />
            
            {!isCollapsed ? (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">{userInitials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {user?.email || 'Utilisateur'}
                  </p>
                  <Badge className={cn('text-[10px] h-4', roleInfo.color)} variant="secondary">
                    {roleInfo.label}
                  </Badge>
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{userInitials}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{user?.email}</TooltipContent>
              </Tooltip>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full text-sidebar-foreground/50 hover:text-sidebar-foreground h-8",
                isCollapsed ? "px-0 justify-center" : "justify-start"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2 text-xs">Déconnexion</span>}
            </Button>
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
