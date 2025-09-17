import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';

export function AdministradorPage() {
    const { store, logoutadmin } = useGlobalReducer();
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

    useEffect(() => {
        const cargarEstadisticas = async () => {
            try {
                setLoading(true);
                const token = store.authadmin.token;

                // Cargar tickets
                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (ticketsResponse.ok) {
                    const tickets = await ticketsResponse.json();
                    setStats(prev => ({
                        ...prev,
                        totalTickets: tickets.length,
                        ticketsCreados: tickets.filter(t => t.estado.toLowerCase() === 'creado').length,
                        ticketsEnProceso: tickets.filter(t => t.estado.toLowerCase() === 'en_proceso').length,
                        ticketsSolucionados: tickets.filter(t => t.estado.toLowerCase() === 'solucionado').length,
                        ticketsCerrados: tickets.filter(t => t.estado.toLowerCase() === 'cerrado').length
                    }));
                }

                // Cargar clientes
                const clientesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (clientesResponse.ok) {
                    const clientes = await clientesResponse.json();
                    setStats(prev => ({ ...prev, totalClientes: clientes.length }));
                }

                // Cargar analistas
                const analistasResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (analistasResponse.ok) {
                    const analistas = await analistasResponse.json();
                    setStats(prev => ({ ...prev, totalAnalistas: analistas.length }));
                }

                // Cargar supervisores
                const supervisoresResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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

        cargarEstadisticas();
    }, [store.authadmin.token]);

    return (
        <div className="container py-4">
            {/* Header con información del administrador */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Panel de Administración</h2>
                                <p className="text-muted mb-0">Bienvenido, {store.authadmin.user?.email}</p>
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
                                    onClick={() => logoutadmin()}
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

            {/* Estadísticas y gestión del sistema */}
            {/* ...el resto del JSX se mantiene igual, solo reemplaza store.auth → store.authadmin */}
        </div>
    );
}

export default AdministradorPage;