import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

function ChatSupervisorAnalista() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store, joinTicketRoom, leaveTicketRoom, joinChatSupervisorAnalista, leaveChatSupervisorAnalista } = useGlobalReducer();
    
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sincronizando, setSincronizando] = useState(false);
    
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        cargarMensajes();
    }, [ticketId]);

    // Efecto para unirse al room del chat
    useEffect(() => {
        if (ticketId && store.websocket.socket && store.websocket.connected) {
            console.log('🔍 DEBUG: Uniéndose a rooms para ticket', ticketId);
            
            // Unirse al room general del ticket
            joinTicketRoom(store.websocket.socket, parseInt(ticketId));
            // Unirse al room específico del chat supervisor-analista
            joinChatSupervisorAnalista(store.websocket.socket, parseInt(ticketId));
            
            // Configurar listeners para el room del chat
            const socket = store.websocket.socket;
            
            // Escuchar nuevos mensajes del chat específico
            const handleNuevoMensaje = (data) => {
                console.log('💬 NUEVO MENSAJE EN CHAT SUPERVISOR-ANALISTA:', data);
                if (data.ticket_id === parseInt(ticketId)) {
                    setSincronizando(true);
                    cargarMensajes(false).finally(() => setSincronizando(false));
                }
            };

            // Agregar listener específico del chat
            socket.on('nuevo_mensaje_chat_supervisor_analista', handleNuevoMensaje);
            console.log('🔍 DEBUG: Listener agregado para nuevo_mensaje_chat_supervisor_analista');

            // Cleanup al desmontar
            return () => {
                console.log('🔍 DEBUG: Limpiando listeners y saliendo de rooms');
                socket.off('nuevo_mensaje_chat_supervisor_analista', handleNuevoMensaje);
                // Salir de ambos rooms
                leaveTicketRoom(socket, parseInt(ticketId));
                leaveChatSupervisorAnalista(socket, parseInt(ticketId));
            };
        } else {
            console.log('🔍 DEBUG: No se puede unir a rooms - socket:', !!store.websocket.socket, 'connected:', store.websocket.connected);
        }
    }, [ticketId, store.websocket.socket, store.websocket.connected, joinTicketRoom, leaveTicketRoom, joinChatSupervisorAnalista, leaveChatSupervisorAnalista]);

    const cargarMensajes = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/chat-supervisor-analista`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar mensajes del chat');
            }

            const data = await response.json();
            setMensajes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const enviarMensaje = async () => {
        if (!nuevoMensaje.trim()) {
            alert('Por favor ingresa un mensaje');
            return;
        }

        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat-supervisor-analista`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: parseInt(ticketId),
                    mensaje: nuevoMensaje.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            setNuevoMensaje('');
            cargarMensajes(false); // Recargar mensajes sin loading
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            setError(`Error al enviar mensaje: ${err.message}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    const getRoleColor = (rol) => {
        switch (rol) {
            case 'supervisor': return 'bg-warning';
            case 'analista': return 'bg-primary';
            default: return 'bg-secondary';
        }
    };

    const getRoleIcon = (rol) => {
        switch (rol) {
            case 'supervisor': return 'fas fa-user-shield';
            case 'analista': return 'fas fa-user-tie';
            default: return 'fas fa-user';
        }
    };

    const isCurrentUser = (autorRol) => {
        return store.auth.user?.rol === autorRol;
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    if (loading) {
        return (
            <div className="container py-5">
                <div className="row d-flex justify-content-center">
                    <div className="col-md-8 col-lg-6 col-xl-4">
                        <div className="d-flex justify-content-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando chat...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section>
            <div className="container py-5">
                <div className="row d-flex justify-content-center">
                    <div className="col-md-8 col-lg-6 col-xl-4">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center p-3"
                                style={{borderTop: '4px solid #ffa900'}}>
                                <h5 className="mb-0">
                                    <i className="fas fa-comments me-2"></i>
                                    Chat Supervisor - Analista
                                </h5>
                                <div className="d-flex flex-row align-items-center">
                                    <span className="badge bg-warning me-3">{mensajes.length}</span>
                                    <button 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => navigate(-1)}
                                        title="Volver"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            
                            {error && (
                                <div className="alert alert-danger m-3" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}

                            <div className="card-body" style={{position: 'relative', height: '400px', overflowY: 'auto'}}>
                                {mensajes.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="fas fa-comment-slash fa-3x mb-3"></i>
                                        <p>No hay mensajes en este chat</p>
                                        <small>Inicia la conversación enviando un mensaje</small>
                                    </div>
                                ) : (
                                    mensajes.map((mensaje, index) => (
                                        <div key={mensaje.id || index}>
                                            <div className="d-flex justify-content-between">
                                                <p className="small mb-1">
                                                    {isCurrentUser(mensaje.autor?.rol) ? 'Tú' : mensaje.autor?.nombre || 'Usuario'}
                                                </p>
                                                <p className="small mb-1 text-muted">
                                                    {new Date(mensaje.fecha_mensaje).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className={`d-flex flex-row ${isCurrentUser(mensaje.autor?.rol) ? 'justify-content-end' : 'justify-content-start'} mb-4 pt-1`}>
                                                {!isCurrentUser(mensaje.autor?.rol) && (
                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center text-white me-3 ${getRoleColor(mensaje.autor?.rol)}`}
                                                         style={{width: '45px', height: '45px'}}>
                                                        <i className={getRoleIcon(mensaje.autor?.rol)}></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className={`small p-2 mb-3 rounded-3 ${isCurrentUser(mensaje.autor?.rol) ? 'text-white bg-warning' : 'bg-body-tertiary'}`}>
                                                        {mensaje.mensaje}
                                                    </p>
                                                </div>
                                                {isCurrentUser(mensaje.autor?.rol) && (
                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center text-white ms-3 ${getRoleColor(mensaje.autor?.rol)}`}
                                                         style={{width: '45px', height: '45px'}}>
                                                        <i className={getRoleIcon(mensaje.autor?.rol)}></i>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {sincronizando && (
                                    <div className="text-center">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                            <span className="visually-hidden">Sincronizando...</span>
                                        </div>
                                        <small className="text-muted ms-2">Sincronizando...</small>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            <div className="card-footer text-muted d-flex justify-content-start align-items-center p-3">
                                <div className="input-group mb-0">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Escribe tu mensaje..."
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        aria-label="Mensaje" 
                                        aria-describedby="button-enviar" 
                                    />
                                    <button 
                                        className="btn btn-warning" 
                                        type="button" 
                                        id="button-enviar"
                                        onClick={enviarMensaje}
                                        disabled={!nuevoMensaje.trim()}
                                        style={{paddingTop: '.55rem'}}
                                    >
                                        <i className="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ChatSupervisorAnalista;
