import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import SemaforoTickets from '../../components/SemaforoTickets'

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
            console.log('🔔 ADMINISTRADOR - Notificación recibida:', lastNotification);

            // Actualización inmediata para eventos específicos (sin esperar)
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado') {
                console.log('⚡ ADMINISTRADOR - Actualización inmediata por notificación:', lastNotification.tipo);
                // Los datos ya están en el store por el WebSocket - actualización instantánea
            }

            // Sincronización con servidor en segundo plano para TODOS los eventos
            console.log('🔄 ADMINISTRADOR - Sincronizando estadísticas con servidor en segundo plano:', lastNotification.tipo);
            cargarEstadisticas();
        }
    }, [store.websocket.notifications]);

    // Función para cargar estadísticas
    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            const token = store.auth.token;

            // Cargar tickets
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (ticketsResponse.ok) {
                const tickets = await ticketsResponse.json();
                const ticketsCreados = tickets.filter(t => t.estado.toLowerCase() === 'creado').length;
                const ticketsEnProceso = tickets.filter(t => t.estado.toLowerCase() === 'en_proceso').length;
                const ticketsSolucionados = tickets.filter(t => t.estado.toLowerCase() === 'solucionado').length;
                const ticketsCerrados = tickets.filter(t => t.estado.toLowerCase() === 'cerrado').length;

                setStats(prev => ({
                    ...prev,
                    totalTickets: tickets.length,
                    ticketsCreados,
                    ticketsEnProceso,
                    ticketsSolucionados,
                    ticketsCerrados
                }));
            }

            // Cargar clientes
            const clientesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (clientesResponse.ok) {
                const clientes = await clientesResponse.json();
                setStats(prev => ({ ...prev, totalClientes: clientes.length }));
            }

            // Cargar analistas
            const analistasResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (analistasResponse.ok) {
                const analistas = await analistasResponse.json();
                setStats(prev => ({ ...prev, totalAnalistas: analistas.length }));
            }

            // Cargar supervisores
            const supervisoresResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (supervisoresResponse.ok) {
                const supervisores = await supervisoresResponse.json();
                setStats(prev => ({ ...prev, totalSupervisores: supervisores.length }));
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
                                    <span className="badge bg-success">
                                        <i className="fas fa-wifi me-1"></i>
                                        Conectado
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/administradores" className="btn btn-primary">
                                    Ir al CRUD
                                </Link>
                                <Link to="/tickets" className="btn btn-secondary">
                                    <i className="fas fa-ticket-alt me-2"></i>Tickets
                                </Link>
                                <button
                                    className="btn btn-outline-danger"
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
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando estadísticas...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Estadísticas de Tickets */}
                        <div className="col-md-6 col-lg-3 mb-3">
                            <div className="card bg-primary text-white">
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
                            <div className="card bg-secondary text-white">
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
                            <div className="card bg-warning text-white">
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
                            <div className="card bg-success text-white">
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
                            <div className="card bg-info text-white">
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
                            <div className="card bg-dark text-white">
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
                            <div className="card bg-danger text-white">
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
                            <i className="fas fa-users fa-3x text-primary mb-3"></i>
                            <h5 className="card-title">Gestionar Clientes</h5>
                            <p className="card-text text-muted">Administrar cuentas de clientes</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/analistas" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-user-tie fa-3x text-success mb-3"></i>
                            <h5 className="card-title">Gestionar Analistas</h5>
                            <p className="card-text text-muted">Administrar cuentas de analistas</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/supervisores" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-user-shield fa-3x text-warning mb-3"></i>
                            <h5 className="card-title">Gestionar Supervisores</h5>
                            <p className="card-text text-muted">Administrar cuentas de supervisores</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/administradores" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-crown fa-3x text-danger mb-3"></i>
                            <h5 className="card-title">Gestionar Administradores</h5>
                            <p className="card-text text-muted">Administrar cuentas de administradores</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/tickets" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-ticket-alt fa-3x text-info mb-3"></i>
                            <h5 className="card-title">Gestionar Tickets</h5>
                            <p className="card-text text-muted">Ver y administrar todos los tickets</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/asignaciones" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-tasks fa-3x text-secondary mb-3"></i>
                            <h5 className="card-title">Gestionar Asignaciones</h5>
                            <p className="card-text text-muted">Administrar asignaciones de tickets</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/comentarios" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-comments fa-3x text-dark mb-3"></i>
                            <h5 className="card-title">Gestionar Comentarios</h5>
                            <p className="card-text text-muted">Ver y administrar comentarios</p>
                        </div>
                    </Link>
                </div>

                <div className="col-md-6 col-lg-3 mb-3">
                    <Link to="/gestiones" className="card text-decoration-none h-100">
                        <div className="card-body text-center">
                            <i className="fas fa-clipboard-list fa-3x text-primary mb-3"></i>
                            <h5 className="card-title">Gestionar Gestiones</h5>
                            <p className="card-text text-muted">Ver historial de gestiones</p>
                        </div>
                    </Link>
                </div>
            </div>

            <RecomendacionModal
                isOpen={showRecomendacionModal}
                onClose={cerrarModalRecomendacion}
                recomendacion={recomendacion}
                loading={loadingRecomendacion}
                error={errorRecomendacion}
            />

            <SemaforoTickets />

        </div>

    );
}

export default AdministradorPage;
