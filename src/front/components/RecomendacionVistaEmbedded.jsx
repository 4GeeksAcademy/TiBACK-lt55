import React, { useState, useEffect } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

export function RecomendacionVistaEmbedded({ ticketId, onBack }) {
    const { store } = useGlobalReducer();

    const [recomendacion, setRecomendacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

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

    return (
        <div className="container-fluid py-4">
            {/* Header del componente */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={onBack}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Volver
                            </button>
                            <div>
                                <h1 className="mb-0 fw-bold">
                                    <i className="fas fa-robot me-2"></i>
                                    Recomendación de IA - Ticket #{ticketId}
                                </h1>
                                <p className="text-muted mb-0">Análisis inteligente del ticket</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-12">

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
                                                <span className={`badge ${getNivelDificultadColor(recomendacion.nivel_dificultad)} fs-6`}>
                                                    {recomendacion.nivel_dificultad}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recursos Necesarios */}
                                {recomendacion.recursos_necesarios && recomendacion.recursos_necesarios.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="text-primary">
                                            <i className="fas fa-tools me-2"></i>
                                            Recursos Necesarios
                                        </h6>
                                        <div className="card">
                                            <div className="card-body">
                                                <ul className="list-group list-group-flush">
                                                    {recomendacion.recursos_necesarios.map((recurso, index) => (
                                                        <li key={index} className="list-group-item border-0 px-0">
                                                            <i className="fas fa-check-circle text-success me-2"></i>
                                                            {recurso}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Recomendaciones Adicionales */}
                                {recomendacion.recomendaciones_adicionales && (
                                    <div className="mb-4">
                                        <h6 className="text-primary">
                                            <i className="fas fa-lightbulb me-2"></i>
                                            Recomendaciones Adicionales
                                        </h6>
                                        <div className="card bg-warning bg-opacity-10">
                                            <div className="card-body">
                                                <p className="mb-0">{recomendacion.recomendaciones_adicionales}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Botón de Guardar */}
                                <div className="d-flex justify-content-end">
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleGuardar}
                                        disabled={guardando}
                                    >
                                        {guardando ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-2"></i>
                                                Guardar como Comentario
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

export default RecomendacionVistaEmbedded;