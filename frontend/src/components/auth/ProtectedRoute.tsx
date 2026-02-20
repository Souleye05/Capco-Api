import { Navigate, useLocation } from 'react-router-dom';
import { useNestJSAuth } from '@/contexts/NestJSAuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'collaborateur' | 'compta';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, roles, loading, isAdmin } = useNestJSAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !roles.includes(requiredRole) && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
