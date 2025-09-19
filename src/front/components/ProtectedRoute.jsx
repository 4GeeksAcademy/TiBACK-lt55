import React from 'react';
import { Navigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

// Utilidades de token seguras
const tokenUtils = {
  decodeToken: (token) => {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      return null;
    }
  },
  getRole: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.role : null;
  }
};

export function ProtectedRoute({ children, allowedRoles = [] }) {
    const { store, hasRole } = useGlobalReducer();

    // Si está cargando, mostrar loading
    if (store.auth.isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    // Si no está autenticado, redirigir al login
    if (!store.auth.isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // SEGURIDAD: Verificar rol usando token, no estado local
    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
