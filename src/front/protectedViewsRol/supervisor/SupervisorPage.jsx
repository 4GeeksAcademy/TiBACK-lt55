import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { SideBarCentral } from '../../components/SideBarCentral';
import { DashboardCalidad } from '../../pages/DashboardCalidad';
import VerTicketHDSupervisor from './verTicketHDsupervisor';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatAnalistaClienteEmbedded from '../../components/ChatAnalistaClienteEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';

import { tokenUtils } from '../../store';

export function SupervisorPage() {
    const navigate = useNavigate();
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom, startRealtimeSync, emitCriticalTicketAction, joinCriticalRooms, joinAllCriticalRooms } = useGlobalReducer();

    // Helper resilient fetch that tries configured BACKEND then same-origin then relative
    const backendRequest = async (path, options = {}) => {
        const tried = [];
        const backendBase = import.meta.env.VITE_BACKEND_URL || '';
        const candidates = [];
        if (backendBase) candidates.push(`${backendBase}${path}`);
        // Try same origin
        try { candidates.push(`${window.location.origin}${path}`); } catch (e) { }
        // Finally relative
        candidates.push(path);

        for (const url of candidates) {
            if (!url) continue;
            tried.push(url);
            try {
                const resp = await fetch(url, options);
                // If we get a CORS/network type failure, fetch will throw; if server responds 4xx/5xx we still check
                if (!resp.ok) {
                    // If server error, try next candidate
                    continue;
                }
                return resp;
            } catch (err) {
                // network error, try next
                continue;
            }
        }
        const err = new Error('Network request failed or blocked by CORS. Tried: ' + tried.join(', '));
        throw err;
    };
    const [tickets, setTickets] = useState([]);
    const [ticketsCerrados, setTicketsCerrados] = useState([]);
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCerrados, setLoadingCerrados] = useState(false);
    const [error, setError] = useState('');
    const [showCerrados, setShowCerrados] = useState(false);
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [userData, setUserData] = useState(null);
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        area_responsable: '',
        password: '',
        confirmPassword: ''
    });
    const [ticketsConRecomendaciones, setTicketsConRecomendaciones] = useState(new Set());
    const [expandedTickets, setExpandedTickets] = useState(new Set());

    // Estados para el nuevo diseño
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filterEstado, setFilterEstado] = useState('');
    const [filterAsignado, setFilterAsignado] = useState('');
    const [filterPrioridad, setFilterPrioridad] = useState('');


    // Funciones para el nuevo diseÃ±o
    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };

    const changeView = (view) => {
        setActiveView(view);
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-theme');
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = tickets.filter(ticket =>
                ticket.titulo.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(results);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const closeSearchResults = () => {
        setShowSearchResults(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Función para alternar expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) {
                newSet.delete(ticketId);
            } else {
                newSet.add(ticketId);
            }
            return newSet;
        });
    };

    const selectTicketFromSearch = (ticket) => {
        setActiveView(`ticket-${ticket.id}`);
        closeSearchResults();
    };

    // Función helper para actualizar tickets sin recargar la página
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const resp = await backendRequest('/api/tickets/supervisor', {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const ticketsData = await resp.json();
            setTickets(ticketsData);
        } catch (err) {
            // Surface a concise message but don't break UI
            console.warn('No se pudieron cargar tickets (intentos de backend fallaron):', err.message);
            setError('No se pudieron cargar tickets. Comprueba backend o CORS.');
        }
    };

    // Función para cargar tickets cerrados
    const cargarTicketsCerrados = async () => {
        try {
            setLoadingCerrados(true);
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor/cerrados`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const ticketsData = await response.json();
                setTicketsCerrados(ticketsData);
            }
        } catch (err) {
            // Silently ignore
        } finally {
            setLoadingCerrados(false);
        }
    };

    // Función para actualizar la lista de analistas
    const actualizarAnalistas = async () => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const analistasData = await response.json();
                setAnalistas(analistasData);
                // También actualizar el store global
                dispatch({ type: "analistas_set_list", payload: analistasData });
            }
        } catch (err) {
            // Silently ignore
        }
    };

    // Función helper para actualizar tanto tickets activos como cerrados
    const actualizarTodasLasTablas = async () => {
        await actualizarTickets();
        if (showCerrados) {
            await cargarTicketsCerrados();
        }
    };

    // Función específica para manejar tickets cerrados
    const manejarTicketCerrado = (ticketId) => {

        // Remover inmediatamente de la lista de tickets activos
        setTickets(prev => {
            const ticketRemovido = prev.find(t => t.id === ticketId);
            if (ticketRemovido) {
            }
            return prev.filter(ticket => ticket.id !== ticketId);
        });

        // Si está viendo la lista de cerrados, actualizar inmediatamente
        if (showCerrados) {
            cargarTicketsCerrados();
        }
    };

    // Conectar WebSocket cuando el usuario estÃ© autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = tokenUtils.getRole(store.auth.token);
                joinRoom(socket, role, userId);
            }
        }

        // Cleanup al desmontar
        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // CAMBIO 4: Sistema de Rooms y Sincronización en Tiempo Real
    // Configurar sincronización crítica en tiempo real y unirse a rooms de tickets
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            // Unirse a todas las rooms críticas inmediatamente
            joinAllCriticalRooms(store.websocket.socket, store.auth.user, store.auth.token);

            // Configurar sincronización crítica
            const syncConfig = startRealtimeSync({
                syncTypes: ['tickets', 'comentarios', 'asignaciones', 'chats'],
                onSyncTriggered: (data) => {
                    // Removed debug log
                    if (data.type === 'tickets' || data.priority === 'critical') {
                        actualizarTodasLasTablas();
                    }
                }
            });

            // Unirse a rooms críticos de todos los tickets supervisados
            const ticketIds = tickets.map(ticket => ticket.id);
            if (ticketIds.length > 0) {
                joinCriticalRooms(store.websocket.socket, ticketIds, store.auth.user, store.auth.token);

                // Unirse específicamente a cada room de ticket para sincronización completa
                ticketIds.forEach(ticketId => {
                    try {
                        if (joinTicketRoom) {
                            joinTicketRoom(store.websocket.socket, ticketId);
                        } else {
                            store.websocket.socket.emit('join_ticket', { ticket_id: ticketId, user_id: store.auth.user.id, role: 'supervisor' });
                        }
                    } catch (e) {
                        // silently ignore per defensive strategy
                    }
                });
            }

            // CAMBIO 4A: Configurar listeners COMPLETOS para eventos de tickets en tiempo real
            const socket = store.websocket.socket;

            const handleTicketUpdate = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();

                // Emitir evento para sincronización cruzada
                window.dispatchEvent(new CustomEvent('ticketUpdated', {
                    detail: { ...data, source: 'supervisor_websocket' }
                }));
            };

            const handleComentarioUpdate = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            const handleChatUpdate = (data) => {
                // Removed debug log
                // Actualizar si es necesario
            };

            // EVENTOS CRÍTICOS PARA FLUJO COMPLETO
            const handleTicketCreated = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            const handleTicketAsignado = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            const handleTicketEscalado = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            const handleTicketSolucionado = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            const handleTicketCerrado = (data) => {
                // Removed debug log
                // Mover inmediatamente a lista de cerrados
                moveTicketToClosed(data.ticket_id);
                actualizarTodasLasTablas();
            };

            const handleTicketReabierto = (data) => {
                // Removed debug log
                // Mover de cerrados a activos
                moveTicketToActive(data.ticket_id);
                actualizarTodasLasTablas();
            };

            const handleSolicitudReapertura = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            const handleNuevoTicket = (data) => {
                // Removed debug log
                actualizarTodasLasTablas();
            };

            // Agregar listeners COMPLETOS
            socket.on('ticket_created', handleTicketCreated);
            socket.on('ticket_updated', handleTicketUpdate);
            socket.on('ticket_estado_changed', handleTicketUpdate);
            socket.on('ticket_asignado', handleTicketAsignado);
            socket.on('ticket_escalado', handleTicketEscalado);
            socket.on('ticket_solucionado', handleTicketSolucionado);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('solicitud_reapertura', handleSolicitudReapertura);
            socket.on('reapertura_aprobada', handleTicketUpdate);
            socket.on('nuevo_comentario', handleComentarioUpdate);
            socket.on('nuevo_mensaje_chat_analista_cliente', handleChatUpdate);
            socket.on('nuevo_mensaje_chat_supervisor_analista', handleChatUpdate);
            socket.on('nuevo_ticket', handleNuevoTicket);
            socket.on('ticket_actualizado', handleTicketUpdate);

            // Cleanup COMPLETO
            return () => {
                socket.off('ticket_created', handleTicketCreated);
                socket.off('ticket_updated', handleTicketUpdate);
                socket.off('ticket_estado_changed', handleTicketUpdate);
                socket.off('ticket_asignado', handleTicketAsignado);
                socket.off('ticket_escalado', handleTicketEscalado);
                socket.off('ticket_solucionado', handleTicketSolucionado);
                socket.off('ticket_cerrado', handleTicketCerrado);
                socket.off('ticket_reabierto', handleTicketReabierto);
                socket.off('solicitud_reapertura', handleSolicitudReapertura);
                socket.off('reapertura_aprobada', handleTicketUpdate);
                socket.off('nuevo_comentario', handleComentarioUpdate);
                socket.off('nuevo_mensaje_chat_analista_cliente', handleChatUpdate);
                socket.off('nuevo_mensaje_chat_supervisor_analista', handleChatUpdate);
                socket.off('nuevo_ticket', handleNuevoTicket);
                socket.off('ticket_actualizado', handleTicketUpdate);
            };
        }
    }, [store.auth.user, store.websocket.connected]);
    // FIN CAMBIO 4

    // CAMBIO 4B: Funciones auxiliares para movimiento de tickets entre listas
    const moveTicketToClosed = (ticketId) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            const ticketCerrado = {
                ...ticket,
                estado: 'cerrado_por_supervisor',
                fecha_cierre: new Date().toISOString()
            };

            setTickets(prev => prev.filter(t => t.id !== ticketId));
            setTicketsCerrados(prev => [ticketCerrado, ...prev]);

            // Removed debug log
        }
    };

    const moveTicketToActive = (ticketId) => {
        const ticket = ticketsCerrados.find(t => t.id === ticketId);
        if (ticket) {
            // Determinar el estado correcto según las reglas del backend
            let nuevoEstado = 'en_espera';
            if (ticket.estado === 'solucionado') {
                nuevoEstado = 'reabierto';
            }

            const ticketReabierto = {
                ...ticket,
                estado: nuevoEstado,
                fecha_cierre: null,
                asignacion_actual: null  // Limpiar asignación anterior
            };

            setTicketsCerrados(prev => prev.filter(t => t.id !== ticketId));
            setTickets(prev => [ticketReabierto, ...prev]);

            // Removed debug log
        }
    };
    // FIN CAMBIO 4B

    // CAMBIO 4C: Listeners para eventos de sincronización HTTP (fallback)
    useEffect(() => {
        const handleForceUpdate = (event) => {
            // Removed debug log
            actualizarTodasLasTablas();
        };

        const handleSyncSupervisor = (event) => {
            // Removed debug log
            actualizarTodasLasTablas();
        };

        const handleManualSync = (event) => {
            // Removed debug log
            actualizarTodasLasTablas();
        };

        const handleTotalSync = (event) => {
            // Removed debug log
            actualizarTodasLasTablas();
        };

        const handleSyncTickets = (event) => {
            // Removed debug log
            actualizarTodasLasTablas();
        };

        const handleSyncError = (event) => {
            // Silently ignore
            // Intentar actualizar de todas formas
            actualizarTodasLasTablas();
        };

        // Agregar listeners para eventos del Footer
        window.addEventListener('forceUpdateAllViews', handleForceUpdate);
        window.addEventListener('sync_supervisor', handleSyncSupervisor);
        window.addEventListener('manualSyncTriggered', handleManualSync);
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_tickets', handleSyncTickets);
        window.addEventListener('syncError', handleSyncError);

        // Cleanup
        return () => {
            window.removeEventListener('forceUpdateAllViews', handleForceUpdate);
            window.removeEventListener('sync_supervisor', handleSyncSupervisor);
            window.removeEventListener('manualSyncTriggered', handleManualSync);
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_tickets', handleSyncTickets);
            window.removeEventListener('syncError', handleSyncError);
        };
    }, []);
    // FIN CAMBIO 4C

    // CAMBIO 10: Función para determinar acciones disponibles según estado del ticket
    const getAvailableActions = (ticket) => {
        const actions = {
            canAssign: false,
            canClose: false,
            canReopen: false,
            canEscalate: false,
            canComment: true,  // Siempre se puede comentar
            showReassignMessage: false,
            showReopenButton: false
        };

        // Verificar si tiene solicitud de reapertura activa
        const tieneSolicitud = tieneSolicitudReapertura(ticket);

        switch (ticket.estado) {
            case 'en_espera':
            case 'reabierto':
            case 'creado':
            case 'sin_asignar':
                actions.canAssign = true;
                actions.showReassignMessage = ['en_espera', 'reabierto'].includes(ticket.estado);
                break;

            case 'asignado':
            case 'en_progreso':
            case 'escalado':
                actions.canClose = true;
                actions.canEscalate = true;
                break;

            case 'solucionado':
                actions.canClose = true;
                // Desde solucionado SIEMPRE se puede reabrir (transición válida en backend)
                actions.canReopen = true;
                actions.showReopenButton = true;
                break;

            case 'solicitud_reapertura':
                // CAMBIO: Para tickets en solicitud de reapertura, supervisor puede cerrar o reabrir
                actions.canClose = true;
                actions.canReopen = true;
                actions.showReopenButton = true;
                break;

            case 'cerrado':
            case 'cerrado_por_supervisor':
            case 'cerrado_por_cliente':
                // Tickets cerrados no se pueden reabrir directamente por supervisor
                // Solo si tienen solicitud de reapertura del cliente
                if (tieneSolicitud) {
                    actions.canReopen = false; // No hay transición válida desde cerrado
                    actions.showReopenButton = false;
                }
                break;

            default:
                // Estados desconocidos, solo permitir comentar
                break;
        }

        return actions;
    };
    // FIN CAMBIO 10

    // Funciones de filtrado y estadísticas
    const getFilteredTickets = () => {
        let filtered = tickets;

        if (filterEstado) {
            filtered = filtered.filter(ticket => ticket.estado === filterEstado);
        }

        if (filterAsignado) {
            if (filterAsignado === 'asignados') {
                filtered = filtered.filter(ticket => ticket.asignacion_actual && ticket.asignacion_actual.analista);
            } else if (filterAsignado === 'no-asignados') {
                filtered = filtered.filter(ticket => !ticket.asignacion_actual || !ticket.asignacion_actual.analista);
            }
        }

        if (filterPrioridad) {
            filtered = filtered.filter(ticket => ticket.prioridad === filterPrioridad);
        }

        return filtered;
    };

    const getStats = () => {
        const total = tickets.length;
        const activos = tickets.filter(t => t.estado === 'activo').length;
        const resueltos = tickets.filter(t => t.estado === 'resuelto').length;
        const escalados = tickets.filter(t => t.estado === 'escalado').length;

        return { total, activos, resueltos, escalados };
    };

    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                        setInfoData({
                            nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
                            apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
                            email: data.email || '',
                            area_responsable: data.area_responsable || '',
                            password: '',
                            confirmPassword: ''
                        });

                        // Actualizar el store global con los datos del usuario
                        dispatch({
                            type: 'SET_USER',
                            payload: data
                        });
                    }
                }
            } catch (err) {
                // Silently ignore
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch]);


    // Cargar tickets y analistas
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;

                // Cargar tickets
                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (ticketsResponse.ok) {
                    const ticketsData = await ticketsResponse.json();
                    setTickets(ticketsData);
                }

                // Cargar analistas
                const analistasResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (analistasResponse.ok) {
                    const analistasData = await analistasResponse.json();
                    setAnalistas(analistasData);
                } else {
                    // Silently ignore
                    setError(`Error al cargar la lista de analistas: ${analistasResponse.status} ${analistasResponse.statusText}`);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [store.auth.token]);

    // Verificar recomendaciones para todos los tickets
    useEffect(() => {
        if (tickets.length > 0 && store.auth.token && store.auth.isAuthenticated) {
            // Agregar un pequeño delay para evitar llamadas múltiples
            const timeoutId = setTimeout(() => {
                verificarRecomendaciones();
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [tickets.length, store.auth.token, store.auth.isAuthenticated]);

    const verificarRecomendaciones = async () => {
        try {
            const token = store.auth.token;

            // Verificar que tenemos tickets y token válido
            if (!tickets || tickets.length === 0 || !token) {
                // Removed debug log
                return;
            }

            const recomendacionesPromises = tickets.map(async (ticket) => {
                try {
                    // Validar que el ticket tenga contenido válido
                    if (!ticket.titulo || !ticket.descripcion || ticket.titulo.trim() === '' || ticket.descripcion.trim() === '') {
                        // Removed debug log
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'sin_contenido' };
                    }

                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/recomendaciones-similares`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        // Aumentar timeout para requests más robustos
                        signal: AbortSignal.timeout(15000) // 15 segundos timeout
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const tieneRecomendaciones = data.total_encontrados > 0;
                        // Removed debug log
                        return {
                            ticketId: ticket.id,
                            tieneRecomendaciones,
                            totalRecomendaciones: data.total_encontrados,
                            algoritmo: data.algoritmo || 'legacy'
                        };
                    } else {
                        // Log del error específico pero no fallar
                        // Silently ignore
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: `error_${response.status}` };
                    }
                } catch (fetchError) {
                    // Manejar errores individuales sin fallar toda la operación
                    if (fetchError.name === 'AbortError') {
                        // Silently ignore
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'timeout' };
                    } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                        // Silently ignore
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'network_error' };
                    } else {
                        // Silently ignore
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'unknown_error' };
                    }
                }
            });

            const resultados = await Promise.all(recomendacionesPromises);

            // Análisis detallado de resultados
            const ticketsConRecomendaciones = resultados.filter(r => r.tieneRecomendaciones);
            const ticketsSinRecomendaciones = resultados.filter(r => !r.tieneRecomendaciones);

            // Removed debug log

            // Log específico para tickets sin recomendaciones
            // (debug log removed)

            // Actualizar estado con validaciones robustas
            const ticketsConRecomendacionesSet = new Set();
            resultados.forEach(({ ticketId, tieneRecomendaciones }) => {
                if (tieneRecomendaciones) {
                    ticketsConRecomendacionesSet.add(ticketId);
                }
            });
            setTicketsConRecomendaciones(ticketsConRecomendacionesSet);

            // Removed debug log
        } catch (error) {
            // Silently ignore
            // En caso de error general, limpiar el estado
            setTicketsConRecomendaciones(new Set());
        }
    };

    // Configurar sincronización crítica en tiempo real
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            // Unirse a todas las rooms críticas inmediatamente
            joinAllCriticalRooms(store.websocket.socket, store.auth.user, store.auth.token);

            // Configurar sincronización crítica
            const syncConfig = startRealtimeSync({
                syncTypes: ['tickets', 'comentarios', 'asignaciones', 'analistas'],
                onSyncTriggered: (data) => {
                    // Removed debug log
                    if (data.type === 'tickets' || data.priority === 'critical') {
                        actualizarTickets();
                    }
                    if (data.type === 'analistas' || data.priority === 'critical') {
                        actualizarAnalistas();
                    }
                }
            });

            // Unirse a rooms críticos de todos los tickets supervisados
            const ticketIds = tickets.map(ticket => ticket.id);
            if (ticketIds.length > 0) {
                joinCriticalRooms(store.websocket.socket, ticketIds, store.auth.user, store.auth.token);
            }
        }
    }, [store.auth.user, store.websocket.connected]);

    // Efecto para manejar sincronización manual desde Footer
    useEffect(() => {
        const handleManualSync = (event) => {
            // Removed debug log
            if (event.detail.role === 'supervisor') {
                actualizarTickets();
                actualizarAnalistas();
            }
        };

        window.addEventListener('manualSyncTriggered', handleManualSync);
        return () => window.removeEventListener('manualSyncTriggered', handleManualSync);
    }, []);

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            // Removed debug log
            if (event.detail.role === 'supervisor' || event.detail.source === 'footer_sync') {
                // Recargar todos los datos del supervisor
                actualizarTickets();
                actualizarAnalistas();
                // Removed debug log
            }
        };

        const handleSyncCompleted = (event) => {
            // Removed debug log
        };

        const handleSyncError = (event) => {
            // Silently ignore
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_tickets', handleTotalSync);
        window.addEventListener('refresh_dashboard', handleTotalSync);
        window.addEventListener('sync_tickets', handleTotalSync);
        window.addEventListener('sync_usuarios', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_tickets', handleTotalSync);
            window.removeEventListener('refresh_dashboard', handleTotalSync);
            window.removeEventListener('sync_tickets', handleTotalSync);
            window.removeEventListener('sync_usuarios', handleTotalSync);
        };
    }, []);

    // Efecto para manejar actualizaciones crÃ­ticas de tickets
    useEffect(() => {
        if (store.websocket.criticalTicketUpdate) {
            const criticalUpdate = store.websocket.criticalTicketUpdate;
            // Removed debug log

            // Actualizar inmediatamente para acciones crÃ­ticas
            if (criticalUpdate.priority === 'critical') {
                actualizarTickets();

                // Mostrar notificaciÃ³n visual si es necesario
                if (criticalUpdate.action === 'comentario_agregado' ||
                    criticalUpdate.action === 'ticket_actualizado' ||
                    criticalUpdate.action === 'ticket_creado' ||
                    criticalUpdate.action.includes('estado_cambiado')) {
                    // Removed debug log
                }
            }
        }
    }, [store.websocket.criticalTicketUpdate]);

    // Actualizar tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];

            // ActualizaciÃ³n inmediata para eventos especÃ­ficos (sin esperar)
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado') {
                // Los datos ya estÃ¡n en el store por el WebSocket - actualizaciÃ³n instantÃ¡nea
            }

            // ActualizaciÃ³n especÃ­fica para analistas
            if (lastNotification.tipo === 'analista_creado') {

                // Actualizar estado local inmediatamente si hay datos del analista
                if (lastNotification.analista) {
                    setAnalistas(prev => {
                        const newList = [...prev, lastNotification.analista];
                        return newList;
                    });
                }
                // TambiÃ©n hacer actualizaciÃ³n completa para asegurar consistencia
                actualizarAnalistas();
            }

            // ActualizaciÃ³n especÃ­fica para analistas eliminados
            if (lastNotification.tipo === 'analista_eliminado') {
                // Removed debug log

                // Remover inmediatamente de la lista local
                if (lastNotification.analista_id) {
                    setAnalistas(prev => {
                        const analistaEliminado = prev.find(a => a.id === lastNotification.analista_id);
                        if (analistaEliminado) {
                            console.log('ðŸ—‘ï¸ SUPERVISOR - Analista eliminado removido de lista:', analistaEliminado.nombre, analistaEliminado.apellido);
                        }
                        const newList = prev.filter(analista => analista.id !== lastNotification.analista_id);
                        console.log('ðŸ“Š SUPERVISOR - Nueva lista de analistas despuÃ©s de eliminar:', newList.length);
                        return newList;
                    });
                }
                // TambiÃ©n hacer actualizaciÃ³n completa para asegurar consistencia
                actualizarAnalistas();
            }

            // SincronizaciÃ³n ULTRA RÃPIDA para eventos crÃ­ticos
            if (lastNotification.tipo === 'escalado' || lastNotification.tipo === 'asignado' || lastNotification.tipo === 'solicitud_reapertura' || lastNotification.tipo === 'creado' || lastNotification.tipo === 'cerrado') {
                console.log('âš¡ SUPERVISOR - SINCRONIZACIÃ“N INMEDIATA:', lastNotification.tipo);
                // ActualizaciÃ³n inmediata sin debounce para eventos crÃ­ticos
                actualizarTodasLasTablas();
            }

            // Manejo especÃ­fico para tickets cerrados - sincronizaciÃ³n inmediata
            if (lastNotification.tipo === 'cerrado' || lastNotification.tipo === 'ticket_cerrado') {
                console.log('ðŸ”’ SUPERVISOR - TICKET CERRADO DETECTADO:', lastNotification);

                // Usar la funciÃ³n especÃ­fica para manejar tickets cerrados
                if (lastNotification.ticket_id) {
                    manejarTicketCerrado(lastNotification.ticket_id);
                }
            }

            // Manejo especÃ­fico para tickets eliminados - sincronizaciÃ³n inmediata
            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {
                console.log('ðŸ—‘ï¸ SUPERVISOR - TICKET ELIMINADO DETECTADO:', lastNotification);

                // Remover inmediatamente de la lista de tickets activos
                if (lastNotification.ticket_id) {
                    setTickets(prev => {
                        const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                        if (ticketRemovido) {
                            console.log('ðŸ—‘ï¸ SUPERVISOR - Ticket eliminado removido de lista activa:', ticketRemovido.titulo);
                        }
                        return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                    });

                    // TambiÃ©n remover de la lista de cerrados si estÃ¡ visible
                    if (showCerrados) {
                        setTicketsCerrados(prev => {
                            const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                            if (ticketRemovido) {
                                console.log('ðŸ—‘ï¸ SUPERVISOR - Ticket eliminado removido de lista cerrada:', ticketRemovido.titulo);
                            }
                            return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                        });
                    }
                }
            }
        }
    }, [store.websocket.notifications, showCerrados]);

    const asignarTicket = async (ticketId, analistaId) => {
        try {
            console.log(`âš¡ ASIGNANDO TICKET ${ticketId} A ANALISTA ${analistaId} INMEDIATAMENTE`);
            const token = store.auth.token;

            // Buscar el ticket para determinar si es una reasignaciÃ³n
            const ticket = tickets.find(t => t.id === ticketId);
            const esReasignacion = ticket && ticket.asignacion_actual && ticket.asignacion_actual.id_analista;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_analista: analistaId,
                    es_reasignacion: esReasignacion
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Error en asignación:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData,
                    ticketId: ticketId,
                    analistaId: analistaId,
                    requestBody: {
                        id_analista: analistaId,
                        es_reasignacion: esReasignacion
                    }
                });
                throw new Error(`Error al asignar ticket: ${errorData.message || 'Error desconocido'}`);
            }

            console.log('âœ… TICKET ASIGNADO EXITOSAMENTE');

            // Emitir acciÃ³n crÃ­tica de asignaciÃ³n
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, `ticket_asignado_${analistaId}`, store.auth.user);
            }

            // ActualizaciÃ³n ULTRA RÃPIDA sin esperar
            actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    const cambiarEstadoTicket = async (ticketId, nuevoEstado) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                throw new Error('Error al cambiar estado del ticket');
            }

            // Emitir acciÃ³n crÃ­tica de cambio de estado
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, `estado_cambiado_${nuevoEstado}`, store.auth.user);
            }

            // Actualizar tickets sin recargar la pÃ¡gina
            await actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    const agregarComentario = async (ticketId) => {
        try {
            const token = store.auth.token;
            let existentes = '';
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                existentes = data.map(c => `${c.autor?.rol || 'Sistema'}: ${c.texto}`).join('\n');
            }
            const texto = prompt('Agregar comentario:', existentes ? existentes + '\n' : '');
            if (!texto) return;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_ticket: ticketId, texto })
            });
            if (!response.ok) throw new Error('Error al agregar comentario');

            // Actualizar tickets sin recargar la pÃ¡gina
            await actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    const generarRecomendacion = (ticket) => {
        // Usar el sistema de vistas integradas
        setActiveView(`recomendacion-${ticket.id}`);
    };

    const asignarAnalista = (ticketId) => {
        // Redirigir a la vista de asignación de analistas
        navigate(`/ticket/${ticketId}/asignar-analista`);
    };

    const escalarTicket = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/escalar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Actualizar la lista de tickets
                await actualizarTodasLasTablas();
                alert('Ticket escalado exitosamente');
            } else {
                const errorData = await response.json();
                alert(`Error al escalar ticket: ${errorData.message || 'Error desconocido'}`);
            }
        } catch (err) {
            alert(`Error al escalar ticket: ${err.message}`);
        }
    };

    // CAMBIO 5: Mejora de función cerrarTicket con sincronización inmediata
    const cerrarTicket = async (ticketId) => {
        if (confirm('¿Estás seguro de que quieres cerrar este ticket?')) {
            try {
                const token = store.auth.token;

                // Encontrar el ticket antes de cerrarlo
                const ticketACerrar = tickets.find(t => t.id === ticketId);

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: 'cerrado' })
                });

                if (response.ok) {
                    // Actualizar inmediatamente el estado local del ticket
                    if (ticketACerrar) {
                        const ticketCerrado = {
                            ...ticketACerrar,
                            estado: 'cerrado_por_supervisor',
                            fecha_cierre: new Date().toISOString()
                        };

                        // Remover de la lista activa
                        setTickets(prev => prev.filter(t => t.id !== ticketId));

                        // Agregar a la lista de cerrados inmediatamente
                        setTicketsCerrados(prev => [ticketCerrado, ...prev]);

                        // Emitir evento WebSocket para sincronización en tiempo real
                        if (store.websocket.socket && store.websocket.connected) {
                            emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_cerrado', store.auth.user);
                        }
                    }

                    // Actualizar todas las tablas para asegurar consistencia
                    await actualizarTodasLasTablas();
                    alert('Ticket cerrado exitosamente');
                } else {
                    const errorData = await response.json();
                    alert(`Error al cerrar ticket: ${errorData.message || 'Error desconocido'}`);
                }
            } catch (err) {
                alert(`Error al cerrar ticket: ${err.message}`);
            }
        }
    };
    // FIN CAMBIO 5

    const reabrirTicket = async (ticketId) => {
        if (confirm('¿Estás seguro de que quieres reabrir este ticket?')) {
            try {
                const token = store.auth.token;

                // CAMBIO 1: Lógica inteligente según estado actual del ticket
                const ticket = tickets.find(t => t.id === ticketId) || ticketsCerrados.find(t => t.id === ticketId);
                let nuevoEstado = 'en_espera'; // Default

                if (ticket) {
                    // Según las reglas del backend para supervisor:
                    // - 'reabierto' ← solo desde 'solucionado' 
                    // - 'en_espera' ← solo desde ['creado', 'reabierto']
                    // - 'cerrado' ← desde ['solucionado', 'reabierto']

                    const estadoActual = ticket.estado.toLowerCase();

                    if (estadoActual === 'solucionado') {
                        // Desde solucionado puede ir a 'en espera' (reapertura)
                        nuevoEstado = 'en espera';
                    } else if (['creado', 'reabierto'].includes(estadoActual)) {
                        // Desde creado o reabierto puede ir a 'en_espera'  
                        nuevoEstado = 'en espera';
                    } else {
                        // Para otros estados (asignado, en_progreso, etc.) no hay transición válida directa
                        alert('No se puede reabrir este ticket desde su estado actual. El ticket debe estar solucionado o cerrado.');
                        return;
                    }
                }

                console.log(`🔄 Reabriendo ticket ${ticketId}: ${ticket?.estado} → ${nuevoEstado}`);

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        estado: nuevoEstado
                    })
                });

                if (response.ok) {
                    // Actualizar la lista de tickets
                    await actualizarTodasLasTablas();
                    alert('Ticket reabierto exitosamente');
                } else {
                    const errorData = await response.json();
                    alert(`Error al reabrir ticket: ${errorData.message || 'Error desconocido'}`);
                }
            } catch (err) {
                alert(`Error al reabrir ticket: ${err.message}`);
            }
        }
    };
    // FIN CAMBIO 1

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const updateInfo = async () => {
        try {
            // Validar contraseÃ±as si se proporcionan
            if (infoData.password && infoData.password !== infoData.confirmPassword) {
                setError('Las contraseÃ±as no coinciden');
                return;
            }

            if (infoData.password && infoData.password.length < 6) {
                setError('La contraseÃ±a debe tener al menos 6 caracteres');
                return;
            }

            setUpdatingInfo(true);
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);

            // Preparar datos para actualizar
            const updateData = {
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                area_responsable: infoData.area_responsable
            };

            // Solo incluir contraseña si se proporciona
            if (infoData.password) {
                updateData.password = infoData.password;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar informaciÃ³n');
            }

            // Actualizar los datos locales
            const updatedUserData = {
                ...userData,
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                area_responsable: infoData.area_responsable
            };
            setUserData(updatedUserData);

            // Actualizar el store global para que se refleje en el SideBarCentral
            dispatch({ type: 'SET_USER', payload: updatedUserData });

            alert('InformaciÃ³n actualizada exitosamente');
            setShowInfoForm(false);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingInfo(false);
        }
    };


    const getEstadoColor = (estado) => {
        switch (estado.toLowerCase()) {
            case 'creado': return 'badge bg-secondary';
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            case 'cerrado_por_supervisor': return 'badge bg-dark';
            case 'reabierto': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad.toLowerCase()) {
            case 'alta': return 'badge bg-danger';
            case 'media': return 'badge bg-warning';
            case 'baja': return 'badge bg-success';
            default: return 'badge bg-secondary';
        }
    };

    // FunciÃ³n para determinar el color del semÃ¡foro - MEJORADA
    const getSemaforoColor = (ticket, allTickets) => {
        // PRIORIDAD 1: Solicitud de reapertura pendiente → AMARILLO
        if (tieneSolicitudReapertura(ticket)) {
            return 'table-warning'; // Amarillo para solicitudes de reapertura
        }

        const fechaActual = new Date();
        const fechaCreacion = new Date(ticket.fecha_creacion);
        const diasDiferencia = Math.floor((fechaActual - fechaCreacion) / (1000 * 60 * 60 * 24));

        // Ordenar tickets por fecha de creaciÃ³n (mÃ¡s antiguos primero)
        const ticketsOrdenados = [...allTickets].sort((a, b) =>
            new Date(a.fecha_creacion) - new Date(b.fecha_creacion)
        );

        const esTicketMasViejo = ticketsOrdenados.length > 0 &&
            ticketsOrdenados[0].id === ticket.id;

        const prioridadAlta = ticket.prioridad.toLowerCase() === 'alta';
        const esTicketViejo = diasDiferencia >= 3; // Consideramos viejo si tiene 3+ dÃ­as

        // LÃ³gica del semÃ¡foro original
        if (prioridadAlta && esTicketMasViejo) {
            return 'table-danger'; // Rojo: Prioridad alta y ticket mÃ¡s viejo
        } else if (prioridadAlta || esTicketViejo) {
            return 'table-warning'; // Naranja: Prioridad alta O ticket viejo
        } else {
            return 'table-success'; // Verde: Prioridad media/baja y ticket reciente
        }
    };

    // FunciÃ³n helper para detectar si hay una solicitud de reapertura del cliente - MEJORADA
    const tieneSolicitudReapertura = (ticket) => {
        // Usar la información del backend si está disponible
        if (ticket.tiene_solicitud_reapertura_pendiente !== undefined) {
            return ticket.tiene_solicitud_reapertura_pendiente;
        }

        // Fallback: verificar comentarios manualmente
        if (!ticket.comentarios || !Array.isArray(ticket.comentarios)) {
            return false;
        }

        return ticket.comentarios.some(comentario =>
            (comentario.texto === "Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor" ||
                comentario.texto === "Cliente solicita reapertura del ticket") &&
            comentario.autor?.rol === "cliente"
        );
    };

    // Función helper para detectar si un ticket fue escalado por un analista
    const fueEscaladoPorAnalista = (ticket) => {
        if (!ticket.comentarios || !Array.isArray(ticket.comentarios)) {
            return false;
        }

        // Un ticket fue escalado si:
        // 1. Está en estado 'en_espera'
        // 2. Tiene comentarios de escalación
        // 3. No tiene asignación actual (fue desasignado)
        const tieneComentarioEscalacion = ticket.comentarios.some(comentario =>
            comentario.texto && (
                comentario.texto.toLowerCase().includes('escalado') ||
                comentario.texto.toLowerCase().includes('escalación')
            )
        );

        return ticket.estado === 'en_espera' &&
            tieneComentarioEscalacion &&
            (!ticket.asignacion_actual || !ticket.asignacion_actual.analista);
    };

    const stats = getStats();
    const filteredTickets = getFilteredTickets();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center full-height">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="hyper-layout d-flex">
            {/* Sidebar central dinÃ¡mico */}
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
                                title={sidebarHidden ? "Mostrar menÃº" : "Ocultar menÃº"}
                            >
                                <i className="fas fa-bars"></i>
                            </button>

                            {/* Barra de búsqueda */}
                            <div className="hyper-search position-relative">
                                <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                <input
                                    type="text"
                                    className="form-control pe-5"
                                    placeholder="Buscar tickets por titulo..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => {
                                        if (searchResults.length > 0) {
                                            setShowSearchResults(true);
                                        }
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-3 p-0 z-index-10"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            setShowSearchResults(false);
                                        }}
                                        title="Limpiar bÃºsqueda"
                                    >
                                        <i className="fas fa-times text-muted"></i>
                                    </button>
                                )}

                                {/* Resultados de bÃºsqueda */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-lg dropdown-menu-custom">
                                        <div className="p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                                                <small className="text-muted fw-semibold">
                                                    Tickets encontrados ({searchResults.length})
                                                </small>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary ms-3"
                                                    onClick={closeSearchResults}
                                                    title="Cerrar resultados"
                                                >
                                                    <span>X</span>
                                                </button>
                                            </div>
                                            {searchResults.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="search-result-item p-2 border-bottom cursor-pointer"
                                                    onClick={() => selectTicketFromSearch(ticket)}
                                                >
                                                    <div className="fw-semibold">#{ticket.id} - {ticket.titulo}</div>
                                                    <small className="text-muted">
                                                        {ticket.estado} â€¢ {ticket.prioridad}
                                                    </small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            {/* Botón de sincronizar */}
                            <button
                                className="btn btn-outline-primary d-flex align-items-center gap-2"
                                onClick={async () => {
                                    try {
                                        console.log('🔄 Iniciando sincronización desde SupervisorPage...');
                                        await startRealtimeSync({
                                            syncTypes: ['tickets', 'comentarios', 'asignaciones', 'gestiones'],
                                            syncInterval: 5000,
                                            enablePolling: true,
                                            userData: store.auth.user
                                        });
                                        console.log('✅ Sincronización completada desde SupervisorPage');
                                    } catch (error) {
                                        console.error('❌ Error en sincronización desde SupervisorPage:', error);
                                    }
                                }}
                                title="Sincronizar datos"
                                style={{
                                    borderColor: 'var(--ct-primary)',
                                    color: 'var(--ct-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'var(--ct-primary)';
                                    e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = 'var(--ct-primary)';
                                }}
                            >
                                <i className="fas fa-sync-alt"></i>
                                <span>Sincronizar</span>
                            </button>

                            {/* Dropdown del usuario */}
                            <div className="position-relative dropdown">
                                <button
                                    className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                >
                                    {userData?.url_imagen ? (
                                        <img
                                            src={userData.url_imagen}
                                            alt="Avatar"
                                            className="avatar-header-normal rounded-circle"
                                        />
                                    ) : (
                                        <div className="avatar-header-normal bg-primary d-flex align-content-center rounded-circle">
                                            <i className="fa-solid fa-user fa-xl text-white text-center"></i>
                                        </div>
                                    )}
                                    <span className="fw-semibold">
                                        {userData?.nombre === 'Pendiente' ? 'Supervisor' : userData?.nombre}
                                    </span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>

                                {showUserDropdown && (
                                    <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width">
                                        <div className="p-3 border-bottom">
                                            <div className="fw-semibold">
                                                {userData?.nombre === 'Pendiente' ? 'Supervisor' : userData?.nombre}
                                            </div>
                                            <small className="text-muted">Supervisor</small>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                style={{ textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                onClick={() => {
                                                    console.log('SupervisorPage - Mi Perfil button clicked');
                                                    changeView('profile');
                                                    setShowUserDropdown(false);
                                                    console.log('SupervisorPage - Dropdown closed, view changed to profile');
                                                }}
                                            >
                                                <i className="fas fa-user-edit"></i>
                                                <span>Mi Perfil</span>
                                            </button>
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                style={{ textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                onClick={() => {
                                                    setShowUserDropdown(false);
                                                    navigate('/');
                                                }}
                                            >
                                                <i className="fas fa-home"></i>
                                                <span>Ir al inicio</span>
                                            </button>
                                            <div className="d-flex align-items-center justify-content-between p-2">
                                                <span className="small">Modo Oscuro</span>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={isDarkMode}
                                                        onChange={toggleTheme}
                                                    />
                                                </div>
                                            </div>
                                            <hr className="my-2" />
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2 text-danger"
                                                style={{ textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                onClick={() => {
                                                    setShowUserDropdown(false);
                                                    logout();
                                                }}
                                            >
                                                <i className="fas fa-sign-out-alt"></i>
                                                <span>Cerrar sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Contenido principal */}
                <div className="p-4">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <>
                            <h1 className="hyper-page-title">Dashboard Supervisor</h1>

                            {/* MÃ©tricas principales */}
                            <div className="row mb-4 g-3">
                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Total Tickets</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-primary me-2">{stats.total}</h3>
                                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-ticket-alt text-primary"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Total del sistema</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Tickets Activos</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-warning me-2">{stats.activos}</h3>
                                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-clock text-warning"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">En proceso</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Tickets Resueltos</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-success me-2">{stats.resueltos}</h3>
                                                    <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-check-circle text-success"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Completados</small>
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
                                                    <h3 className="mb-0 text-danger me-2">{stats.escalados}</h3>
                                                    <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-exclamation-triangle text-danger"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Requieren atención</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Tickets Reabiertos</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-info me-2">{tickets.filter(t => ['en_espera', 'reabierto'].includes(t.estado)).length}</h3>
                                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-redo text-info"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Reactivados</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Satisfacción Cliente</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-warning me-2">
                                                        {tickets.filter(t => t.calificacion).length > 0
                                                            ? (tickets.filter(t => t.calificacion).reduce((sum, t) => sum + t.calificacion, 0) / tickets.filter(t => t.calificacion).length).toFixed(1)
                                                            : '0.0'
                                                        }
                                                    </h3>
                                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-star text-warning"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Promedio general</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Widgets del dashboard */}
                            {/* Tickets recientes */}
                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                            <h5 className="card-title mb-0">Tickets Recientes</h5>
                                            <button
                                                className="btn btn-sidebar-primary btn-sm"
                                                onClick={() => changeView('tickets')}
                                            >
                                                <i className="fas fa-list me-1"></i>
                                                Ver Todos los Tickets
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            {tickets.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th className="text-center">ID</th>
                                                                <th className="text-center">Título</th>
                                                                <th className="text-center">Estado</th>
                                                                <th className="text-center">Fecha y Hora</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tickets.slice(0, 5).map((ticket) => (
                                                                <tr key={ticket.id}>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block dot-ct-blue"
                                                                            ></span>
                                                                            <span className="fw-bold text-dark dark-theme:text-white">
                                                                                #{ticket.id}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block dot-ct-purple"
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.titulo}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className={`rounded-circle d-inline-block ${ticket.estado.toLowerCase() === 'solucionado' ? 'dot-estado-solucionado' :
                                                                                    ticket.estado.toLowerCase() === 'en_proceso' ? 'dot-estado-en-proceso' :
                                                                                        'dot-ct-blue'
                                                                                    }`}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.estado}
                                                                            </span>
                                                                        </span>
                                                                        {/* CAMBIO 2: Mensaje de solicitud de reapertura en Dashboard */}
                                                                        {tieneSolicitudReapertura(ticket) && (
                                                                            <div className="mt-1">
                                                                                <small className="badge bg-warning text-dark">
                                                                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                                                                    Solicitud de reapertura
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                        {/* FIN CAMBIO 2 */}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block"
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    backgroundColor: 'var(--ct-info)'
                                                                                }}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                                    year: 'numeric',
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                                                    <p className="text-muted">No hay tickets disponibles</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Tickets View */}
                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <>
                            <h1 className="hyper-page-title">Todos los Tickets</h1>

                            {/* Lista de tickets activos */}
                            <div className="hyper-widget card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Gestión de Tickets</h5>
                                    <div className="d-flex gap-2 align-items-center">
                                        <small className="text-muted">
                                            {analistas.length} analista{analistas.length !== 1 ? 's' : ''} disponible{analistas.length !== 1 ? 's' : ''}
                                        </small>
                                        <div className="dropdown">
                                            <button
                                                className="btn btn-outline-primary btn-sm dropdown-toggle"
                                                type="button"
                                                data-bs-toggle="dropdown"
                                                aria-expanded="false"
                                            >
                                                <i className="fas fa-filter me-1"></i>
                                                Filtrar
                                                {(filterEstado || filterAsignado || filterPrioridad) && (
                                                    <span className="badge bg-primary ms-1">{(filterEstado ? 1 : 0) + (filterAsignado ? 1 : 0) + (filterPrioridad ? 1 : 0)}</span>
                                                )}
                                            </button>

                                            <ul className="dropdown-menu">
                                                <li><h6 className="dropdown-header">Filtrar Tickets</h6></li>
                                                <li>
                                                    <div className="px-3 py-2">
                                                        <label className="form-label small">Por Estado:</label>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={filterEstado}
                                                            onChange={(e) => setFilterEstado(e.target.value)}
                                                        >
                                                            <option value="">Todos los estados</option>
                                                            <option value="activo">Activo</option>
                                                            <option value="en_progreso">En Progreso</option>
                                                            <option value="resuelto">Resuelto</option>
                                                            <option value="escalado">Escalado</option>
                                                            <option value="cerrado">Cerrado</option>
                                                        </select>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="px-3 py-2">
                                                        <label className="form-label small">Por Asignación:</label>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={filterAsignado}
                                                            onChange={(e) => setFilterAsignado(e.target.value)}
                                                        >
                                                            <option value="">Todos</option>
                                                            <option value="asignados">Con Analista Asignado</option>
                                                            <option value="no-asignados">Sin Asignar</option>
                                                        </select>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div className="px-3 py-2">
                                                        <label className="form-label small">Por Prioridad:</label>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={filterPrioridad}
                                                            onChange={(e) => setFilterPrioridad(e.target.value)}
                                                        >
                                                            <option value="">Todas las prioridades</option>
                                                            <option value="baja">Baja</option>
                                                            <option value="media">Media</option>
                                                            <option value="alta">Alta</option>
                                                            <option value="critica">Crítica</option>
                                                        </select>
                                                    </div>
                                                </li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li>
                                                    <button
                                                        className="dropdown-item"
                                                        onClick={() => {
                                                            setFilterEstado('');
                                                            setFilterAsignado('');
                                                            setFilterPrioridad('');
                                                        }}
                                                    >
                                                        <i className="fas fa-times me-1"></i>
                                                        Limpiar filtros
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body p-0">
                                    {filteredTickets.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                                            <p className="text-muted">No hay tickets que coincidan con los filtros</p>
                                            <button
                                                className="btn btn-outline-secondary"
                                                onClick={() => {
                                                    setFilterEstado('');
                                                    setFilterAsignado('');
                                                    setFilterPrioridad('');
                                                }}
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Limpiar filtros
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th className="text-center px-3">ID</th>
                                                        <th className="text-center px-4">Cliente</th>
                                                        <th className="text-center px-4">Título</th>
                                                        <th className="text-center px-3">Estado</th>
                                                        <th className="text-center px-3">Prioridad</th>
                                                        <th className="text-center px-3">Analista</th>
                                                        <th className="text-center px-3">Fecha</th>
                                                        <th className="text-center px-4">Acciones</th>
                                                        <th className="text-center px-2" style={{ width: '50px' }}>Expandir</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tickets
                                                        .sort((a, b) => {
                                                            const colorA = getSemaforoColor(a, tickets);
                                                            const colorB = getSemaforoColor(b, tickets);
                                                            const order = { 'table-danger': 0, 'table-warning': 1, 'table-success': 2 };
                                                            return order[colorA] - order[colorB];
                                                        })
                                                        .map((ticket) => {
                                                            const isExpanded = expandedTickets.has(ticket.id);
                                                            return (
                                                                <React.Fragment key={ticket.id}>
                                                                    <tr className={getSemaforoColor(ticket, tickets)}>
                                                                        <td className="text-center px-3">
                                                                            <div className="d-flex align-items-center justify-content-center">
                                                                                <span className="me-2">#{ticket.id}</span>
                                                                                {ticket.url_imagen ? (
                                                                                    <img
                                                                                        src={ticket.url_imagen}
                                                                                        alt="Imagen del ticket"
                                                                                        className="img-thumbnail thumbnail-small"
                                                                                    />
                                                                                ) : (
                                                                                    <span className="text-muted">
                                                                                        <i className="fas fa-image icon-tiny"></i>
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4">
                                                                            <span className="d-flex align-items-center gap-2">
                                                                                <span
                                                                                    className="rounded-circle d-inline-block"
                                                                                    style={{
                                                                                        width: '8px',
                                                                                        height: '8px',
                                                                                        backgroundColor: 'var(--ct-info)'
                                                                                    }}
                                                                                ></span>
                                                                                <span className="text-dark dark-theme:text-white">
                                                                                    {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                                                                </span>
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4">
                                                                            <div>
                                                                                <div className="fw-semibold mb-1">{ticket.titulo}</div>
                                                                                <small className="text-muted">
                                                                                    {ticket.descripcion && ticket.descripcion.length > 50
                                                                                        ? `${ticket.descripcion.substring(0, 50)}...`
                                                                                        : ticket.descripcion || 'Sin descripción'
                                                                                    }
                                                                                </small>
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-center px-3">
                                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                                <span
                                                                                    className={`rounded-circle d-inline-block ${ticket.estado === 'activo' ? 'dot-estado-activo' :
                                                                                        ticket.estado === 'en_progreso' ? 'dot-estado-en-proceso' :
                                                                                            ticket.estado === 'resuelto' ? 'dot-estado-solucionado' :
                                                                                                ticket.estado === 'escalado' ? 'dot-estado-escalado' :
                                                                                                    'dot-ct-secondary'
                                                                                        }`}
                                                                                ></span>
                                                                                <span className="text-dark dark-theme:text-white">
                                                                                    {ticket.estado}
                                                                                </span>
                                                                            </span>
                                                                            {/* CAMBIO 3: Mensaje de solicitud de reapertura en Gestión de Tickets */}
                                                                            {tieneSolicitudReapertura(ticket) && (
                                                                                <div className="mt-1">
                                                                                    <small className="badge bg-warning text-dark">
                                                                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                                                                        Solicitud de reapertura
                                                                                    </small>
                                                                                </div>
                                                                            )}
                                                                            {/* FIN CAMBIO 3 */}
                                                                        </td>
                                                                        <td className="text-center px-3">
                                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                                <span
                                                                                    className="rounded-circle d-inline-block"
                                                                                    style={{
                                                                                        width: '8px',
                                                                                        height: '8px',
                                                                                        backgroundColor: ticket.prioridad === 'baja' ? '#28a745' :
                                                                                            ticket.prioridad === 'media' ? '#ffc107' :
                                                                                                ticket.prioridad === 'alta' ? '#dc3545' :
                                                                                                    ticket.prioridad === 'critica' ? '#343a40' :
                                                                                                        '#6c757d'
                                                                                    }}
                                                                                ></span>
                                                                                <span className="text-dark dark-theme:text-white">
                                                                                    {ticket.prioridad || 'Normal'}
                                                                                </span>
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-center px-3">
                                                                            {ticket.asignacion_actual && ticket.asignacion_actual.analista ? (
                                                                                <span className="d-flex align-items-center justify-content-center gap-2">
                                                                                    <span
                                                                                        className="rounded-circle d-inline-block"
                                                                                        style={{
                                                                                            width: '8px',
                                                                                            height: '8px',
                                                                                            backgroundColor: '#28a745'
                                                                                        }}
                                                                                    ></span>
                                                                                    <span className="text-dark dark-theme:text-white">
                                                                                        {ticket.asignacion_actual.analista.nombre} {ticket.asignacion_actual.analista.apellido}
                                                                                    </span>
                                                                                </span>
                                                                            ) : (
                                                                                <span className="d-flex align-items-center justify-content-center gap-2">
                                                                                    <span
                                                                                        className="rounded-circle d-inline-block"
                                                                                        style={{
                                                                                            width: '8px',
                                                                                            height: '8px',
                                                                                            backgroundColor: '#6c757d'
                                                                                        }}
                                                                                    ></span>
                                                                                    <span className="text-dark dark-theme:text-white">
                                                                                        Sin asignar
                                                                                    </span>
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="text-center px-3">
                                                                            <span className="d-flex align-items-center justify-content-center gap-2">
                                                                                <span
                                                                                    className="rounded-circle d-inline-block"
                                                                                    style={{
                                                                                        width: '8px',
                                                                                        height: '8px',
                                                                                        backgroundColor: 'var(--ct-info)'
                                                                                    }}
                                                                                ></span>
                                                                                <small className="text-dark dark-theme:text-white">
                                                                                    {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                                        year: 'numeric',
                                                                                        month: 'short',
                                                                                        day: 'numeric',
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit',
                                                                                        hour12: true
                                                                                    })}
                                                                                </small>
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-center px-4">
                                                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                                                {/* Ver detalles */}
                                                                                <button
                                                                                    className="btn btn-sidebar-teal btn-sm"
                                                                                    title="Ver detalles"
                                                                                    onClick={() => changeView(`ticket-${ticket.id}`)}
                                                                                >
                                                                                    <i className="fas fa-eye"></i>
                                                                                </button>

                                                                                {/* Comentarios */}
                                                                                <button
                                                                                    className="btn btn-sidebar-accent btn-sm"
                                                                                    title="Ver y agregar comentarios"
                                                                                    onClick={() => setActiveView(`comentarios-${ticket.id}`)}
                                                                                >
                                                                                    <i className="fas fa-users"></i>
                                                                                </button>

                                                                                {/* Chat */}
                                                                                <button
                                                                                    className="btn btn-sidebar-secondary btn-sm"
                                                                                    title="Chat con analista"
                                                                                    onClick={() => setActiveView(`chat-${ticket.id}`)}
                                                                                >
                                                                                    <i className="fas fa-comments"></i>
                                                                                </button>

                                                                                {/* IA */}
                                                                                <div className="btn-group" role="group">
                                                                                    <button
                                                                                        className="btn btn-sidebar-primary btn-sm dropdown-toggle"
                                                                                        type="button"
                                                                                        data-bs-toggle="dropdown"
                                                                                        aria-expanded="false"
                                                                                        title="Opciones de IA"
                                                                                    >
                                                                                        <i className="fas fa-robot"></i> IA
                                                                                    </button>
                                                                                    <ul className="dropdown-menu">
                                                                                        <li>
                                                                                            <button
                                                                                                className="dropdown-item"
                                                                                                onClick={() => generarRecomendacion(ticket.id)}
                                                                                            >
                                                                                                <i className="fas fa-lightbulb me-2"></i>
                                                                                                Generar Recomendación
                                                                                            </button>
                                                                                        </li>
                                                                                        <li>
                                                                                            <button
                                                                                                className="dropdown-item"
                                                                                                onClick={() => setActiveView(`identificar-${ticket.id}`)}
                                                                                            >
                                                                                                <i className="fas fa-camera me-2"></i>
                                                                                                Analizar Imagen
                                                                                            </button>
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>

                                                                                {/* Sugerencias */}
                                                                                {ticketsConRecomendaciones.has(ticket.id) && (
                                                                                    <button
                                                                                        className="btn btn-sidebar-teal btn-sm"
                                                                                        title="Ver sugerencias disponibles"
                                                                                        onClick={() => window.open(`/ticket/${ticket.id}/recomendaciones-similares`, '_self')}
                                                                                    >
                                                                                        <i className="fas fa-lightbulb"></i>
                                                                                    </button>
                                                                                )}

                                                                                {/* Asignar/Reasignar Analista - Solo mostrar si no está asignado o fue escalado */}
                                                                                {(!ticket.asignacion_actual?.analista || fueEscaladoPorAnalista(ticket)) && (
                                                                                    <div className="btn-group" role="group">
                                                                                        <button
                                                                                            className={`btn btn-sm dropdown-toggle ${fueEscaladoPorAnalista(ticket)
                                                                                                ? 'btn-danger'
                                                                                                : 'btn-sidebar-success'
                                                                                                }`}
                                                                                            type="button"
                                                                                            data-bs-toggle="dropdown"
                                                                                            aria-expanded="false"
                                                                                            title={
                                                                                                fueEscaladoPorAnalista(ticket)
                                                                                                    ? "Ticket escalado - Reasignar analista"
                                                                                                    : "Asignar analista"
                                                                                            }
                                                                                            disabled={!(ticket.estado === 'en_espera' || ticket.estado === 'reabierto')}
                                                                                        >
                                                                                            <i className="fas fa-user-plus"></i>
                                                                                        </button>
                                                                                        <ul className="dropdown-menu">
                                                                                            {analistas.map((analista) => (
                                                                                                <li key={analista.id}>
                                                                                                    <button
                                                                                                        className="dropdown-item"
                                                                                                        onClick={() => asignarTicket(ticket.id, analista.id)}
                                                                                                        disabled={!(ticket.estado === 'en_espera' || ticket.estado === 'reabierto')}
                                                                                                    >
                                                                                                        <i className="fas fa-user me-2"></i>
                                                                                                        {analista.nombre} {analista.apellido}
                                                                                                        {analista.especialidad && (
                                                                                                            <small className="text-muted ms-2">({analista.especialidad})</small>
                                                                                                        )}
                                                                                                    </button>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}

                                                                                {/* CAMBIO 11: Botones según estado del ticket MEJORADO */}
                                                                                {(() => {
                                                                                    const actions = getAvailableActions(ticket);
                                                                                    return (
                                                                                        <>
                                                                                            {/* Mostrar mensaje según estado */}
                                                                                            {actions.showReassignMessage && ticket.estado === 'reabierto' && (
                                                                                                <div className="mt-1">
                                                                                                    <small className="badge bg-success text-white">
                                                                                                        <i className="fas fa-redo me-1"></i>
                                                                                                        Ticket reabierto - Listo para asignar
                                                                                                    </small>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Cerrar ticket - solo si está permitido */}
                                                                                            {actions.canClose && (
                                                                                                <button
                                                                                                    className="btn btn-outline-danger btn-sm"
                                                                                                    title="Cerrar ticket"
                                                                                                    onClick={() => cerrarTicket(ticket.id)}
                                                                                                >
                                                                                                    <i className="fas fa-times"></i>
                                                                                                </button>
                                                                                            )}

                                                                                            {/* Reabrir ticket - solo si tiene solicitud */}
                                                                                            {actions.showReopenButton && (
                                                                                                <button
                                                                                                    className="btn btn-outline-success btn-sm"
                                                                                                    title="Reabrir ticket"
                                                                                                    onClick={() => reabrirTicket(ticket.id)}
                                                                                                >
                                                                                                    <i className="fas fa-redo"></i>
                                                                                                </button>
                                                                                            )}
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                                {/* FIN CAMBIO 11 */}
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-center px-2">
                                                                            <button
                                                                                className="btn btn-outline-secondary btn-sm"
                                                                                style={{
                                                                                    height: '100%',
                                                                                    minHeight: '60px',
                                                                                    width: '40px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center'
                                                                                }}
                                                                                onClick={() => toggleTicketExpansion(ticket.id)}
                                                                                title={isExpanded ? "Colapsar acciones" : "Expandir acciones"}
                                                                            >
                                                                                <i className={`fas ${isExpanded ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                                            </button>
                                                                        </td>
                                                                    </tr>

                                                                    {/* Fila expandida con acciones grandes - solo se muestra si está expandido */}
                                                                    {isExpanded && (
                                                                        <tr>
                                                                            <td colSpan="9" className="px-0 py-0">
                                                                                <div className="w-100 bg-light border-top">
                                                                                    {/* Área de acciones expandida - solo botones */}
                                                                                    <div className="px-4 py-3">
                                                                                        <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                                                            <button
                                                                                                className="btn btn-sidebar-teal flex-fill"
                                                                                                style={{ minWidth: '120px' }}
                                                                                                title="Ver detalles del ticket"
                                                                                                onClick={() => changeView(`ticket-${ticket.id}`)}
                                                                                            >
                                                                                                <i className="fas fa-eye me-2"></i>
                                                                                                Ver Detalles
                                                                                            </button>
                                                                                            <button
                                                                                                className="btn btn-sidebar-accent flex-fill"
                                                                                                style={{ minWidth: '120px' }}
                                                                                                title="Ver y agregar comentarios"
                                                                                                onClick={() => setActiveView(`comentarios-${ticket.id}`)}
                                                                                            >
                                                                                                <i className="fas fa-comments me-2"></i>
                                                                                                Comentarios
                                                                                            </button>
                                                                                            <button
                                                                                                className="btn btn-sidebar-secondary flex-fill"
                                                                                                style={{ minWidth: '120px' }}
                                                                                                title="Chat con analista"
                                                                                                onClick={() => setActiveView(`chat-${ticket.id}`)}
                                                                                            >
                                                                                                <i className="fas fa-comments me-2"></i>
                                                                                                Chat
                                                                                            </button>
                                                                                            <div className="btn-group flex-fill" role="group" style={{ minWidth: '120px' }}>
                                                                                                <button
                                                                                                    className="btn btn-sidebar-primary dropdown-toggle"
                                                                                                    type="button"
                                                                                                    data-bs-toggle="dropdown"
                                                                                                    aria-expanded="false"
                                                                                                    title="Opciones de IA"
                                                                                                >
                                                                                                    <i className="fas fa-robot me-2"></i>
                                                                                                    IA
                                                                                                </button>
                                                                                                <ul className="dropdown-menu">
                                                                                                    <li>
                                                                                                        <button
                                                                                                            className="dropdown-item"
                                                                                                            onClick={() => generarRecomendacion(ticket.id)}
                                                                                                        >
                                                                                                            <i className="fas fa-lightbulb me-2"></i>
                                                                                                            Generar Recomendación
                                                                                                        </button>
                                                                                                    </li>
                                                                                                    <li>
                                                                                                        <button
                                                                                                            className="dropdown-item"
                                                                                                            onClick={() => setActiveView(`identificar-${ticket.id}`)}
                                                                                                        >
                                                                                                            <i className="fas fa-camera me-2"></i>
                                                                                                            Analizar Imagen
                                                                                                        </button>
                                                                                                    </li>
                                                                                                </ul>
                                                                                            </div>
                                                                                            {ticketsConRecomendaciones.has(ticket.id) && (
                                                                                                <button
                                                                                                    className="btn btn-sidebar-teal flex-fill"
                                                                                                    style={{ minWidth: '120px' }}
                                                                                                    title="Ver sugerencias disponibles"
                                                                                                    onClick={() => window.open(`/ticket/${ticket.id}/recomendaciones-similares`, '_self')}
                                                                                                >
                                                                                                    <i className="fas fa-lightbulb me-2"></i>
                                                                                                    Sugerencias
                                                                                                </button>
                                                                                            )}
                                                                                            {/* Asignar/Reasignar Analista - Solo mostrar si no está asignado o fue escalado */}
                                                                                            {(!ticket.asignacion_actual?.analista || fueEscaladoPorAnalista(ticket)) && (
                                                                                                <div className="btn-group flex-fill" role="group" style={{ minWidth: '120px' }}>
                                                                                                    <button
                                                                                                        className={`btn dropdown-toggle ${fueEscaladoPorAnalista(ticket)
                                                                                                            ? 'btn-danger'
                                                                                                            : 'btn-sidebar-success'
                                                                                                            }`}
                                                                                                        type="button"
                                                                                                        data-bs-toggle="dropdown"
                                                                                                        aria-expanded="false"
                                                                                                        title={
                                                                                                            fueEscaladoPorAnalista(ticket)
                                                                                                                ? "Ticket escalado - Reasignar analista"
                                                                                                                : "Asignar analista"
                                                                                                        }
                                                                                                    >
                                                                                                        <i className="fas fa-user-plus me-2"></i>
                                                                                                        {fueEscaladoPorAnalista(ticket)
                                                                                                            ? "Reasignar"
                                                                                                            : "Asignar"}
                                                                                                    </button>
                                                                                                    <ul className="dropdown-menu">
                                                                                                        {analistas.map((analista) => (
                                                                                                            <li key={analista.id}>
                                                                                                                <button
                                                                                                                    className="dropdown-item"
                                                                                                                    onClick={() => asignarTicket(ticket.id, analista.id)}
                                                                                                                >
                                                                                                                    <i className="fas fa-user me-2"></i>
                                                                                                                    {analista.nombre} {analista.apellido}
                                                                                                                    {analista.especialidad && (
                                                                                                                        <small className="text-muted ms-2">({analista.especialidad})</small>
                                                                                                                    )}
                                                                                                                </button>
                                                                                                            </li>
                                                                                                        ))}
                                                                                                    </ul>
                                                                                                </div>
                                                                                            )}
                                                                                            {/* CAMBIO 12: Botones según estado en tabla principal MEJORADO */}
                                                                                            {(() => {
                                                                                                const actions = getAvailableActions(ticket);
                                                                                                return (
                                                                                                    <>
                                                                                                        {/* Mostrar mensaje según estado */}
                                                                                                        {actions.showReassignMessage && ticket.estado === 'reabierto' && (
                                                                                                            <div className="mb-2">
                                                                                                                <small className="badge bg-success text-white">
                                                                                                                    <i className="fas fa-redo me-1"></i>
                                                                                                                    Ticket reabierto - Listo para asignar
                                                                                                                </small>
                                                                                                            </div>
                                                                                                        )}

                                                                                                        {/* Cerrar ticket - solo si está permitido */}
                                                                                                        {actions.canClose && (
                                                                                                            <button
                                                                                                                className="btn btn-outline-danger flex-fill"
                                                                                                                style={{ minWidth: '120px' }}
                                                                                                                title="Cerrar ticket"
                                                                                                                onClick={() => cerrarTicket(ticket.id)}
                                                                                                            >
                                                                                                                <i className="fas fa-times me-2"></i>
                                                                                                                Cerrar
                                                                                                            </button>
                                                                                                        )}

                                                                                                        {/* Reabrir ticket - solo si tiene solicitud */}
                                                                                                        {actions.showReopenButton && (
                                                                                                            <button
                                                                                                                className="btn btn-outline-success flex-fill"
                                                                                                                style={{ minWidth: '120px' }}
                                                                                                                title="Reabrir ticket"
                                                                                                                onClick={() => reabrirTicket(ticket.id)}
                                                                                                            >
                                                                                                                <i className="fas fa-redo me-2"></i>
                                                                                                                Reabrir
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </>
                                                                                                );
                                                                                            })()}
                                                                                            {/* FIN CAMBIO 12 */}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabla de tickets cerrados */}
                            <div className="hyper-widget card border-0 shadow-sm mt-4">
                                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <h5 className="mb-0 me-2">Tickets Cerrados</h5>
                                        {loadingCerrados && (
                                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                <span className="visually-hidden">Actualizando...</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setShowCerrados(!showCerrados)}
                                        title={showCerrados ? "Ocultar tickets cerrados" : "Mostrar tickets cerrados"}
                                    >
                                        <i className={`fas ${showCerrados ? 'fa-eye-slash' : 'fa-eye'} me-1`}></i>
                                        {showCerrados ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                </div>
                                {showCerrados && (
                                    <div className="card-body">
                                        {loadingCerrados ? (
                                            <div className="text-center py-4">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Cargando tickets cerrados...</span>
                                                </div>
                                            </div>
                                        ) : ticketsCerrados.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-muted">No hay tickets cerrados.</p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-center">ID</th>
                                                            <th className="text-center">Cliente</th>
                                                            <th className="text-center">Título</th>
                                                            <th className="text-center">Estado</th>
                                                            <th className="text-center">Prioridad</th>
                                                            <th className="text-center">Analista Asignado</th>
                                                            <th className="text-center">Fecha Cierre</th>
                                                            <th className="text-center">Calificación</th>
                                                            <th className="text-center">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ticketsCerrados.map((ticket) => (
                                                            <tr key={ticket.id}>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <span className="me-2">#{ticket.id}</span>
                                                                        {ticket.url_imagen ? (
                                                                            <img
                                                                                src={ticket.url_imagen}
                                                                                alt="Imagen del ticket"
                                                                                className="img-thumbnail thumbnail-small"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-muted">
                                                                                <i className="fas fa-image icon-tiny"></i>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                                                </td>
                                                                <td>
                                                                    <div>
                                                                        <strong>{ticket.titulo}</strong>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {ticket.descripcion.length > 50
                                                                                ? `${ticket.descripcion.substring(0, 50)}...`
                                                                                : ticket.descripcion
                                                                            }
                                                                        </small>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={getEstadoColor(ticket.estado)}>
                                                                        {ticket.estado === 'cerrado_por_supervisor' ? 'Cerrado por Supervisor' : 'Cerrado por Cliente'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={getPrioridadColor(ticket.prioridad)}>
                                                                        {ticket.prioridad}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {ticket.asignacion_actual?.analista ?
                                                                        `${ticket.asignacion_actual.analista.nombre} ${ticket.asignacion_actual.analista.apellido}` :
                                                                        'Sin asignar'
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {ticket.fecha_cierre ? new Date(ticket.fecha_cierre).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td>
                                                                    {ticket.calificacion ? (
                                                                        <div className="d-flex align-items-center">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <i
                                                                                    key={i}
                                                                                    className={`fas fa-star ${i < ticket.calificacion ? 'text-warning' : 'text-muted'
                                                                                        }`}
                                                                                ></i>
                                                                            ))}
                                                                            {ticket.comentario && (
                                                                                <small className="text-muted ms-2" title={ticket.comentario}>
                                                                                    <i className="fas fa-comment"></i>
                                                                                </small>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">Sin calificar</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <Link
                                                                        to={`/ticket/${ticket.id}/comentarios-cerrado`}
                                                                        className="btn btn-info btn-sm"
                                                                        title="Ver comentarios y recomendaciones (solo lectura)"
                                                                    >
                                                                        <i className="fas fa-comments"></i> Comentarios
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Analistas View */}
                    {activeView === 'analistas' && (
                        <>
                            <h1 className="hyper-page-title">GestiÃ³n de Analistas</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Nombre</th>
                                                    <th>Email</th>
                                                    <th>Especialidad</th>
                                                    <th>Tickets Asignados</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analistas.map((analista) => (
                                                    <tr key={analista.id}>
                                                        <td>#{analista.id}</td>
                                                        <td>{analista.nombre} {analista.apellido}</td>
                                                        <td>{analista.email}</td>
                                                        <td>{analista.especialidad}</td>
                                                        <td>
                                                            <span className="badge bg-primary">
                                                                {tickets.filter(t => t.asignacion_actual && t.asignacion_actual.analista && t.asignacion_actual.analista.id === analista.id).length}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Link
                                                                to={`/ver-analista/${analista.id}`}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Asignaciones View */}
                    {activeView === 'asignaciones' && (
                        <>
                            <h1 className="hyper-page-title">Asignaciones</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ticket</th>
                                                    <th>Analista</th>
                                                    <th>Fecha AsignaciÃ³n</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.filter(t => t.asignacion_actual && t.asignacion_actual.analista).map((ticket) => (
                                                    <tr key={ticket.id}>
                                                        <td>#{ticket.id} - {ticket.titulo}</td>
                                                        <td>{ticket.asignacion_actual.analista.nombre}</td>
                                                        <td>{new Date(ticket.asignacion_actual.fecha_asignacion).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`badge bg-${ticket.estado === 'activo' ? 'warning' : ticket.estado === 'resuelto' ? 'success' : 'danger'}`}>
                                                                {ticket.estado}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => changeView(`ticket-${ticket.id}`)}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Escalaciones View */}
                    {activeView === 'escalaciones' && (
                        <>
                            <h1 className="hyper-page-title">Escalaciones</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>TÃ­tulo</th>
                                                    <th>Prioridad</th>
                                                    <th>Fecha EscalaciÃ³n</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.filter(t => t.estado === 'escalado').map((ticket) => (
                                                    <tr key={ticket.id}>
                                                        <td>#{ticket.id}</td>
                                                        <td>{ticket.titulo}</td>
                                                        <td>
                                                            <span className={`badge bg-${ticket.prioridad === 'baja' ? 'secondary' : ticket.prioridad === 'media' ? 'primary' : ticket.prioridad === 'alta' ? 'warning' : 'danger'}`}>
                                                                {ticket.prioridad}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => changeView(`ticket-${ticket.id}`)}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Reportes View */}
                    {activeView === 'reportes' && (
                        <>
                            <h1 className="hyper-page-title">Reportes</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="text-center py-4">
                                        <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">MÃ³dulo de reportes en desarrollo</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Dashboard de Calidad View */}
                    {activeView === 'dashboard-calidad' && (
                        <DashboardCalidad />
                    )}

                    {/* ConfiguraciÃ³n View */}
                    {activeView === 'configuracion' && (
                        <>
                            <h1 className="hyper-page-title">ConfiguraciÃ³n</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="text-center py-4">
                                        <i className="fas fa-cog fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">MÃ³dulo de configuraciÃ³n en desarrollo</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Vista de Ticket Detallada */}
                    {activeView.startsWith('ticket-') && (
                        <>
                            {console.log('SupervisorPage - Rendering VerTicketHDSupervisor with activeView:', activeView)}
                            <VerTicketHDSupervisor
                                ticketId={parseInt(activeView.split('-')[1])}
                                tickets={tickets}
                                ticketsConRecomendaciones={ticketsConRecomendaciones}
                                analistas={analistas}
                                onBack={() => setActiveView('tickets')}
                            />
                        </>
                    )}

                    {/* Comentarios View */}
                    {activeView.startsWith('comentarios-') && (
                        <ComentariosTicketEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Chat View */}
                    {activeView.startsWith('chat-') && (
                        <ChatAnalistaClienteEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Recomendación IA View */}
                    {activeView.startsWith('recomendacion-') && (
                        <RecomendacionVistaEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Identificar Imagen View */}
                    {activeView.startsWith('identificar-') && (
                        <IdentificarImagenEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {/* Profile View */}
                    {activeView === 'profile' && (
                        <>
                            {console.log('SupervisorPage - Rendering profile view, activeView:', activeView)}
                            <h1 className="hyper-page-title">Mi Perfil</h1>

                            <div className="hyper-widget">
                                <div className="hyper-widget-header">
                                    <h3 className="hyper-widget-title">Información Personal</h3>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label htmlFor="nombre" className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nombre"
                                            name="nombre"
                                            value={infoData.nombre}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu nombre"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="apellido" className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="apellido"
                                            name="apellido"
                                            value={infoData.apellido}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu apellido"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="email" className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={infoData.email}
                                            onChange={handleInfoChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="telefono" className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="telefono"
                                            name="telefono"
                                            value={infoData.telefono}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu teléfono"
                                        />
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setActiveView('dashboard')}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={updateInfo}
                                        disabled={updatingInfo}
                                    >
                                        {updatingInfo ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Actualizando...
                                            </>
                                        ) : (
                                            'Actualizar Información'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Formulario de informaciÃ³n del supervisor */}
                    {showInfoForm && (
                        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Actualizar InformaciÃ³n</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowInfoForm(false)}
                                        ></button>
                                    </div>
                                    <form onSubmit={actualizarInformacion}>
                                        <div className="modal-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Nombre</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={infoData.nombre}
                                                            onChange={(e) => setInfoData({ ...infoData, nombre: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Apellido</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={infoData.apellido}
                                                            onChange={(e) => setInfoData({ ...infoData, apellido: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={infoData.email}
                                                    onChange={(e) => setInfoData({ ...infoData, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Ãrea Responsable</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={infoData.area_responsable}
                                                    onChange={(e) => setInfoData({ ...infoData, area_responsable: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Nueva ContraseÃ±a (opcional)</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={infoData.password}
                                                    onChange={(e) => setInfoData({ ...infoData, password: e.target.value })}
                                                />
                                            </div>
                                            {infoData.password && (
                                                <div className="mb-3">
                                                    <label className="form-label">Confirmar ContraseÃ±a</label>
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        value={infoData.confirmPassword}
                                                        onChange={(e) => setInfoData({ ...infoData, confirmPassword: e.target.value })}
                                                        required={infoData.password}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowInfoForm(false)}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={updatingInfo}
                                            >
                                                {updatingInfo ? 'Actualizando...' : 'Actualizar'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// Oka
