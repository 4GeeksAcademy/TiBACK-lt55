import React from 'react';
import { Navigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

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

    // Si tiene roles específicos y el usuario no tiene el rol correcto
    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
