import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { SideBarCentral } from '../components/SideBarCentral';

const RecomendacionesGuardadas = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store } = useGlobalReducer();
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarHidden, setSidebarHidden] = useState(false);

    useEffect(() => {
        cargarRecomendaciones();
    }, [ticketId]);

    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };

    const changeView = (view) => {
        if (view === 'dashboard') {
            navigate('/cliente', { replace: true });
        } else if (view === 'tickets') {
            navigate('/cliente', { replace: true });
        } else if (view === 'create') {
            navigate('/cliente', { replace: true });
        }
    };

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
                comentario.texto.includes('🤖 RECOMENDACIÓN DE IA GENERADA') ||
                comentario.texto.includes('🤖 ANÁLISIS DE IMAGEN CON IA:')
            ).sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario));

            setRecomendaciones(recomendacionesIA);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const parsearRecomendacion = (texto) => {
        // Verificar si es un análisis de imagen
        if (texto.includes('🤖 ANÁLISIS DE IMAGEN CON IA:')) {
            return {
                tipo: 'analisis_imagen',
                contenido: texto.replace('🤖 ANÁLISIS DE IMAGEN CON IA:', '').trim(),
                diagnostico: '',
                pasos_solucion: [],
                tiempo_estimado: '',
                nivel_dificultad: '',
                recursos_necesarios: [],
                recomendaciones_adicionales: ''
            };
        }

        // Formato de recomendación estructurada
        const lines = texto.split('\n');
        const recomendacion = {
            tipo: 'recomendacion_estructurada',
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
            <div className="hyper-layout d-flex">
                <SideBarCentral
                    sidebarHidden={sidebarHidden}
                    activeView="recomendaciones-guardadas"
                    changeView={changeView}
                />
                <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                    <div className="d-flex justify-content-center align-items-center vh-100">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="hyper-layout d-flex">
            <SideBarCentral
                hidden={sidebarHidden}
                onToggle={toggleSidebar}
                activeView="recomendaciones-guardadas"
                changeView={changeView}
            />
            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                <div className="container-fluid p-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center">
                                    <h2>
                                        <i className="fas fa-robot me-2"></i>
                                        Recomendaciones Guardadas IA - Ticket #{ticketId}
                                    </h2>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => navigate(-1)}
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        Volver
                                    </button>
                                </div>
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
                                        <div className="d-flex gap-2 justify-content-center">
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate(`/ticket/${ticketId}/recomendacion-ia`)}
                                            >
                                                <i className="fas fa-plus me-2"></i>
                                                Generar Nueva Recomendación
                                            </button>
                                        </div>
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
                                                                    style={{ width: '40px', height: '40px', backgroundColor: '#f8f9fa' }}>
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
                                                            <span className={`badge ${recomendacion.tipo === 'analisis_imagen' ? 'bg-warning' : 'bg-info'}`}>
                                                                <i className={`fas ${recomendacion.tipo === 'analisis_imagen' ? 'fa-image' : 'fa-robot'} me-1`}></i>
                                                                {recomendacion.tipo === 'analisis_imagen' ? 'Análisis de Imagen' : 'Recomendación IA'} #{index + 1}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="card-body">
                                                        {/* Análisis de Imagen */}
                                                        {recomendacion.tipo === 'analisis_imagen' && (
                                                            <div className="mb-4">
                                                                <h6 className="text-warning">
                                                                    <i className="fas fa-image me-2"></i>
                                                                    Análisis de Imagen
                                                                </h6>
                                                                <div className="card bg-warning bg-opacity-10 border-warning">
                                                                    <div className="card-body">
                                                                        <div className="whitespace-pre-wrap" style={{ whiteSpace: 'pre-wrap' }}>
                                                                            {recomendacion.contenido}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Diagnóstico */}
                                                        {recomendacion.tipo === 'recomendacion_estructurada' && recomendacion.diagnostico && (
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

                                                        {/* Secciones solo para recomendaciones estructuradas */}
                                                        {recomendacion.tipo === 'recomendacion_estructurada' && (
                                                            <>
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
                                                            </>
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
            </div>
        </div>
    );
};

export default RecomendacionesGuardadas;
