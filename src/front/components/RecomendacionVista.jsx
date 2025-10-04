import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { SideBarCentral } from './SideBarCentral';

export function RecomendacionVista() {
    const navigate = useNavigate();
    const { ticketId } = useParams();
    const { store } = useGlobalReducer();

    const [recomendacion, setRecomendacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('recomendacion');

    // Cargar recomendación al montar el componente
    useEffect(() => {
        cargarRecomendacion();
    }, [ticketId]);

    const cargarRecomendacion = async () => {
        try {
            setLoading(true);
            setError('');

            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/recomendacion-ia`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setRecomendacion(data.recomendacion);
        } catch (err) {
            setError(`Error al cargar recomendación: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async () => {
        if (!recomendacion) return;

        try {
            setGuardando(true);

            // Crear el texto de la recomendación para guardar como comentario
            const textoRecomendacion = `
🤖 RECOMENDACIÓN DE IA GENERADA

📋 DIAGNÓSTICO:
${recomendacion.diagnostico}

📝 PASOS DE SOLUCIÓN:
${recomendacion.pasos_solucion?.map((paso, index) => `${index + 1}. ${paso}`).join('\n')}

⏱️ TIEMPO ESTIMADO: ${recomendacion.tiempo_estimado}
📊 NIVEL DE DIFICULTAD: ${recomendacion.nivel_dificultad}

🔧 RECURSOS NECESARIOS:
${recomendacion.recursos_necesarios?.map(recurso => `• ${recurso}`).join('\n')}

💡 RECOMENDACIONES ADICIONALES:
${recomendacion.recomendaciones_adicionales || 'N/A'}
            `.trim();

            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: parseInt(ticketId),
                    texto: textoRecomendacion
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar recomendación');
            }

            alert('Recomendación guardada exitosamente como comentario');
            navigate(`/ticket/${ticketId}/comentarios`);
        } catch (err) {
            setError(`Error al guardar recomendación: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const getNivelDificultadColor = (nivel) => {
        switch (nivel?.toLowerCase()) {
            case 'baja': return 'badge bg-success';
            case 'media': return 'badge bg-warning';
            case 'alta': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    // Función para alternar sidebar
    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };

    // Función para cambiar vista
    const changeView = (view) => {
        setActiveView(view);
        if (view === 'dashboard') {
            navigate('/cliente');
        } else if (view === 'tickets') {
            navigate('/cliente');
        } else if (view === 'create') {
            navigate('/cliente');
        }
    };


    return (
        <div className="hyper-layout d-flex">
            {/* Sidebar izquierdo */}
            <SideBarCentral
                sidebarHidden={sidebarHidden}
                activeView={activeView}
                changeView={changeView}
            />

            {/* Contenido principal */}
            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                {/* Header superior */}
                <header className="hyper-header bg-white border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="hyper-sidebar-toggle btn btn-link p-2"
                                onClick={toggleSidebar}
                                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                            >
                                <i className={`fas ${sidebarHidden ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                            </button>
                            <div>
                                <h1 className="mb-0 fw-semibold">
                                    <i className="fas fa-robot me-2"></i>
                                    Recomendación de IA - Ticket #{ticketId}
                                </h1>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Volver
                            </button>
                        </div>
                    </div>
                </header>

                {/* Contenido del dashboard */}
                <div className="p-4">

                    {loading && (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Generando recomendación...</span>
                                </div>
                                <h5 className="text-muted">Generando recomendación con IA...</h5>
                                <p className="text-muted">Esto puede tomar unos momentos</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {recomendacion && !loading && !error && (
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-robot me-2"></i>
                                    Recomendación Generada
                                </h5>
                            </div>
                            <div className="card-body">
                                {/* Diagnóstico */}
                                <div className="mb-4">
                                    <h6 className="text-primary">
                                        <i className="fas fa-search me-2"></i>
                                        Diagnóstico
                                    </h6>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <p className="mb-0">{recomendacion.diagnostico}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pasos de Solución */}
                                <div className="mb-4">
                                    <h6 className="text-primary">
                                        <i className="fas fa-list-ol me-2"></i>
                                        Pasos de Solución
                                    </h6>
                                    <div className="card">
                                        <div className="card-body">
                                            <ol className="list-group list-group-numbered">
                                                {recomendacion.pasos_solucion?.map((paso, index) => (
                                                    <li key={index} className="list-group-item border-0 px-0">
                                                        {paso}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                {/* Información Adicional */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-body text-center">
                                                <h6 className="text-primary">
                                                    <i className="fas fa-clock me-2"></i>
                                                    Tiempo Estimado
                                                </h6>
                                                <h4 className="text-muted">{recomendacion.tiempo_estimado}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-body text-center">
                                                <h6 className="text-primary">
                                                    <i className="fas fa-signal me-2"></i>
                                                    Nivel de Dificultad
                                                </h6>
                                                <span className={`${getNivelDificultadColor(recomendacion.nivel_dificultad)} fs-6`}>
                                                    {recomendacion.nivel_dificultad}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recursos Necesarios */}
                                <div className="mb-4">
                                    <h6 className="text-primary">
                                        <i className="fas fa-tools me-2"></i>
                                        Recursos Necesarios
                                    </h6>
                                    <div className="card">
                                        <div className="card-body">
                                            <ul className="list-group list-group-flush">
                                                {recomendacion.recursos_necesarios?.map((recurso, index) => (
                                                    <li key={index} className="list-group-item d-flex align-items-center border-0 px-0">
                                                        <i className="fas fa-check-circle text-success me-3"></i>
                                                        {recurso}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Recomendaciones Adicionales */}
                                {recomendacion.recomendaciones_adicionales && (
                                    <div className="mb-4">
                                        <h6 className="text-primary">
                                            <i className="fas fa-lightbulb me-2"></i>
                                            Recomendaciones Adicionales
                                        </h6>
                                        <div className="alert alert-info">
                                            <i className="fas fa-info-circle me-2"></i>
                                            {recomendacion.recomendaciones_adicionales}
                                        </div>
                                    </div>
                                )}

                                {/* Botón Guardar */}
                                <div className="d-flex justify-content-center mt-4">
                                    <button
                                        className="btn btn-success btn-lg"
                                        onClick={handleGuardar}
                                        disabled={guardando}
                                    >
                                        {guardando ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Guardando...</span>
                                                </div>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                Guardar Recomendación
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RecomendacionVista;
