import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { useSpeechToText } from '../hooks/useSpeechToText';

const ComentariosTicket = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    const [historialTicket, setHistorialTicket] = useState([]);
    const [sincronizando, setSincronizando] = useState(false);
    
    // Detectar si es un ticket cerrado basándose en la URL
    const esTicketCerrado = window.location.pathname.includes('/comentarios-cerrado');

    // Hook para transcripción de voz
    const {
        isListening,
        isPaused,
        transcript,
        interimTranscript,
        error: speechError,
        isSupported,
        startTranscription,
        togglePause,
        stopTranscription,
        clearTranscript
    } = useSpeechToText();

    useEffect(() => {
        cargarDatos();
    }, [ticketId]);

    // Función para manejar la transcripción
    const handleTranscription = () => {
        if (isListening) {
            if (isPaused) {
                togglePause();
            } else {
                // Al detener, actualizar el texto base con el contenido actual
                setTextoBase(nuevoComentario);
                stopTranscription();
            }
        } else {
            startTranscription();
        }
    };

    // Estado para mantener el texto base (sin transcripción temporal)
    const [textoBase, setTextoBase] = useState('');

    // Actualizar el campo de texto cuando hay transcripción final
    useEffect(() => {
        if (transcript) {
            setTextoBase(prev => prev + transcript + ' ');
            clearTranscript();
        }
    }, [transcript, clearTranscript]);

    // Mostrar transcripción intermedia en tiempo real
    useEffect(() => {
        if (interimTranscript && isListening) {
            // Mostrar el texto base + interim transcript actual
            const textoCompleto = textoBase + (textoBase ? ' ' : '') + interimTranscript;
            setNuevoComentario(textoCompleto);
        } else if (!isListening) {
            setNuevoComentario(textoBase);
        }
    }, [interimTranscript, isListening, textoBase]);

    // Sincronizar texto base cuando el usuario edita manualmente
    const handleTextChange = (e) => {
        const newValue = e.target.value;
        setNuevoComentario(newValue);
        
        // Actualizar el texto base para que la transcripción continúe desde aquí
        if (isListening) {
            // Si hay un interim transcript activo, intentar extraer el texto base
            if (interimTranscript) {
                // Si el texto termina con el interim actual, removerlo para obtener el texto base
                if (newValue.endsWith(interimTranscript)) {
                    const textoSinInterim = newValue.slice(0, -interimTranscript.length).trim();
                    setTextoBase(textoSinInterim);
                } else {
                    // Si no termina con el interim, usar todo el texto como base
                    setTextoBase(newValue);
                }
            } else {
                // Si no hay interim, usar todo el texto como base
                setTextoBase(newValue);
            }
        } else {
            // Si no estamos escuchando, actualizar el texto base normalmente
            setTextoBase(newValue);
        }
    };

    // Limpiar el texto base cuando se limpia el comentario
    const limpiarComentario = () => {
        setNuevoComentario('');
        setTextoBase('');
    };

    // Efecto para unirse al room del ticket
    useEffect(() => {
        if (ticketId && store.websocket.socket && store.websocket.connected) {
            // Unirse al room del ticket
            joinTicketRoom(store.websocket.socket, parseInt(ticketId));
            
            // Configurar listeners para el room del ticket
            const socket = store.websocket.socket;
            
            // Escuchar nuevos comentarios del room del ticket
            const handleNuevoComentario = (data) => {
                console.log('💬 NUEVO COMENTARIO EN ROOM DEL TICKET:', data);
                if (data.comentario && data.comentario.id_ticket === parseInt(ticketId)) {
                    setSincronizando(true);
                    cargarDatos(false).finally(() => setSincronizando(false));
                }
            };

            // Escuchar actualizaciones del ticket en el room
            const handleTicketActualizado = (data) => {
                console.log('🔄 TICKET ACTUALIZADO EN ROOM:', data);
                if (data.ticket_id === parseInt(ticketId)) {
                    setSincronizando(true);
                    cargarDatos(false).finally(() => setSincronizando(false));
                }
            };

            // Agregar listeners específicos del room
            socket.on('nuevo_comentario', handleNuevoComentario);
            socket.on('ticket_actualizado', handleTicketActualizado);
            socket.on('ticket_asignado', handleTicketActualizado);

            // Cleanup al desmontar
            return () => {
                socket.off('nuevo_comentario', handleNuevoComentario);
                socket.off('ticket_actualizado', handleTicketActualizado);
                socket.off('ticket_asignado', handleTicketActualizado);
                // Salir del room del ticket
                leaveTicketRoom(socket, parseInt(ticketId));
            };
        }
    }, [ticketId, store.websocket.socket, store.websocket.connected, joinTicketRoom, leaveTicketRoom]);

    const cargarDatos = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar datos');
            }

            const data = await response.json();
            
            // Filtrar solo comentarios del sistema (movimientos automáticos)
            const movimientos = data.filter(comentario => 
                comentario.texto.includes('Ticket asignado') ||
                comentario.texto.includes('Ticket reasignado') ||
                comentario.texto.includes('Ticket solucionado') ||
                comentario.texto.includes('Ticket escalado') ||
                comentario.texto.includes('Ticket iniciado') ||
                comentario.texto.includes('Ticket reabierto') ||
                comentario.texto.includes('Cliente solicita reapertura')
            ).sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario));
            setHistorialTicket(movimientos);
            
            // Filtrar comentarios de usuarios (excluir movimientos automáticos, recomendaciones IA y chats individuales)
            const comentariosUsuarios = data.filter(comentario => 
                !comentario.texto.includes('Ticket asignado') &&
                !comentario.texto.includes('Ticket reasignado') &&
                !comentario.texto.includes('Ticket solucionado') &&
                !comentario.texto.includes('Ticket escalado') &&
                !comentario.texto.includes('Ticket iniciado') &&
                !comentario.texto.includes('Ticket reabierto') &&
                !comentario.texto.includes('Cliente solicita reapertura') &&
                !comentario.texto.includes('🤖 RECOMENDACIÓN DE IA GENERADA') &&
                !comentario.texto.includes('CHAT_SUPERVISOR_ANALISTA:') &&
                !comentario.texto.includes('CHAT_ANALISTA_CLIENTE:')
            ).sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario));
            setComentarios(comentariosUsuarios);
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };


    const agregarComentario = async () => {
        if (!nuevoComentario.trim()) {
            alert('Por favor ingresa un comentario');
            return;
        }

        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: parseInt(ticketId),
                    texto: nuevoComentario.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Error al agregar comentario');
            }

            setNuevoComentario('');
            setTextoBase('');
            cargarDatos(false); // Recargar ambos tipos de datos sin loading
        } catch (err) {
            setError(err.message);
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
                                <i className="fas fa-comments me-2"></i>
                                {esTicketCerrado ? 'Historial del Ticket Cerrado' : 'Comentarios del Ticket'} #{ticketId}
                                {esTicketCerrado && (
                                    <span className="badge bg-dark ms-2">
                                        <i className="fas fa-lock me-1"></i>
                                        Solo Lectura
                                    </span>
                                )}
                            </h2>
                            <button 
                                className="btn btn-outline-info btn-sm ms-3"
                                onClick={() => navigate(`/ticket/${ticketId}/recomendaciones-ia`)}
                                title="Ver recomendaciones guardadas de IA"
                            >
                                <i className="fas fa-robot me-1"></i>
                                Ver recomendaciones guardadas IA
                            </button>
                            {sincronizando && (
                                <div className="ms-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Sincronizando...</span>
                                    </div>
                                    <small className="text-muted ms-2">Sincronizando...</small>
                                </div>
                            )}
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

                    {speechError && (
                        <div className="alert alert-warning" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {speechError}
                        </div>
                    )}

                    {/* Formulario para agregar comentario - Solo mostrar si no es ticket cerrado */}
                    {!esTicketCerrado && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-plus me-2"></i>
                                    Agregar Comentario
                                </h5>
                            </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label htmlFor="nuevoComentario" className="form-label">
                                    Tu comentario:
                                </label>
                                <div className="input-group">
                                    <textarea
                                        id="nuevoComentario"
                                        className="form-control"
                                        rows="3"
                                        value={nuevoComentario}
                                        onChange={handleTextChange}
                                        placeholder="Escribe tu comentario aquí..."
                                    ></textarea>
                                    <button
                                        type="button"
                                        className={`btn ${isListening ? (isPaused ? 'btn-warning' : 'btn-danger') : 'btn-outline-primary'}`}
                                        onClick={handleTranscription}
                                        disabled={!isSupported}
                                        title={isListening ? (isPaused ? 'Reanudar transcripción' : 'Detener transcripción') : 'Iniciar transcripción de voz'}
                                    >
                                        <i className={`fas ${isListening ? (isPaused ? 'fa-play' : 'fa-stop') : 'fa-microphone'}`}></i>
                                        <i className="fas fa-keyboard ms-1"></i>
                                    </button>
                                </div>
                                {isListening && (
                                    <div className="mt-2">
                                        <small className={`text-${isPaused ? 'warning' : 'success'}`}>
                                            <i className={`fas fa-circle ${isPaused ? 'text-warning' : 'text-success'}`}></i>
                                            {isPaused ? ' Transcripción pausada - Haz clic para reanudar' : ' Escuchando... - Haz clic para detener'}
                                        </small>
                                        {interimTranscript && (
                                            <div className="mt-1">
                                                <small className="text-info">
                                                    <i className="fas fa-microphone me-1"></i>
                                                    Transcribiendo: <em>"{interimTranscript}"</em>
                                                </small>
                                                <div className="progress mt-1" style={{height: '2px'}}>
                                                    <div className="progress-bar progress-bar-striped progress-bar-animated bg-info" 
                                                         style={{width: '100%'}}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!isSupported && (
                                    <div className="mt-2">
                                        <small className="text-muted">
                                            <i className="fas fa-info-circle me-1"></i>
                                            Tu navegador no soporta reconocimiento de voz
                                        </small>
                                    </div>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                <button 
                                    className="btn btn-primary"
                                    onClick={agregarComentario}
                                    disabled={!nuevoComentario.trim()}
                                >
                                    <i className="fas fa-paper-plane me-2"></i>
                                    Enviar Comentario
                                </button>
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={limpiarComentario}
                                    disabled={!nuevoComentario.trim()}
                                >
                                    <i className="fas fa-trash me-2"></i>
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Botones de navegación */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="btn-group w-100" role="group">
                                <button
                                    className={`btn ${!mostrarHistorial ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setMostrarHistorial(false)}
                                >
                                    <i className="fas fa-comments me-2"></i>
                                    {esTicketCerrado ? 'Comentarios y Chats' : 'Historial de Comentarios'} ({comentarios.length})
                                </button>
                                <button
                                    className={`btn ${mostrarHistorial ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setMostrarHistorial(true)}
                                >
                                    <i className="fas fa-history me-2"></i>
                                    Historial del Ticket ({historialTicket.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de comentarios o historial */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className={`fas ${mostrarHistorial ? 'fa-history' : 'fa-comments'} me-2`}></i>
                                {mostrarHistorial ? 'Historial del Ticket' : (esTicketCerrado ? 'Comentarios y Chats (Solo Lectura)' : 'Historial de Comentarios')}
                            </h5>
                        </div>
                        <div className="card-body">
                            {mostrarHistorial ? (
                                // Mostrar historial del ticket
                                historialTicket.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="fas fa-history fa-3x mb-3"></i>
                                        <p>No hay movimientos registrados para este ticket</p>
                                    </div>
                                ) : (
                                    <div className="timeline">
                                        {historialTicket.map((movimiento, index) => (
                                            <div key={movimiento.id} className="timeline-item mb-4">
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 me-3">
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center bg-info text-white" 
                                                             style={{width: '40px', height: '40px'}}>
                                                            <i className="fas fa-cog"></i>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="card border-info">
                                                            <div className="card-header d-flex justify-content-between align-items-center py-2 bg-info text-white">
                                                                <div>
                                                                    <strong>Sistema</strong>
                                                                    <small className="ms-2">(movimiento automático)</small>
                                                                </div>
                                                                <small>
                                                                    {new Date(movimiento.fecha_comentario).toLocaleString()}
                                                                </small>
                                                            </div>
                                                            <div className="card-body py-2">
                                                                <p className="mb-0">{movimiento.texto}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                // Mostrar comentarios normales
                                comentarios.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="fas fa-comment-slash fa-3x mb-3"></i>
                                        <p>{esTicketCerrado ? 'No hay comentarios o chats registrados para este ticket cerrado' : 'No hay comentarios para este ticket'}</p>
                                        {esTicketCerrado && (
                                            <small className="text-info">
                                                <i className="fas fa-info-circle me-1"></i>
                                                Esta vista muestra el historial completo de comunicaciones del ticket
                                            </small>
                                        )}
                                    </div>
                                ) : (
                                    <div className="timeline">
                                        {comentarios.map((comentario, index) => (
                                            <div key={comentario.id} className="timeline-item mb-4">
                                                <div className="d-flex">
                                                    <div className="flex-shrink-0 me-3">
                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${getRoleColor(comentario.autor?.rol)}`} 
                                                             style={{width: '40px', height: '40px', backgroundColor: '#f8f9fa'}}>
                                                            <i className={getRoleIcon(comentario.autor?.rol)}></i>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center py-2">
                                                                <div>
                                                                    <strong className={getRoleColor(comentario.autor?.rol)}>
                                                                        {comentario.autor?.nombre || 'Sistema'}
                                                                    </strong>
                                                                    <small className="text-muted ms-2">
                                                                        ({comentario.autor?.rol || 'sistema'})
                                                                    </small>
                                                                </div>
                                                                <small className="text-muted">
                                                                    {new Date(comentario.fecha_comentario).toLocaleString()}
                                                                </small>
                                                            </div>
                                                            <div className="card-body py-2">
                                                                <p className="mb-0">{comentario.texto}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComentariosTicket;
