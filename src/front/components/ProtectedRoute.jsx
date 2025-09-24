import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();

    // Función para determinar el rol basado en la ruta
    const getRoleFromPath = (pathname) => {
        if (pathname.startsWith('/cliente')) return 'cliente';
        if (pathname.startsWith('/analista')) return 'analista';
        if (pathname.startsWith('/supervisor')) return 'supervisor';
        if (pathname.startsWith('/administrador')) return 'administrador';
        return 'cliente'; // Default fallback
    };

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

    // Si no está autenticado, redirigir al login con el rol correspondiente
    if (!store.auth.isAuthenticated) {
        const role = getRoleFromPath(location.pathname);
        return <Navigate to={`/auth?role=${role}`} replace />;
    }

    // SEGURIDAD: Verificar rol usando token, no estado local
    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
