import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { SideBarCentral } from '../components/SideBarCentral';

// Utilidades de token seguras
const tokenUtils = {
    decodeToken: (token) => {
        try {
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return null;
        }
    },
    getUserId: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.user_id : null;
    },
    getRole: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.role : null;
    }
};

function ChatSupervisorAnalista() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store, dispatch, joinTicketRoom, leaveTicketRoom, joinChatSupervisorAnalista, leaveChatSupervisorAnalista } = useGlobalReducer();

    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nombresParticipantes, setNombresParticipantes] = useState({
        supervisor: 'Supervisor',
        analista: 'Analista'
    });
    const [sincronizando, setSincronizando] = useState(false);
    const [userData, setUserData] = useState(null);

    // Estados para el sidebar
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('chat');

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Función para alternar sidebar
    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };

    // Función para cambiar vista
    const changeView = (view) => {
        setActiveView(view);
        // Navegar según la vista seleccionada
        switch (view) {
            case 'dashboard':
                navigate('/cliente');
                break;
            case 'tickets':
                navigate('/cliente');
                break;
            case 'create':
                navigate('/cliente');
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        cargarMensajes();
    }, [ticketId]);

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
                console.error('Error al cargar datos del usuario:', err);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch]);

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

            // Actualizar chat activo en localStorage
            if (userData?.id && ticketId && window.updateActiveChat) {
                // Obtener el estado actual del chat para mantener comentarios existentes
                const chatsData = localStorage.getItem('activeChats');
                let activeChats = chatsData ? JSON.parse(chatsData) : [];
                const existingChat = activeChats.find(chat =>
                    chat.ticketId === parseInt(ticketId) && chat.userId === userData.id
                );

                const currentCommentsCount = existingChat ? existingChat.commentsCount : 0;
                const currentMessagesCount = mensajes.length + 1;

                window.updateActiveChat(
                    parseInt(ticketId),
                    `Ticket #${ticketId}`, // Título básico, se puede mejorar obteniendo el título real
                    userData.id,
                    currentCommentsCount, // mantener comentarios existentes
                    currentMessagesCount // incrementar mensajes de chat
                );
            }
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
        // Obtener el rol del usuario actual desde el token
        const token = store.auth.token;
        if (!token) return false;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            const payload = JSON.parse(atob(parts[1]));
            return payload.role === autorRol;
        } catch (error) {
            return false;
        }
    };

    // Función eliminada para evitar errores de API
    // Los nombres se mantienen por defecto: 'Supervisor' y 'Analista'

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            console.log('🔄 Sincronización total recibida en ChatSupervisorAnalista:', event.detail);
            if (event.detail.source === 'footer_sync') {
                // Recargar mensajes del chat
                cargarMensajes();
                console.log('✅ Mensajes del chat actualizados por sincronización total');
            }
        };

        const handleSyncCompleted = (event) => {
            console.log('✅ Sincronización total completada en ChatSupervisorAnalista:', event.detail);
        };

        const handleSyncError = (event) => {
            console.error('❌ Error en sincronización total en ChatSupervisorAnalista:', event.detail);
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_chats', handleTotalSync);
        window.addEventListener('sync_comentarios', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_chats', handleTotalSync);
            window.removeEventListener('sync_comentarios', handleTotalSync);
        };
    }, []);

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
        <div className="hyper-layout d-flex">
            {/* Sidebar central dinámico */}
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
                                <i className="fas fa-bars"></i>
                            </button>
                            <h4 className="mb-0">Chat Supervisor - Analista - Ticket #{ticketId}</h4>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning me-2">{mensajes.length} mensajes</span>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => navigate(-1)}
                            >
                                <i className="fas fa-arrow-left me-1"></i>
                                Volver
                            </button>
                        </div>
                    </div>
                </header>

                {/* Contenido del chat */}
                <div className="p-4">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-md-8 col-lg-6 col-xl-4">
                                <div className="card">
                                    <div className="card-header p-3" style={{ borderTop: '4px solid #ffa900' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">
                                                <i className="fas fa-comments me-2"></i>
                                                Chat Supervisor - Analista
                                            </h5>
                                            {sincronizando && (
                                                <div className="d-flex align-items-center">
                                                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                                        <span className="visually-hidden">Sincronizando...</span>
                                                    </div>
                                                    <small className="text-muted">Sincronizando...</small>
                                                </div>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center text-white bg-warning me-2"
                                                    style={{ width: '25px', height: '25px' }}>
                                                    <i className="fas fa-user-shield" style={{ fontSize: '12px' }}></i>
                                                </div>
                                                <small className="text-muted">{nombresParticipantes.supervisor}</small>
                                            </div>
                                            <div className="mx-2">
                                                <i className="fas fa-arrow-right text-muted"></i>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center text-white bg-primary me-2"
                                                    style={{ width: '25px', height: '25px' }}>
                                                    <i className="fas fa-user-tie" style={{ fontSize: '12px' }}></i>
                                                </div>
                                                <small className="text-muted">{nombresParticipantes.analista}</small>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger m-3" role="alert">
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            {error}
                                        </div>
                                    )}

                                    <div className="card-body" style={{ position: 'relative', height: '400px', overflowY: 'auto' }}>
                                        {mensajes.length === 0 ? (
                                            <div className="text-center text-muted py-4">
                                                <i className="fas fa-comment-slash fa-3x mb-3"></i>
                                                <p>No hay mensajes en este chat</p>
                                                <small>Inicia la conversación enviando un mensaje</small>
                                            </div>
                                        ) : (
                                            mensajes.map((mensaje, index) => (
                                                <div key={mensaje.id || index} className={`d-flex ${isCurrentUser(mensaje.autor?.rol) ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
                                                    <div className={`d-flex align-items-end ${isCurrentUser(mensaje.autor?.rol) ? 'flex-row-reverse' : 'flex-row'}`} style={{ maxWidth: '70%' }}>
                                                        {/* Avatar */}
                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center text-white ${isCurrentUser(mensaje.autor?.rol) ? 'ms-2' : 'me-2'} ${getRoleColor(mensaje.autor?.rol)}`}
                                                            style={{ width: '35px', height: '35px', flexShrink: 0 }}>
                                                            <i className={getRoleIcon(mensaje.autor?.rol)} style={{ fontSize: '14px' }}></i>
                                                        </div>

                                                        {/* Mensaje */}
                                                        <div className={`d-flex flex-column ${isCurrentUser(mensaje.autor?.rol) ? 'align-items-end' : 'align-items-start'}`}>
                                                            <div className={`p-3 rounded-4 ${isCurrentUser(mensaje.autor?.rol) ? 'bg-warning text-white' : 'bg-light text-dark'}`}
                                                                style={{
                                                                    borderRadius: isCurrentUser(mensaje.autor?.rol) ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                                    wordWrap: 'break-word',
                                                                    maxWidth: '100%'
                                                                }}>
                                                                <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                                                    {mensaje.mensaje}
                                                                </p>
                                                            </div>

                                                            {/* Información del mensaje */}
                                                            <div className={`d-flex align-items-center mt-1 ${isCurrentUser(mensaje.autor?.rol) ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                <small className="text-muted" style={{ fontSize: '11px' }}>
                                                                    {isCurrentUser(mensaje.autor?.rol) ? 'Tú' : mensaje.autor?.nombre || 'Usuario'}
                                                                </small>
                                                                <small className="text-muted ms-1" style={{ fontSize: '11px' }}>
                                                                    {new Date(mensaje.fecha_mensaje).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
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
                                                style={{ paddingTop: '.55rem' }}
                                            >
                                                <i className="fas fa-paper-plane"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatSupervisorAnalista;
