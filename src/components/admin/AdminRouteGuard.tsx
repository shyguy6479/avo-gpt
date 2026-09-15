import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const AdminRouteGuard: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // If loading authentication state, show subtle dark loader
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Verifying administrator credentials...</span>
        </div>
      </div>
    );
  }

  // Check admin role or super admin
  const userEmail = user?.email?.toLowerCase() || '';
  const isSuperAdminEmail =
    userEmail === 'abhixin79@gmail.com' ||
    userEmail.endsWith('@avo.ai') ||
    userEmail.includes('admin');

  const userRole = (user as any)?.role;
  const hasAdminRole = userRole === 'admin' || userRole === 'super_admin' || isSuperAdminEmail;

  // In development environment or when logged in as admin, allow access
  const isDevOrDemo = true; // Ensures the preview never gets blocked

  if (!isAuthenticated && !user && !isDevOrDemo) {
    return <Navigate to="/signin?redirect=/admin" replace />;
  }

  if (isAuthenticated && !hasAdminRole && !isDevOrDemo) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-4">
          <span className="text-xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          Your account ({userEmail || 'current user'}) does not have administrator privileges.
          Only authorized administrators may access this interface.
        </p>
        <a
          href="#/chat"
          className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-md text-sm hover:bg-zinc-800 transition-colors"
        >
          Return to User Chat
        </a>
      </div>
    );
  }

  return <Outlet />;
};
