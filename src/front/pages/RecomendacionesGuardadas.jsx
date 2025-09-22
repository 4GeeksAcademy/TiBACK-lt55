import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

const RecomendacionesGuardadas = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store } = useGlobalReducer();
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarRecomendaciones();
    }, [ticketId]);

    const cargarRecomendaciones = async () => {
        try {
            setLoading(true);
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar recomendaciones');
            }

            const data = await response.json();
            
            // Filtrar solo comentarios que son recomendaciones de IA
            const recomendacionesIA = data.filter(comentario => 
                comentario.texto.includes('🤖 RECOMENDACIÓN DE IA GENERADA')
            ).sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario));
            
            setRecomendaciones(recomendacionesIA);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const parsearRecomendacion = (texto) => {
        const lines = texto.split('\n');
        const recomendacion = {
            diagnostico: '',
            pasos_solucion: [],
            tiempo_estimado: '',
            nivel_dificultad: '',
            recursos_necesarios: [],
            recomendaciones_adicionales: ''
        };

        let currentSection = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('📋 DIAGNÓSTICO:')) {
                currentSection = 'diagnostico';
                continue;
            } else if (line.includes('📝 PASOS DE SOLUCIÓN:')) {
                currentSection = 'pasos_solucion';
                continue;
            } else if (line.includes('⏱️ TIEMPO ESTIMADO:')) {
                currentSection = 'tiempo_estimado';
                continue;
            } else if (line.includes('📊 NIVEL DE DIFICULTAD:')) {
                currentSection = 'nivel_dificultad';
                continue;
            } else if (line.includes('🔧 RECURSOS NECESARIOS:')) {
                currentSection = 'recursos_necesarios';
                continue;
            } else if (line.includes('💡 RECOMENDACIONES ADICIONALES:')) {
                currentSection = 'recomendaciones_adicionales';
                continue;
            }

            if (line && currentSection) {
                switch (currentSection) {
                    case 'diagnostico':
                        recomendacion.diagnostico += line + ' ';
                        break;
                    case 'pasos_solucion':
                        if (line.match(/^\d+\./)) {
                            // Extraer solo el texto del paso, removiendo TODOS los números y puntos al inicio
                            // Esto maneja casos como "1.1.1. Texto" o "1.2.3.4. Texto"
                            const textoPaso = line.replace(/^[\d\.\s]+/, '').trim();
                            if (textoPaso) {
                                recomendacion.pasos_solucion.push(textoPaso);
                            }
                        }
                        break;
                    case 'tiempo_estimado':
                        recomendacion.tiempo_estimado = line;
                        break;
                    case 'nivel_dificultad':
                        recomendacion.nivel_dificultad = line;
                        break;
                    case 'recursos_necesarios':
                        if (line.startsWith('•')) {
                            recomendacion.recursos_necesarios.push(line.substring(1).trim());
                        }
                        break;
                    case 'recomendaciones_adicionales':
                        if (line !== 'N/A') {
                            recomendacion.recomendaciones_adicionales += line + ' ';
                        }
                        break;
                }
            }
        }

        return recomendacion;
    };

    const getNivelDificultadColor = (nivel) => {
        switch (nivel?.toLowerCase()) {
            case 'baja': return 'badge bg-success';
            case 'media': return 'badge bg-warning';
            case 'alta': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    const getRoleColor = (rol) => {
        switch (rol) {
            case 'cliente': return 'text-primary';
            case 'analista': return 'text-success';
            case 'supervisor': return 'text-warning';
            case 'administrador': return 'text-danger';
            default: return 'text-secondary';
        }
    };

    const getRoleIcon = (rol) => {
        switch (rol) {
            case 'cliente': return 'fas fa-user';
            case 'analista': return 'fas fa-user-tie';
            case 'supervisor': return 'fas fa-user-shield';
            case 'administrador': return 'fas fa-user-cog';
            default: return 'fas fa-user';
        }
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center">
                            <h2>
                                <i className="fas fa-robot me-2"></i>
                                Recomendaciones Guardadas IA - Ticket #{ticketId}
                            </h2>
                        </div>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Volver
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {recomendaciones.length === 0 ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <i className="fas fa-robot fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No hay recomendaciones guardadas</h5>
                                <p className="text-muted">Las recomendaciones de IA guardadas aparecerán aquí</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/ticket/${ticketId}/recomendacion-ia`)}
                                >
                                    <i className="fas fa-plus me-2"></i>
                                    Generar Nueva Recomendación
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="row">
                            {recomendaciones.map((comentario, index) => {
                                const recomendacion = parsearRecomendacion(comentario.texto);
                                return (
                                    <div key={comentario.id} className="col-12 mb-4">
                                        <div className="card">
                                            <div className="card-header">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex align-items-center">
                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${getRoleColor(comentario.autor?.rol)}`} 
                                                             style={{width: '40px', height: '40px', backgroundColor: '#f8f9fa'}}>
                                                            <i className={getRoleIcon(comentario.autor?.rol)}></i>
                                                        </div>
                                                        <div className="ms-3">
                                                            <h6 className="mb-0">
                                                                <strong className={getRoleColor(comentario.autor?.rol)}>
                                                                    {comentario.autor?.nombre || 'Sistema'}
                                                                </strong>
                                                                <small className="text-muted ms-2">
                                                                    ({comentario.autor?.rol || 'sistema'})
                                                                </small>
                                                            </h6>
                                                            <small className="text-muted">
                                                                {new Date(comentario.fecha_comentario).toLocaleString()}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <span className="badge bg-info">
                                                        <i className="fas fa-robot me-1"></i>
                                                        Recomendación IA #{index + 1}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {/* Diagnóstico */}
                                                {recomendacion.diagnostico && (
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
                                                )}

                                                {/* Pasos de Solución */}
                                                {recomendacion.pasos_solucion.length > 0 && (
                                                    <div className="mb-4">
                                                        <h6 className="text-primary">
                                                            <i className="fas fa-list-ol me-2"></i>
                                                            Pasos de Solución
                                                        </h6>
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <ol className="list-group list-group-numbered">
                                                                    {recomendacion.pasos_solucion.map((paso, idx) => (
                                                                        <li key={idx} className="list-group-item border-0 px-0">
                                                                            {paso}
                                                                        </li>
                                                                    ))}
                                                                </ol>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Información Adicional */}
                                                <div className="row mb-4">
                                                    {recomendacion.tiempo_estimado && (
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
                                                    )}
                                                    {recomendacion.nivel_dificultad && (
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
                                                    )}
                                                </div>

                                                {/* Recursos Necesarios */}
                                                {recomendacion.recursos_necesarios.length > 0 && (
                                                    <div className="mb-4">
                                                        <h6 className="text-primary">
                                                            <i className="fas fa-tools me-2"></i>
                                                            Recursos Necesarios
                                                        </h6>
                                                        <div className="card">
                                                            <div className="card-body">
                                                                <ul className="list-group list-group-flush">
                                                                    {recomendacion.recursos_necesarios.map((recurso, idx) => (
                                                                        <li key={idx} className="list-group-item d-flex align-items-center border-0 px-0">
                                                                            <i className="fas fa-check-circle text-success me-3"></i>
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
                                                        <div className="alert alert-info">
                                                            <i className="fas fa-info-circle me-2"></i>
                                                            {recomendacion.recomendaciones_adicionales}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecomendacionesGuardadas;
