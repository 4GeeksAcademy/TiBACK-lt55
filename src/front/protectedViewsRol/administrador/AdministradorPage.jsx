import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import HeatmapComponent from '../../components/HeatmapComponent';

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
    getUserId: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.user_id : null;
    },
    getRole: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.role : null;
    }
};

export function AdministradorPage() {
    const navigate = useNavigate();
    const { store, logout, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const [stats, setStats] = useState({
        totalTickets: 0,
        ticketsCreados: 0,
        ticketsEnProceso: 0,
        ticketsSolucionados: 0,
        ticketsCerrados: 0,
        totalClientes: 0,
        totalAnalistas: 0,
        totalSupervisores: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMapaDistribucion, setShowMapaDistribucion] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Conectar WebSocket cuando el usuario esté autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = tokenUtils.getRole(store.auth.token);
                joinRoom(socket, role, userId);
            }
        }

        // Cleanup al desmontar
        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Actualizar estadísticas cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];

            // Actualización inmediata para eventos específicos (sin esperar)
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado') {
                // Los datos ya están en el store por el WebSocket - actualización instantánea
            }

            // Sincronización con servidor en segundo plano para TODOS los eventos
            cargarEstadisticas();
        }
    }, [store.websocket.notifications]);

    // Función para cargar estadísticas
    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            const token = store.auth.token;

            // Cargar tickets
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            console.log('Backend URL en AdministradorPage:', backendUrl);

            const ticketsResponse = await fetch(`${backendUrl}/api/tickets`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (ticketsResponse.ok) {
                const tickets = await ticketsResponse.json();
                const ticketsCreados = tickets.filter(t => t.estado && t.estado.toLowerCase() === 'creado').length;
                const ticketsEnProceso = tickets.filter(t => t.estado && t.estado.toLowerCase() === 'en_proceso').length;
                const ticketsSolucionados = tickets.filter(t => t.estado && t.estado.toLowerCase() === 'solucionado').length;
                const ticketsCerrados = tickets.filter(t => t.estado && t.estado.toLowerCase() === 'cerrado').length;

                setStats(prev => ({
                    ...prev,
                    totalTickets: tickets.length,
                    ticketsCreados,
                    ticketsEnProceso,
                    ticketsSolucionados,
                    ticketsCerrados
                }));
            } else {
                console.error('Error cargando tickets:', ticketsResponse.status, ticketsResponse.statusText);
                // No lanzar error, solo continuar con valores por defecto
            }

            // Cargar clientes
            try {
                const clientesResponse = await fetch(`${backendUrl}/api/clientes`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (clientesResponse.ok) {
                    const clientes = await clientesResponse.json();
                    setStats(prev => ({ ...prev, totalClientes: clientes.length }));
                } else {
                    console.error('Error cargando clientes:', clientesResponse.status);
                }
            } catch (err) {
                console.error('Error en fetch clientes:', err);
            }

            // Cargar analistas
            try {
                const analistasResponse = await fetch(`${backendUrl}/api/analistas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (analistasResponse.ok) {
                    const analistas = await analistasResponse.json();
                    setStats(prev => ({ ...prev, totalAnalistas: analistas.length }));
                } else {
                    console.error('Error cargando analistas:', analistasResponse.status);
                }
            } catch (err) {
                console.error('Error en fetch analistas:', err);
            }

            // Cargar supervisores
            try {
                const supervisoresResponse = await fetch(`${backendUrl}/api/supervisores`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (supervisoresResponse.ok) {
                    const supervisores = await supervisoresResponse.json();
                    setStats(prev => ({ ...prev, totalSupervisores: supervisores.length }));
                } else {
                    console.error('Error cargando supervisores:', supervisoresResponse.status);
                }
            } catch (err) {
                console.error('Error en fetch supervisores:', err);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generarRecomendacion = (ticket) => {
        // Redirigir a la vista de recomendación IA
        navigate(`/ticket/${ticket.id}/recomendacion-ia`);
    };


    // Cargar estadísticas del sistema
    useEffect(() => {
        cargarEstadisticas();
    }, [store.auth.token]);

    // Manejar modo oscuro
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [darkMode]);

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            console.log('🔄 Sincronización total recibida en AdministradorPage:', event.detail);
            if (event.detail.role === 'administrador' || event.detail.source === 'footer_sync') {
                // Recargar todas las estadísticas
                cargarEstadisticas();
                console.log('✅ Estadísticas del administrador actualizadas por sincronización total');
            }
        };

        const handleSyncCompleted = (event) => {
            console.log('✅ Sincronización total completada:', event.detail);
            // Opcional: mostrar notificación de éxito
        };

        const handleSyncError = (event) => {
            console.error('❌ Error en sincronización total:', event.detail);
            // Opcional: mostrar notificación de error
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_estadisticas', handleTotalSync);
        window.addEventListener('refresh_dashboard', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_estadisticas', handleTotalSync);
            window.removeEventListener('refresh_dashboard', handleTotalSync);
        };
    }, []);

    return (
        <div className="container py-4">
            {/* Header con información del administrador */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Panel de Administración</h2>
                                <p className="text-muted mb-0">Bienvenido, {store.auth.user?.email}</p>
                                <div className="mt-2">
                                    <span className="badge badge-ct-success">
                                        <i className="fas fa-wifi me-1"></i>
                                        Conectado
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                                <Link to="/administradores" className="btn btn-ct-primary">
                                    Ir al CRUD
                                </Link>

                                {/* Switch de Modo Oscuro */}
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="darkModeSwitch"
                                        checked={darkMode}
                                        onChange={(e) => setDarkMode(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="darkModeSwitch">
                                        <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'} me-1`}></i>
                                        {darkMode ? 'Oscuro' : 'Claro'}
                                    </label>
                                </div>

                                <Link to="/tickets" className="btn btn-ct-secondary">
                                    <i className="fas fa-ticket-alt me-2"></i>Tickets
                                </Link>
                                <button
                                    className="btn btn-ct-danger-outline"
                                    onClick={logout}
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Estadísticas del sistema */}
            <div className="row mb-4">
                <div className="col-12">
                    <h4 className="mb-3">Estadísticas del Sistema</h4>
                </div>

                {loading ? (
                    <div className="col-12 text-center py-4">
                        <div className="spinner-border spinner-ct-primary" role="status">
                            <span className="visually-hidden">Cargando estadísticas...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Estadísticas de Tickets */}
                        <div className="col-md-6 col-lg-3 mb-3">
                            <div className="card text-white card-ct-primary">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">Total Tickets</h5>
                                            <h2 className="mb-0">{stats.totalTickets}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-ticket-alt fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-3 mb-3">
                            <div className="card text-white card-ct-secondary">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">Creados</h5>
                                            <h2 className="mb-0">{stats.ticketsCreados}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-plus-circle fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-3 mb-3">
                            <div className="card text-white card-ct-warning">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">En Proceso</h5>
                                            <h2 className="mb-0">{stats.ticketsEnProceso}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-cog fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 col-lg-3 mb-3">
                            <div className="card text-white card-ct-success">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">Solucionados</h5>
                                            <h2 className="mb-0">{stats.ticketsSolucionados}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-check-circle fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas de Usuarios */}
                        <div className="col-md-4 mb-3">
                            <div className="card text-white card-ct-info">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">Clientes</h5>
                                            <h2 className="mb-0">{stats.totalClientes}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-users fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-3">
                            <div className="card text-white card-ct-dark">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">Analistas</h5>
                                            <h2 className="mb-0">{stats.totalAnalistas}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-user-tie fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-3">
                            <div className="card text-white card-ct-danger">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="card-title">Supervisores</h5>
                                            <h2 className="mb-0">{stats.totalSupervisores}</h2>
                                        </div>
                                        <div className="align-self-center">
                                            <i className="fas fa-user-shield fa-2x"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Enlaces de gestión */}
            <div className="row">
                <div className="col-12">
                    <h4 className="mb-3">Gestión del Sistema</h4>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/clientes" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-users fa-3x mb-3 icon-ct-primary"></i>
                            <h5 className="card-title">Gestionar Clientes</h5>
                            <p className="card-text text-muted">Administrar cuentas de clientes</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/analistas" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-user-tie fa-3x mb-3 icon-ct-success"></i>
                            <h5 className="card-title">Gestionar Analistas</h5>
                            <p className="card-text text-muted">Administrar cuentas de analistas</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/supervisores" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-user-shield fa-3x mb-3 icon-ct-warning"></i>
                            <h5 className="card-title">Gestionar Supervisores</h5>
                            <p className="card-text text-muted">Administrar cuentas de supervisores</p>
                        </div>
                    </Link>
                </div>


                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/tickets" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-ticket-alt fa-3x mb-3 icon-ct-info"></i>
                            <h5 className="card-title">Gestionar Tickets</h5>
                            <p className="card-text text-muted">Ver y administrar todos los tickets</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/comentarios" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-comments fa-3x mb-3 icon-ct-dark"></i>
                            <h5 className="card-title">Gestionar Comentarios</h5>
                            <p className="card-text text-muted">Ver y administrar comentarios</p>
                        </div>
                    </Link>
                </div>

                {/* Mapa de Calor */}
                <div className="col-md-6 col-lg-3 mb-3">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-map-marked-alt fa-3x mb-3 icon-ct-success"></i>
                            <h5 className="card-title">Mapa de Calor</h5>
                            <p className="card-text text-muted">Visualizar tickets por ubicación del cliente</p>
                            <button
                                className="btn btn-sm btn-ct-success-outline"
                                onClick={() => setShowMapaDistribucion(!showMapaDistribucion)}
                            >
                                {showMapaDistribucion ? 'Ocultar Mapa' : 'Ver Mapa'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mapa de Calor Expandible */}
            {showMapaDistribucion && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="fas fa-map-marked-alt me-2"></i>
                                    Mapa de Calor - Tickets por Ubicación del Cliente
                                </h5>
                            </div>
                            <div className="card-body">
                                <HeatmapComponent />
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AdministradorPage;
