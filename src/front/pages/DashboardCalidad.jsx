import React, { useState, useEffect } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

export function DashboardCalidad() {
    const { store } = useGlobalReducer();
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('week'); // day, week, month

    // Cargar datos de analistas y métricas
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;

                // Cargar analistas
                const analistasResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (analistasResponse.ok) {
                    const analistasData = await analistasResponse.json();

                    // Para cada analista, cargar sus métricas
                    const analistasConMetricas = await Promise.all(
                        analistasData.map(async (analista) => {
                            try {
                                // Cargar tickets del analista
                                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista/${analista.id}`, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                });

                                if (ticketsResponse.ok) {
                                    const tickets = await ticketsResponse.json();
                                    console.log(`Tickets para analista ${analista.id}:`, tickets);

                                    // Calcular métricas
                                    const ticketsAsignados = tickets.length;
                                    const ticketsSolucionados = tickets.filter(t => t.estado === 'solucionado').length;
                                    const ticketsReabiertos = tickets.filter(t => t.estado === 'reabierto').length;
                                    const ticketsCerrados = tickets.filter(t => t.estado === 'cerrado').length;

                                    // Calcular calificación promedio
                                    const ticketsConCalificacion = tickets.filter(t => t.calificacion && t.calificacion > 0);
                                    const calificacionPromedio = ticketsConCalificacion.length > 0
                                        ? (ticketsConCalificacion.reduce((sum, t) => sum + t.calificacion, 0) / ticketsConCalificacion.length)
                                        : 0;

                                    // Calcular tiempos de respuesta promedio
                                    const ticketsConTiempo = tickets.filter(t => t.tiempo_respuesta);
                                    const tiempoRespuestaPromedio = ticketsConTiempo.length > 0
                                        ? (ticketsConTiempo.reduce((sum, t) => sum + t.tiempo_respuesta, 0) / ticketsConTiempo.length)
                                        : 0;

                                    // Calcular eficiencia (tickets cerrados / tickets asignados)
                                    const eficiencia = ticketsAsignados > 0 ? (ticketsCerrados / ticketsAsignados) * 100 : 0;

                                    // Calcular promedios por período
                                    const ahora = new Date();
                                    const haceUnDia = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
                                    const haceUnaSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    const haceUnMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

                                    const ticketsHoy = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnDia);
                                    const ticketsSemana = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnaSemana);
                                    const ticketsMes = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnMes);

                                    const cerradosHoy = ticketsHoy.filter(t => t.estado === 'cerrado').length;
                                    const cerradosSemana = ticketsSemana.filter(t => t.estado === 'cerrado').length;
                                    const cerradosMes = ticketsMes.filter(t => t.estado === 'cerrado').length;

                                    return {
                                        ...analista,
                                        metricas: {
                                            ticketsAsignados,
                                            ticketsSolucionados,
                                            ticketsReabiertos,
                                            ticketsCerrados,
                                            calificacionPromedio: Math.round(calificacionPromedio * 10) / 10,
                                            tiempoRespuestaPromedio: Math.round(tiempoRespuestaPromedio),
                                            eficiencia: Math.round(eficiencia * 10) / 10,
                                            cerradosPorDia: cerradosHoy,
                                            cerradosPorSemana: cerradosSemana,
                                            cerradosPorMes: cerradosMes,
                                            satisfaccion: ticketsConCalificacion.length > 0
                                                ? (ticketsConCalificacion.filter(t => t.calificacion >= 4).length / ticketsConCalificacion.length) * 100
                                                : 0
                                        }
                                    };
                                } else {
                                    console.error(`Error al cargar tickets para analista ${analista.id}:`, ticketsResponse.status, ticketsResponse.statusText);
                                    const errorText = await ticketsResponse.text();
                                    console.error('Error del servidor:', errorText);
                                    return {
                                        ...analista,
                                        metricas: {
                                            ticketsAsignados: 0,
                                            ticketsSolucionados: 0,
                                            ticketsReabiertos: 0,
                                            ticketsCerrados: 0,
                                            calificacionPromedio: 0,
                                            tiempoRespuestaPromedio: 0,
                                            eficiencia: 0,
                                            cerradosPorDia: 0,
                                            cerradosPorSemana: 0,
                                            cerradosPorMes: 0,
                                            satisfaccion: 0
                                        }
                                    };
                                }
                            } catch (err) {
                                console.error(`Error cargando métricas para analista ${analista.id}:`, err);
                                return {
                                    ...analista,
                                    metricas: {
                                        ticketsAsignados: 0,
                                        ticketsSolucionados: 0,
                                        ticketsReabiertos: 0,
                                        ticketsCerrados: 0,
                                        calificacionPromedio: 0,
                                        tiempoRespuestaPromedio: 0,
                                        eficiencia: 0,
                                        cerradosPorDia: 0,
                                        cerradosPorSemana: 0,
                                        cerradosPorMes: 0,
                                        satisfaccion: 0
                                    }
                                };
                            }
                        })
                    );

                    setAnalistas(analistasConMetricas);
                } else {
                    setError('Error al cargar los analistas');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token) {
            cargarDatos();
        }
    }, [store.auth.token]);

    // Función para obtener el color de la calificación
    const getCalificacionColor = (calificacion) => {
        if (calificacion >= 4.5) return 'success';
        if (calificacion >= 3.5) return 'warning';
        return 'danger';
    };

    // Función para obtener el color de la eficiencia
    const getEficienciaColor = (eficiencia) => {
        if (eficiencia >= 80) return 'success';
        if (eficiencia >= 60) return 'warning';
        return 'danger';
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando dashboard...</span>
                    </div>
                    <p className="mt-3 text-muted">Cargando métricas de rendimiento...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar el dashboard: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header Welcome Card */}
            <div className="row mb-4">
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h4 className="mb-1">¡Bienvenido de vuelta!</h4>
                                    <h5 className="mb-0">Dashboard de Calidad</h5>
                                    <p className="mb-0 opacity-75">Rendimiento y métricas de analistas</p>
                                </div>
                                <div className="ms-3">
                                    <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-chart-line fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-8">
                    <div className="row">
                        {/* Total Analistas */}
                        <div className="col-md-4 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="card-title text-muted mb-1">Total Analistas</h6>
                                            <h3 className="mb-0 text-primary">{analistas.length}</h3>
                                            <small className="text-success">
                                                <i className="fas fa-arrow-up me-1"></i>
                                                +2.5% Desde la semana pasada
                                            </small>
                                        </div>
                                        <div className="ms-3">
                                            <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                                <i className="fas fa-users text-primary fa-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tickets Cerrados */}
                        <div className="col-md-4 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="card-title text-muted mb-1">Tickets Cerrados</h6>
                                            <h3 className="mb-0 text-success">
                                                {analistas.reduce((sum, a) => sum + a.metricas.ticketsCerrados, 0)}
                                            </h3>
                                            <small className="text-danger">
                                                <i className="fas fa-arrow-down me-1"></i>
                                                -1.2% Desde la semana pasada
                                            </small>
                                        </div>
                                        <div className="ms-3">
                                            <div className="bg-success bg-opacity-10 rounded-circle p-3">
                                                <i className="fas fa-check-circle text-success fa-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calificación Promedio */}
                        <div className="col-md-4 mb-3">
                            <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#e3f2fd' }}>
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h6 className="card-title text-muted mb-1">Calificación Promedio</h6>
                                            <h3 className="mb-0 text-info">
                                                {analistas.length > 0
                                                    ? (analistas.reduce((sum, a) => sum + a.metricas.calificacionPromedio, 0) / analistas.length).toFixed(1)
                                                    : '0.0'
                                                }
                                            </h3>
                                            <small className="text-success">
                                                <i className="fas fa-arrow-up me-1"></i>
                                                +0.8% Desde la semana pasada
                                            </small>
                                        </div>
                                        <div className="ms-3">
                                            <div className="bg-info bg-opacity-10 rounded-circle p-3">
                                                <i className="fas fa-star text-info fa-lg"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfico de Barras y Feed de Actividades */}
            <div className="row">
                {/* Gráfico de Rendimiento */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0">Rendimiento / Eficiencia</h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center mb-3">
                                <div className="col-4">
                                    <div className="border-end">
                                        <h4 className="text-primary">{analistas.reduce((sum, a) => sum + a.metricas.ticketsAsignados, 0)}</h4>
                                        <small className="text-muted">Asignados</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="border-end">
                                        <h4 className="text-success">{analistas.reduce((sum, a) => sum + a.metricas.ticketsSolucionados, 0)}</h4>
                                        <small className="text-muted">Solucionados</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <h4 className="text-info">{analistas.reduce((sum, a) => sum + a.metricas.ticketsCerrados, 0)}</h4>
                                    <small className="text-muted">Cerrados</small>
                                </div>
                            </div>

                            {/* Gráfico de barras simple */}
                            <div className="mt-4">
                                <div className="d-flex align-items-end justify-content-between" style={{ height: '200px' }}>
                                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((mes, index) => {
                                        const altura = Math.random() * 100 + 20;
                                        return (
                                            <div key={mes} className="d-flex flex-column align-items-center" style={{ width: '8%' }}>
                                                <div
                                                    className="bg-primary rounded-top"
                                                    style={{
                                                        height: `${altura}px`,
                                                        width: '100%',
                                                        minHeight: '20px'
                                                    }}
                                                ></div>
                                                <div
                                                    className="bg-info rounded-bottom"
                                                    style={{
                                                        height: `${altura * 0.6}px`,
                                                        width: '100%',
                                                        minHeight: '10px'
                                                    }}
                                                ></div>
                                                <small className="text-muted mt-2">{mes}</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed de Actividades */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Actividad Reciente</h5>
                            <span className="badge bg-primary rounded-pill">Hoy</span>
                        </div>
                        <div className="card-body">
                            {/* Actividad 1 */}
                            <div className="d-flex align-items-start mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-user text-primary"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <p className="mb-1">
                                        <strong>Ana García</strong> comenzó a seguir a <strong>Carlos López</strong>
                                    </p>
                                    <small className="text-muted">Hace 5m • Hoy 7:51 pm</small>
                                </div>
                            </div>

                            {/* Actividad 2 */}
                            <div className="d-flex align-items-start mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-ticket-alt text-success"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <p className="mb-1">
                                        <strong>María Rodríguez</strong> publicó algo en la línea de tiempo de <strong>Luis Pérez</strong>
                                    </p>
                                    <div className="bg-light p-2 rounded mt-2">
                                        <small className="text-muted">
                                            "El ticket #1234 ha sido solucionado exitosamente. El cliente está satisfecho con la resolución..."
                                        </small>
                                    </div>
                                    <small className="text-muted">Hace 30m • Hoy 7:21 pm</small>
                                </div>
                            </div>

                            {/* Actividad 3 */}
                            <div className="d-flex align-items-start mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-chart-line text-info"></i>
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <p className="mb-1">
                                        <strong>Pedro Martínez</strong> publicó un nuevo reporte
                                    </p>
                                    <small className="text-muted">Hace 1h • Hoy 6:35 pm</small>
                                </div>
                            </div>

                            <div className="text-center mt-3">
                                <button className="btn btn-primary btn-sm">Cargar más</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top 3 Analistas */}
            <div className="row mt-4">
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0">
                                <i className="fas fa-trophy me-2"></i>
                                Top 3 Analistas
                            </h6>
                        </div>
                        <div className="card-body">
                            {analistas
                                .sort((a, b) => b.metricas.eficiencia - a.metricas.eficiencia)
                                .slice(0, 3)
                                .map((analista, index) => (
                                    <div key={analista.id} className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="d-flex align-items-center">
                                            <span className={`badge bg-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} me-3`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <h6 className="mb-0">{analista.nombre} {analista.apellido}</h6>
                                                <small className="text-muted">{analista.email}</small>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <span className="badge bg-success">{analista.metricas.eficiencia.toFixed(1)}%</span>
                                            <br />
                                            <small className="text-muted">{analista.metricas.ticketsCerrados} cerrados</small>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0">
                                <i className="fas fa-chart-pie me-2"></i>
                                Distribución de Tickets
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-4">
                                    <div className="border-end">
                                        <h4 className="text-primary">{analistas.reduce((sum, a) => sum + a.metricas.ticketsAsignados, 0)}</h4>
                                        <small className="text-muted">Asignados</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="border-end">
                                        <h4 className="text-success">{analistas.reduce((sum, a) => sum + a.metricas.ticketsSolucionados, 0)}</h4>
                                        <small className="text-muted">Solucionados</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <h4 className="text-info">{analistas.reduce((sum, a) => sum + a.metricas.ticketsCerrados, 0)}</h4>
                                    <small className="text-muted">Cerrados</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
