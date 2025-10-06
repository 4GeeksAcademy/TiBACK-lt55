import React, { useState, useEffect } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

export function DashboardCalidad() {
    const { store } = useGlobalReducer();
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnalista, setSelectedAnalista] = useState(null);
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
                                    const ticketsSolucionados = tickets.filter(t => t.estado === 'solucionado' || t.estado === 'cerrado').length;
                                    const ticketsReabiertos = tickets.filter(t => t.estado === 'reabierto').length;
                                    const ticketsEscalados = tickets.filter(t => t.estado === 'escalado' || t.estado === 'en_espera').length;

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

                                    // Calcular eficiencia (tickets solucionados / tickets asignados)
                                    const eficiencia = ticketsAsignados > 0 ? (ticketsSolucionados / ticketsAsignados) * 100 : 0;

                                    // Calcular promedios por período
                                    const ahora = new Date();
                                    const haceUnDia = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
                                    const haceUnaSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    const haceUnMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

                                    const ticketsHoy = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnDia);
                                    const ticketsSemana = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnaSemana);
                                    const ticketsMes = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnMes);

                                    const solucionadosHoy = ticketsHoy.filter(t => t.estado === 'cerrado' || t.estado === 'solucionado').length;
                                    const solucionadosSemana = ticketsSemana.filter(t => t.estado === 'cerrado' || t.estado === 'solucionado').length;
                                    const solucionadosMes = ticketsMes.filter(t => t.estado === 'cerrado' || t.estado === 'solucionado').length;

                                    return {
                                        ...analista,
                                        metricas: {
                                            ticketsAsignados,
                                            ticketsSolucionados,
                                            ticketsReabiertos,
                                            ticketsEscalados,
                                            calificacionPromedio: Math.round(calificacionPromedio * 10) / 10,
                                            tiempoRespuestaPromedio: Math.round(tiempoRespuestaPromedio),
                                            eficiencia: Math.round(eficiencia * 10) / 10,
                                            solucionadosPorDia: solucionadosHoy,
                                            solucionadosPorSemana: solucionadosSemana,
                                            solucionadosPorMes: solucionadosMes,
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
                                            ticketsEscalados: 0,
                                            calificacionPromedio: 0,
                                            tiempoRespuestaPromedio: 0,
                                            eficiencia: 0,
                                            solucionadosPorDia: 0,
                                            solucionadosPorSemana: 0,
                                            solucionadosPorMes: 0,
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
                                        ticketsEscalados: 0,
                                        calificacionPromedio: 0,
                                        tiempoRespuestaPromedio: 0,
                                        eficiencia: 0,
                                        solucionadosPorDia: 0,
                                        solucionadosPorSemana: 0,
                                        solucionadosPorMes: 0,
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
        <div className="container-fluid py-4 px-4">
            {/* Header con Título y Selector */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="hyper-page-title">
                            <i className="fas fa-chart-line me-2"></i>
                            Dashboard de Calidad
                        </h1>
                        <div className="d-flex gap-3">
                            {/* Selector de Analista */}
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 fw-semibold">Analista:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ minWidth: '200px' }}
                                    value={selectedAnalista || ''}
                                    onChange={(e) => setSelectedAnalista(e.target.value ? parseInt(e.target.value) : null)}
                                >
                                    <option value="">Todos los analistas</option>
                                    {analistas.map((analista) => (
                                        <option key={analista.id} value={analista.id}>
                                            {analista.nombre} {analista.apellido}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => window.location.reload()}
                            >
                                <i className="fas fa-sync-alt me-1"></i>
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Métricas Principales */}
            <div className="row mb-4 g-3">

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Asignados</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-info me-2">
                                        {selectedAnalista
                                            ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsAsignados || 0
                                            : analistas.reduce((sum, a) => sum + a.metricas.ticketsAsignados, 0)
                                        }
                                    </h3>
                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-ticket-alt text-info"></i>
                                    </div>
                                </div>
                                <small className="text-muted">
                                    {selectedAnalista ? 'Del analista' : 'Total del equipo'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Solucionados</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-warning me-2">
                                        {selectedAnalista
                                            ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsSolucionados || 0
                                            : analistas.reduce((sum, a) => sum + a.metricas.ticketsSolucionados, 0)
                                        }
                                    </h3>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-tools text-warning"></i>
                                    </div>
                                </div>
                                <small className="text-muted">
                                    {selectedAnalista ? 'Del analista' : 'Total del equipo'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Tickets Escalados</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-warning me-2">
                                        {selectedAnalista
                                            ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsEscalados || 0
                                            : analistas.reduce((sum, a) => sum + a.metricas.ticketsEscalados, 0)
                                        }
                                    </h3>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-arrow-up text-warning"></i>
                                    </div>
                                </div>
                                <small className="text-muted">
                                    {selectedAnalista ? 'Del analista' : 'Total del equipo'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Calificación Promedio</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-warning me-2">
                                        {selectedAnalista
                                            ? analistas.find(a => a.id === selectedAnalista)?.metricas.calificacionPromedio || 0
                                            : analistas.length > 0
                                                ? (analistas.reduce((sum, a) => sum + a.metricas.calificacionPromedio, 0) / analistas.length).toFixed(1)
                                                : '0.0'
                                        }
                                    </h3>
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-star text-warning"></i>
                                    </div>
                                </div>
                                <small className="text-muted">
                                    {selectedAnalista ? 'Del analista' : 'Promedio del equipo'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <h6 className="card-title text-muted mb-2">Eficiencia</h6>
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <h3 className="mb-0 text-primary me-2">
                                        {selectedAnalista
                                            ? analistas.find(a => a.id === selectedAnalista)?.metricas.eficiencia || 0
                                            : analistas.length > 0
                                                ? (analistas.reduce((sum, a) => sum + a.metricas.eficiencia, 0) / analistas.length).toFixed(1)
                                                : '0.0'
                                        }%
                                    </h3>
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                        <i className="fas fa-tachometer-alt text-primary"></i>
                                    </div>
                                </div>
                                <small className="text-muted">
                                    {selectedAnalista ? 'Del analista' : 'Promedio del equipo'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Métricas Detalladas */}
            <div className="row mb-4 g-3">
                <div className="col-xl-9 col-lg-8">
                    <div className="hyper-widget card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0">
                                <i className="fas fa-chart-bar me-2"></i>
                                {selectedAnalista ? 'Métricas del Analista' : 'Rendimiento del Equipo'}
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center mb-4 g-3">
                                <div className="col-xl-3 col-lg-6 col-md-6">
                                    <div className="border-end pe-3">
                                        <h4 className="text-primary">
                                            {selectedAnalista
                                                ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsAsignados || 0
                                                : analistas.reduce((sum, a) => sum + a.metricas.ticketsAsignados, 0)
                                            }
                                        </h4>
                                        <small className="text-muted">Asignados</small>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-6 col-md-6">
                                    <div className="border-end pe-3">
                                        <h4 className="text-warning">
                                            {selectedAnalista
                                                ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsSolucionados || 0
                                                : analistas.reduce((sum, a) => sum + a.metricas.ticketsSolucionados, 0)
                                            }
                                        </h4>
                                        <small className="text-muted">Solucionados</small>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-6 col-md-6">
                                    <div className="border-end pe-3">
                                        <h4 className="text-warning">
                                            {selectedAnalista
                                                ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsEscalados || 0
                                                : analistas.reduce((sum, a) => sum + a.metricas.ticketsEscalados, 0)
                                            }
                                        </h4>
                                        <small className="text-muted">Escalados</small>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-6 col-md-6">
                                    <h4 className="text-danger">
                                        {selectedAnalista
                                            ? analistas.find(a => a.id === selectedAnalista)?.metricas.ticketsReabiertos || 0
                                            : analistas.reduce((sum, a) => sum + a.metricas.ticketsReabiertos, 0)
                                        }
                                    </h4>
                                    <small className="text-muted">Reabiertos</small>
                                </div>
                            </div>

                            {/* Gráfico de barras simple */}
                            <div className="mt-4">
                                <h6 className="text-muted mb-3">Tendencia Mensual</h6>
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
                                                    className="bg-success rounded-bottom"
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

                {/* Métricas de Eficiencia */}
                <div className="col-xl-3 col-lg-4">
                    <div className="hyper-widget card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0">
                                <i className="fas fa-tachometer-alt me-2"></i>
                                Eficiencia
                            </h5>
                        </div>
                        <div className="card-body">
                            {selectedAnalista ? (
                                (() => {
                                    const analista = analistas.find(a => a.id === selectedAnalista);
                                    if (!analista) return null;
                                    return (
                                        <div className="text-center">
                                            <div className="mb-3">
                                                <div className="display-4 text-primary fw-bold">
                                                    {analista.metricas.eficiencia}%
                                                </div>
                                                <div className="text-muted">Eficiencia General</div>
                                            </div>
                                            <div className="row text-center g-2">
                                                <div className="col-6">
                                                    <div className="fw-bold text-success">{analista.metricas.satisfaccion.toFixed(1)}%</div>
                                                    <div className="small text-muted">Satisfacción</div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="fw-bold text-info">{analista.metricas.tiempoRespuestaPromedio}h</div>
                                                    <div className="small text-muted">Tiempo Resp.</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="text-center">
                                    <div className="mb-3">
                                        <div className="display-4 text-primary fw-bold">
                                            {analistas.length > 0
                                                ? (analistas.reduce((sum, a) => sum + a.metricas.eficiencia, 0) / analistas.length).toFixed(1)
                                                : '0.0'
                                            }%
                                        </div>
                                        <div className="text-muted">Eficiencia Promedio</div>
                                    </div>
                                    <div className="row text-center g-2">
                                        <div className="col-6">
                                            <div className="fw-bold text-success">
                                                {analistas.length > 0
                                                    ? (analistas.reduce((sum, a) => sum + a.metricas.satisfaccion, 0) / analistas.length).toFixed(1)
                                                    : '0.0'
                                                }%
                                            </div>
                                            <div className="small text-muted">Satisfacción</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="fw-bold text-info">
                                                {analistas.length > 0
                                                    ? (analistas.reduce((sum, a) => sum + a.metricas.tiempoRespuestaPromedio, 0) / analistas.length).toFixed(1)
                                                    : '0.0'
                                                }h
                                            </div>
                                            <div className="small text-muted">Tiempo Resp.</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top 3 Analistas - Solo cuando no hay analista seleccionado */}
            {!selectedAnalista && (
                <div className="row mb-4 g-3">
                    <div className="col-xl-7 col-lg-6">
                        <div className="hyper-widget card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0">
                                    <i className="fas fa-trophy me-2"></i>
                                    Top 3 Analistas
                                </h5>
                            </div>
                            <div className="card-body">
                                {analistas
                                    .sort((a, b) => b.metricas.eficiencia - a.metricas.eficiencia)
                                    .slice(0, 3)
                                    .map((analista, index) => (
                                        <div key={analista.id} className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                                            <div className="d-flex align-items-center">
                                                <span className={`badge bg-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} me-3`}>
                                                    #{index + 1}
                                                </span>
                                                <div>
                                                    <h6 className="mb-0">{analista.nombre} {analista.apellido}</h6>
                                                    <small className="text-muted">{analista.email}</small>
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <span className="badge bg-success fs-6">{analista.metricas.eficiencia.toFixed(1)}%</span>
                                                <br />
                                                <small className="text-muted">{analista.metricas.ticketsEscalados} escalados</small>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-xl-5 col-lg-6">
                        <div className="hyper-widget card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0">
                                    <i className="fas fa-chart-pie me-2"></i>
                                    Distribución del Equipo
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row text-center g-3">
                                    <div className="col-4">
                                        <div className="border-end pe-3">
                                            <h4 className="text-primary">{analistas.reduce((sum, a) => sum + a.metricas.ticketsAsignados, 0)}</h4>
                                            <small className="text-muted">Asignados</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="border-end pe-3">
                                            <h4 className="text-success">{analistas.reduce((sum, a) => sum + a.metricas.ticketsSolucionados, 0)}</h4>
                                            <small className="text-muted">Solucionados</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <h4 className="text-warning">{analistas.reduce((sum, a) => sum + a.metricas.ticketsEscalados, 0)}</h4>
                                        <small className="text-muted">Escalados</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detalles del Analista Seleccionado */}
            {selectedAnalista && (
                <div className="row mb-4 g-3">
                    <div className="col-12">
                        <div className="hyper-widget card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0">
                                    <i className="fas fa-user-tie me-2"></i>
                                    Detalles del Analista
                                </h5>
                            </div>
                            <div className="card-body">
                                {(() => {
                                    const analista = analistas.find(a => a.id === selectedAnalista);
                                    if (!analista) return null;

                                    return (
                                        <div className="row g-3">
                                            <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                                <div className="text-center p-3 bg-light rounded">
                                                    <div className="fw-bold text-primary fs-4">{analista.metricas.ticketsAsignados}</div>
                                                    <div className="text-muted">Tickets Asignados</div>
                                                </div>
                                            </div>
                                            <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                                <div className="text-center p-3 bg-light rounded">
                                                    <div className="fw-bold text-warning fs-4">{analista.metricas.ticketsSolucionados}</div>
                                                    <div className="text-muted">Tickets Solucionados</div>
                                                </div>
                                            </div>
                                            <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                                <div className="text-center p-3 bg-light rounded">
                                                    <div className="fw-bold text-warning fs-4">{analista.metricas.ticketsEscalados}</div>
                                                    <div className="text-muted">Tickets Escalados</div>
                                                </div>
                                            </div>
                                            <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                                <div className="text-center p-3 bg-light rounded">
                                                    <div className="fw-bold text-danger fs-4">{analista.metricas.ticketsReabiertos}</div>
                                                    <div className="text-muted">Tickets Reabiertos</div>
                                                </div>
                                            </div>
                                            <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                                <div className="text-center p-3 bg-light rounded">
                                                    <div className="fw-bold text-info fs-4">{analista.metricas.calificacionPromedio}</div>
                                                    <div className="text-muted">Calificación Promedio</div>
                                                </div>
                                            </div>
                                            <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                                <div className="text-center p-3 bg-light rounded">
                                                    <div className="fw-bold text-primary fs-4">{analista.metricas.eficiencia}%</div>
                                                    <div className="text-muted">Eficiencia</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
