import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute({ children, allowedRoles = [] }) {
    const { isAuthenticated, role, hasRole, isLoading, refresh, isTokenExpiringSoon } = useAuth();
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
                try {
                    // Verificar que sea un JWT válido
                    const parts = token.split('.');
                    if (parts.length !== 3) {
                        console.error('Token JWT inválido:', token);
                        navigate('/auth');
                        return;
                    }

                    // Decodificar payload para verificar estructura
                    const payload = JSON.parse(atob(parts[1]));
                    if (!payload.user_id || !payload.role) {
                        console.error('Token JWT malformado:', payload);
                        navigate('/auth');
                        return;
                    }

                    // Verificar si el token está próximo a expirar y refrescarlo
                    if (isTokenExpiringSoon()) {
                        const refreshed = await refresh();
                        if (!refreshed) {
                            navigate('/auth');
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error verificando token JWT:', error);
                    navigate('/auth');
                    return;
                }
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
