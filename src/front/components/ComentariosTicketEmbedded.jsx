import React, { useState, useEffect, useMemo } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { tokenUtils } from '../store';

const ComentariosTicketEmbedded = ({ ticketId, onBack }) => {
    const { store, dispatch, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    const [historialTicket, setHistorialTicket] = useState([]);
    const [sincronizando, setSincronizando] = useState(false);
    const [userData, setUserData] = useState(null);
    const [lastLoadedTicketId, setLastLoadedTicketId] = useState(null);

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
        // Solo cargar datos si es un ticket diferente al último cargado
        if (ticketId !== lastLoadedTicketId) {
            setLastLoadedTicketId(ticketId);
            cargarDatos(true);
        }
    }, [ticketId, lastLoadedTicketId]);

    // Cargar datos del usuario para el sidebar (solo si no están disponibles)
    useEffect(() => {
        // Si ya tenemos datos del usuario en el store, usarlos directamente
        if (store.auth.user && store.auth.isAuthenticated) {
            setUserData(store.auth.user);
            return;
        }

        // Solo cargar si no tenemos datos del usuario
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                if (!token) return;

                const userId = tokenUtils.getUserId(token);
                const role = tokenUtils.getRole(token);

                if (!userId || !role) return;

                // Cargar datos del usuario según su rol
                let userResponse;
                if (role === 'cliente') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (role === 'analista') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (role === 'supervisor') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (role === 'administrador') {
                    userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/administradores/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }

                if (userResponse && userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserData(userData);

                    // Actualizar el store global con los datos del usuario
                    dispatch({
                        type: 'SET_USER',
                        payload: userData
                    });
                }
            } catch (err) {
                // Silently ignore
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch]);

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
                if (data.comentario && data.comentario.id_ticket === parseInt(ticketId)) {
                    setSincronizando(true);
                    cargarDatos(false).finally(() => setSincronizando(false));
                }
            };

            // Escuchar actualizaciones del ticket en el room
            const handleTicketActualizado = (data) => {
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

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            if (event.detail.source === 'footer_sync') {
                // Recargar comentarios del ticket
                cargarDatos(false);
            }
        };

        const handleSyncCompleted = (event) => {
            // Silently ignore
        };

        const handleSyncError = (event) => {
            // Silently ignore
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_comentarios', handleTotalSync);
        window.addEventListener('sync_comentarios', handleTotalSync);
        window.addEventListener('refresh_tickets', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_comentarios', handleTotalSync);
            window.removeEventListener('sync_comentarios', handleTotalSync);
            window.removeEventListener('refresh_tickets', handleTotalSync);
        };
    }, []);

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

            // Procesar datos de forma más eficiente
            const movimientos = [];
            const comentariosUsuarios = [];

            // Un solo bucle para filtrar ambos tipos - MEJORADO
            data.forEach(comentario => {
                const texto = comentario.texto;

                // Filtrar comentarios automáticos del sistema (movimientos automáticos)
                const esMovimientoAutomatico = texto.includes('Ticket asignado') ||
                    texto.includes('Ticket reasignado') ||
                    texto.includes('Ticket solucionado') ||
                    texto.includes('Ticket escalado') ||
                    texto.includes('Ticket iniciado') ||
                    texto.includes('Ticket reabierto') ||
                    texto.includes('Cliente solicita reapertura') ||
                    texto.includes('Ticket cerrado por cliente') ||
                    texto.includes('Ticket cerrado por supervisor') ||
                    texto.includes('Ticket cerrado por administrador') ||
                    texto.includes('Supervisor aprobó solicitud de reapertura') ||
                    texto.includes('Listo para nueva asignación') ||
                    texto.includes('por supervisor') ||
                    texto.includes('por administrador') ||
                    texto.includes('🤖 RECOMENDACIÓN DE IA GENERADA') ||
                    texto.includes('🤖 ANÁLISIS DE IMAGEN CON IA:');

                if (esMovimientoAutomatico) {
                    movimientos.push(comentario);
                } else {
                    // Solo incluir comentarios reales entre usuarios (conversaciones reales)
                    // Verificar que sea un comentario de usuario real, no del sistema
                    const esComentarioReal = comentario.autor &&
                        (comentario.autor.rol === 'cliente' ||
                            comentario.autor.rol === 'analista' ||
                            comentario.autor.rol === 'supervisor') &&
                        texto.trim().length > 0 &&
                        !texto.includes('Sistema:') &&
                        !texto.includes('Automático:');

                    if (esComentarioReal) {
                        comentariosUsuarios.push(comentario);
                    }
                }
            });

            // Ordenar por fecha (más reciente primero)
            const sortByDate = (a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario);

            setHistorialTicket(movimientos.sort(sortByDate));
            setComentarios(comentariosUsuarios.sort(sortByDate));
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

        const comentarioTexto = nuevoComentario.trim();

        // Optimistic update: agregar el comentario inmediatamente a la UI
        const nuevoComentarioObj = {
            id: Date.now(), // ID temporal
            texto: comentarioTexto,
            fecha_comentario: new Date().toISOString(),
            autor: {
                nombre: userData?.nombre || 'Usuario',
                rol: userData?.rol || 'cliente'
            }
        };

        setComentarios(prev => [nuevoComentarioObj, ...prev]);
        setNuevoComentario('');
        setTextoBase('');

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
                    texto: comentarioTexto
                })
            });

            if (!response.ok) {
                throw new Error('Error al agregar comentario');
            }

            // Recargar datos en background para sincronizar
            cargarDatos(false);

            // Actualizar chat activo en localStorage
            if (userData?.id && ticketId && window.updateActiveChat) {
                // Obtener el estado actual del chat para mantener mensajes existentes
                const chatsData = localStorage.getItem('activeChats');
                let activeChats = chatsData ? JSON.parse(chatsData) : [];
                const existingChat = activeChats.find(chat =>
                    chat.ticketId === parseInt(ticketId) && chat.userId === userData.id
                );

                const currentCommentsCount = comentarios.length + 1;
                const currentMessagesCount = existingChat ? existingChat.messagesCount : 0;

                window.updateActiveChat(
                    parseInt(ticketId),
                    `Ticket #${ticketId}`, // Título básico, se puede mejorar obteniendo el título real
                    userData.id,
                    currentCommentsCount, // incrementar comentarios
                    currentMessagesCount // mantener mensajes de chat existentes
                );
            }
        } catch (err) {
            setError(err.message);
            // Revertir el optimistic update en caso de error
            setComentarios(prev => prev.filter(c => c.id !== nuevoComentarioObj.id));
            setNuevoComentario(comentarioTexto);
        }
    };

    // Memoizar funciones de utilidad para mejor rendimiento
    const getRoleColor = useMemo(() => (rol) => {
        switch (rol) {
            case 'cliente': return 'text-primary';
            case 'analista': return 'text-success';
            case 'supervisor': return 'text-warning';
            case 'administrador': return 'text-danger';
            default: return 'text-secondary';
        }
    }, []);

    const getRoleIcon = useMemo(() => (rol) => {
        switch (rol) {
            case 'cliente': return 'fas fa-user';
            case 'analista': return 'fas fa-user-tie';
            case 'supervisor': return 'fas fa-user-shield';
            case 'administrador': return 'fas fa-user-cog';
            default: return 'fas fa-user';
        }
    }, []);

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
        <div className="container-fluid py-4">
            {/* Header del Ticket */}
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
                                <h1 className="mb-0 fw-bold">Comentarios - Ticket #{ticketId}</h1>
                                <p className="text-muted mb-0">Vista de comentarios del ticket</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
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
                            {sincronizando && (
                                <div className="ms-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Sincronizando...</span>
                                    </div>
                                    <small className="text-muted ms-2">Sincronizando...</small>
                                </div>
                            )}
                        </div>
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
                                                    <div className="progress mt-1" style={{ height: '2px' }}>
                                                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                                                            style={{ width: '100%' }}></div>
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
                                                            style={{ width: '40px', height: '40px' }}>
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
                                                            style={{ width: '40px', height: '40px', backgroundColor: '#f8f9fa' }}>
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

export default ComentariosTicketEmbedded;
