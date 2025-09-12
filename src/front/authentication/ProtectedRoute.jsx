import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute({ children, allowedRoles = [] }) {
    const { isAuthenticated, role, hasRole, isLoading, refresh } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            // Si está cargando, esperar
            if (isLoading) return;

            // Si no está autenticado, redirigir al login
            if (!isAuthenticated) {
                navigate('/auth');
                return;
            }

            // Si hay roles específicos requeridos, verificar
            if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
                // Si no tiene el rol correcto, redirigir según su rol actual
                switch (role) {
                    case 'cliente':
                        navigate('/cliente');
                        break;
                    case 'analista':
                        navigate('/analistas');
                        break;
                    case 'supervisor':
                        navigate('/supervisores');
                        break;
                    case 'administrador':
                        navigate('/administradores');
                        break;
                    default:
                        navigate('/');
                }
                return;
            }

             // Verificar si el token existe y es válido
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Verificar que el token tenga el formato correcto
                if (!token.startsWith('cliente_')) {
                    console.error('Token inválido:', token);
                    navigate('/auth');
                    return;
                }

                // Para tokens simples, no necesitamos verificar expiración
                // En producción con JWT real, aquí se verificaría la expiración
            } else {
                navigate('/auth');
                return;
            }
        };

        checkAuth();
    }, [isAuthenticated, role, hasRole, isLoading, allowedRoles, navigate, refresh]);

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    // Si no está autenticado o no tiene el rol correcto, no mostrar contenido
    if (!isAuthenticated || (allowedRoles.length > 0 && !hasRole(allowedRoles))) {
        return null;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
