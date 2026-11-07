import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminPermission } from '../types/permissions';

interface AdminPermissionGuardProps {
  children: React.ReactNode;
  permission?: AdminPermission | AdminPermission[];
  superAdminOnly?: boolean;
  featureName?: string;
}

export const AdminPermissionGuard: React.FC<AdminPermissionGuardProps> = ({
  children,
  permission,
  superAdminOnly = false,
  featureName = 'this administrative section'
}) => {
  const { isSuperAdmin, hasPermission, isSuspended } = useAuth();

  if (isSuspended) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-card border border-rose-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-rose-900">Account Suspended</h2>
          <p className="text-xs text-content-muted leading-relaxed">
            Your administrative account has been suspended by the Super Administrator. Access is restricted.
          </p>
        </div>
      </div>
    );
  }

  // Superadmin Exclusive Sections
  if (superAdminOnly && !isSuperAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-card border border-rose-200 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-rose-900">Access Restricted</h2>
          <p className="text-xs text-content-muted leading-relaxed">
            The {featureName} is strictly restricted to the Super Administrator. Ordinary administrators are not authorized to access this section.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-btn text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Granular Permission Checks
  if (permission && !isSuperAdmin) {
    const requiredList = Array.isArray(permission) ? permission : [permission];
    const hasAny = requiredList.some((p) => hasPermission(p));

    if (!hasAny) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-8 rounded-card border border-amber-200 shadow-card text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold font-serif text-content-primary">Access Restricted</h2>
            <p className="text-xs text-content-muted leading-relaxed">
              Your administrative account does not possess permission to access {featureName}.
              Please contact the Super Administrator if you require elevated privileges.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-btn text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
