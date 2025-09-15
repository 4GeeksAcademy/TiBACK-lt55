import React from 'react';
import { Navigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

const loginRoutesByRole = {
  supervisor: "/auth-supervisor",
  cliente: "/auth",
  administrador: "/auth-administrador",
  analista: "/auth-analista",

};

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { store, hasRole } = useGlobalReducer();

  if (store.auth.isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!store.auth.isAuthenticated) {
    // Buscar la ruta de login para el primer rol permitido que tenga ruta definida
    for (const role of allowedRoles) {
      if (loginRoutesByRole[role]) {
        return <Navigate to={loginRoutesByRole[role]} replace />;
      }
    }
    // Si no hay rol específico, ir al general
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;