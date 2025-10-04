import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { SideBarCentral } from '../../components/SideBarCentral';
import VerTicketHDAnalista from './verTicketHDanalista';

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

function AnalistaPage() {
    const navigate = useNavigate();
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom, startRealtimeSync, emitCriticalTicketAction, joinCriticalRooms, joinAllCriticalRooms } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [userData, setUserData] = useState(null);
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        especialidad: '',
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
    const [filterPrioridad, setFilterPrioridad] = useState('');

    // Funciones para el nuevo diseño
    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };

    const changeView = (view) => {
        console.log('AnalistaPage - changeView called with:', view);
        console.log('AnalistaPage - Current activeView:', activeView);
        setActiveView(view);
        console.log('AnalistaPage - activeView set to:', view);
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

<<<<<<< HEAD
=======
    // Función helper para actualizar tickets sin recargar la página
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                setTickets(ticketsData);
            }
        } catch (err) {
            console.error('Error al actualizar tickets:', err);
        }
    };

    // Funciones de filtrado y estadísticas
    const getFilteredTickets = () => {
        let filtered = tickets;

        if (filterEstado) {
            filtered = filtered.filter(ticket => ticket.estado === filterEstado);
        }

        if (filterPrioridad) {
            filtered = filtered.filter(ticket => ticket.prioridad === filterPrioridad);
        }

        return filtered;
    };

    const getStats = () => {
        const total = tickets.length;
        const activos = tickets.filter(t => t.estado === 'en_espera' || t.estado === 'activo').length;
        const resueltos = tickets.filter(t => t.estado === 'resuelto' || t.estado === 'solucionado').length;
        const enProgreso = tickets.filter(t => t.estado === 'en_progreso' || t.estado === 'en_proceso').length;

        // Calcular tiempo promedio de resolución
        const ticketsResueltos = tickets.filter(t => t.estado === 'resuelto' || t.estado === 'solucionado');
        let tiempoPromedio = 0;
        if (ticketsResueltos.length > 0) {
            const tiempoTotal = ticketsResueltos.reduce((sum, ticket) => {
                if (ticket.fecha_solucion) {
                    const inicio = new Date(ticket.fecha_creacion);
                    const fin = new Date(ticket.fecha_solucion);
                    return sum + (fin - inicio) / (1000 * 60 * 60); // en horas
                }
                return sum;
            }, 0);
            tiempoPromedio = Math.round(tiempoTotal / ticketsResueltos.length);
        }

        // Calcular eficiencia (porcentaje de tickets resueltos)
        const eficiencia = total > 0 ? Math.round((resueltos / total) * 100) : 0;

        return {
            total,
            activos,
            resueltos,
            enProgreso,
            tiempoPromedio,
            eficiencia
        };
    };

>>>>>>> develop
    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
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
                            especialidad: data.especialidad || '',
                            password: '',
                            confirmPassword: ''
                        });

                        // Actualizar el store global con los datos del usuario
                        dispatch({
                            type: 'SET_USER',
                            payload: data
                        });
                    } else {
                        const errorText = await response.text();
                        console.error('Error al cargar datos del analista:', response.status, errorText);
                    }
                }
            } catch (err) {
                console.error('Error al cargar datos del usuario:', err);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch]);

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

            // Validaciones robustas
            if (!tickets || tickets.length === 0) {
                console.log('âš ï¸ No hay tickets para verificar recomendaciones');
                return;
            }

            if (!token) {
                console.log('âš ï¸ No hay token para verificar recomendaciones');
                return;
            }

            console.log(`ðŸ” Verificando recomendaciones para ${tickets.length} tickets...`);

            const recomendacionesPromises = tickets.map(async (ticket) => {
                try {
                    // Validar que el ticket tenga contenido válido
                    if (!ticket.titulo || !ticket.descripcion || ticket.titulo.trim() === '' || ticket.descripcion.trim() === '') {
                        console.log(`âš ï¸ Ticket ${ticket.id} sin contenido suficiente para recomendaciones`);
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
                        console.log(`âœ… Ticket ${ticket.id}: ${data.total_encontrados} recomendaciones encontradas`);
                        return {
                            ticketId: ticket.id,
                            tieneRecomendaciones,
                            totalRecomendaciones: data.total_encontrados,
                            algoritmo: data.algoritmo || 'legacy'
                        };
                    } else {
                        // Log del error específico pero no fallar
                        console.warn(`âš ï¸ Error ${response.status} verificando recomendaciones para ticket ${ticket.id}`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: `error_${response.status}` };
                    }
                } catch (fetchError) {
                    // Manejar errores individuales sin fallar toda la operación
                    if (fetchError.name === 'AbortError') {
                        console.warn(`â° Timeout verificando recomendaciones para ticket ${ticket.id}`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'timeout' };
                    } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                        console.warn(`ðŸŒ Error de red verificando recomendaciones para ticket ${ticket.id}`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'network_error' };
                    } else {
                        console.warn(`âŒ Error verificando recomendaciones para ticket ${ticket.id}:`, fetchError.message);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'unknown_error' };
                    }
                }
            });

            const resultados = await Promise.all(recomendacionesPromises);

            // Análisis detallado de resultados
            const ticketsConRecomendaciones = resultados.filter(r => r.tieneRecomendaciones);
            const ticketsSinRecomendaciones = resultados.filter(r => !r.tieneRecomendaciones);

            console.log('ðŸ“Š Resultados de recomendaciones:', {
                total: resultados.length,
                conRecomendaciones: ticketsConRecomendaciones.length,
                sinRecomendaciones: ticketsSinRecomendaciones.length,
                detalles: resultados
            });

            // Log específico para tickets sin recomendaciones
            if (ticketsSinRecomendaciones.length > 0) {
                console.log('âš ï¸ Tickets sin recomendaciones:', ticketsSinRecomendaciones.map(t => ({
                    id: t.ticketId,
                    razon: t.razon
                })));
            }

            // Actualizar estado con validaciones robustas
            const ticketsConRecomendacionesSet = new Set();
            resultados.forEach(({ ticketId, tieneRecomendaciones }) => {
                if (tieneRecomendaciones) {
                    ticketsConRecomendacionesSet.add(ticketId);
                }
            });
            setTicketsConRecomendaciones(ticketsConRecomendacionesSet);

            console.log(`✅ Verificación de recomendaciones completada para ${tickets.length} tickets`);
        } catch (error) {
            console.error('âŒ Error general verificando recomendaciones:', error);
            // En caso de error general, limpiar el estado
            setTicketsConRecomendaciones(new Set());
        }
    };

    // Conectar WebSocket cuando el usuario esté autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected && !store.websocket.connecting) {
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
    }, [store.auth.isAuthenticated, store.auth.token, store.websocket.connected, store.websocket.connecting]);

    // Configurar sincronización crítica en tiempo real
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            // Unirse a todas las rooms críticas inmediatamente
            joinAllCriticalRooms(store.websocket.socket, store.auth.user);

            // Configurar sincronización crítica
            const syncConfig = startRealtimeSync({
                syncTypes: ['tickets', 'comentarios', 'asignaciones'],
                onSyncTriggered: (data) => {
                    console.log('🔄 Sincronización crítica activada en AnalistaPage:', data);
                    if (data.type === 'tickets' || data.priority === 'critical') {
                        actualizarTickets();
                    }
                }
            });

            // Unirse a rooms críticos de todos los tickets asignados
            const ticketIds = tickets.map(ticket => ticket.id);
            if (ticketIds.length > 0) {
                joinCriticalRooms(store.websocket.socket, ticketIds, store.auth.user);
            }
        }
    }, [store.auth.user, store.websocket.connected, tickets.length]);

    // Efecto para manejar sincronización manual desde Footer
    useEffect(() => {
        const handleManualSync = (event) => {
            console.log('🔄 Sincronización manual recibida en AnalistaPage:', event.detail);
            if (event.detail.role === 'analista') {
                actualizarTickets();
            }
        };

        window.addEventListener('manualSyncTriggered', handleManualSync);
        return () => window.removeEventListener('manualSyncTriggered', handleManualSync);
    }, []);

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            console.log('🔄 Sincronización total recibida en AnalistaPage:', event.detail);
            if (event.detail.role === 'analista' || event.detail.source === 'footer_sync') {
                // Recargar todos los datos del analista
                actualizarTickets();
                console.log('✅ Datos del analista actualizados por sincronización total');
            }
        };

        const handleSyncCompleted = (event) => {
            console.log('✅ Sincronización total completada en AnalistaPage:', event.detail);
        };

        const handleSyncError = (event) => {
            console.error('❌ Error en sincronización total en AnalistaPage:', event.detail);
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_tickets', handleTotalSync);
        window.addEventListener('refresh_dashboard', handleTotalSync);
        window.addEventListener('sync_tickets', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_tickets', handleTotalSync);
            window.removeEventListener('refresh_dashboard', handleTotalSync);
            window.removeEventListener('sync_tickets', handleTotalSync);
        };
    }, []);

    // Efecto para manejar actualizaciones crÃ­ticas de tickets
    useEffect(() => {
        if (store.websocket.criticalTicketUpdate) {
            const criticalUpdate = store.websocket.criticalTicketUpdate;
            console.log('ðŸš¨ ACTUALIZACIÃ“N CRÃTICA RECIBIDA EN ANALISTA:', criticalUpdate);

            // Actualizar inmediatamente para acciones crÃ­ticas
            if (criticalUpdate.priority === 'critical') {
                actualizarTickets();

                // Mostrar notificaciÃ³n visual si es necesario
                if (criticalUpdate.action === 'comentario_agregado' ||
                    criticalUpdate.action === 'ticket_actualizado' ||
                    criticalUpdate.action === 'ticket_creado') {
                    console.log(`ðŸš¨ AcciÃ³n crÃ­tica: ${criticalUpdate.action} en ticket ${criticalUpdate.ticket_id}`);
                }
            }
        }
    }, [store.websocket.criticalTicketUpdate]);

    // Actualizar tickets cuando lleguen notificaciones WebSocket (optimizado)
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];

            // Manejo especÃ­fico para tickets eliminados - sincronizaciÃ³n inmediata
            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {

                // Remover inmediatamente de la lista de tickets
                if (lastNotification.ticket_id) {
                    setTickets(prev => {
                        const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                        if (ticketRemovido) {
                        }
                        return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                    });
                }
                return; // No continuar con el resto de la lÃ³gica
            }

            // Solo actualizar para eventos relevantes para analistas
            const eventosRelevantes = ['asignado', 'estado_cambiado', 'iniciado', 'escalado', 'ticket_actualizado'];
            if (eventosRelevantes.includes(lastNotification.tipo)) {
                // Para escalaciones, actualizar inmediatamente
                if (lastNotification.tipo === 'escalado' || lastNotification.tipo === 'asignado' || lastNotification.tipo === 'iniciado') {
                    actualizarTickets();
                } else {
                    // Debounce mÃ­nimo para otros eventos
                    const timeoutId = setTimeout(() => {
                        actualizarTickets();
                    }, 500); // 0.5 segundos de debounce mÃ­nimo

                    return () => clearTimeout(timeoutId);
                }
            }
        }
    }, [store.websocket.notifications]);

    // Cargar tickets asignados al analista
    useEffect(() => {
        const cargarTickets = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar tickets');
                }

                const data = await response.json();
                setTickets(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarTickets();
    }, [store.auth.token]);

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
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const agregarComentario = async (ticketId, texto = null) => {
        try {
            const token = store.auth.token;
            let comentarioTexto = texto;
            if (!comentarioTexto) {
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
                comentarioTexto = prompt('Agregar comentario:', existentes ? existentes + '\n' : '');
                if (!comentarioTexto) return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: ticketId,
                    texto: comentarioTexto
                })
            });

            if (!response.ok) {
                throw new Error('Error al agregar comentario');
            }

            // Emitir acciÃ³n crÃ­tica de comentario agregado
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'comentario_agregado', store.auth.user);
            }

            // Actualizar tickets sin recargar la pÃ¡gina
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const verComentarios = async (ticketId) => {
        try {
            const token = store.auth.token;
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                const comentarios = data.map(c => `${c.autor?.rol || 'Sistema'}: ${c.texto}`).join('\n\n');
                alert(`Comentarios del ticket #${ticketId}:\n\n${comentarios || 'No hay comentarios'}`);
            } else {
                throw new Error('Error al cargar comentarios');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const generarRecomendacion = (ticket) => {
        // Redirigir a la vista de recomendación IA
        navigate(`/ticket/${ticket.id}/recomendacion-ia`);
    };

    // Función para iniciar trabajo en un ticket
    const iniciarTrabajo = async (ticketId) => {
        try {
            await cambiarEstadoTicket(ticketId, 'en_proceso');
            console.log(`✅ Trabajo iniciado en ticket ${ticketId}`);
        } catch (err) {
            console.error('Error al iniciar trabajo:', err);
            setError('Error al iniciar trabajo en el ticket');
        }
    };

    // Función para marcar ticket como resuelto
    const marcarComoResuelto = async (ticketId) => {
        try {
            await cambiarEstadoTicket(ticketId, 'solucionado');
            console.log(`✅ Ticket ${ticketId} marcado como resuelto`);
        } catch (err) {
            console.error('Error al marcar como resuelto:', err);
            setError('Error al marcar ticket como resuelto');
        }
    };

    // Función para escalar ticket al supervisor
    const escalarTicket = async (ticketId) => {
        try {
            // La escalación se maneja cambiando el estado a 'en_espera'
            await cambiarEstadoTicket(ticketId, 'en_espera');

            // Emitir acción crítica de escalación
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'escalado', store.auth.user);
            }

            console.log(`🚨 Ticket ${ticketId} escalado al supervisor`);
        } catch (err) {
            console.error('Error al escalar ticket:', err);
            setError('Error al escalar ticket al supervisor');
        }
    };

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const updateInfo = async () => {
        try {
            // Validar contraseñas si se proporcionan
            if (infoData.password && infoData.password !== infoData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }

            if (infoData.password && infoData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
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
                especialidad: infoData.especialidad
            };

            // Solo incluir contraseña si se proporciona
            if (infoData.password) {
                updateData.password = infoData.password;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar información');
            }

            // Actualizar los datos locales
            setUserData(prev => ({
                ...prev,
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                especialidad: infoData.especialidad
            }));

            alert('Información actualizada exitosamente');
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

<<<<<<< HEAD
    // Feedback visual para actualización de tickets
    const [feedback, setFeedback] = useState("");
    const actualizarTickets = async () => {
        try {
            setLoading(true);
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Error al cargar tickets');
            const data = await response.json();
            setTickets(data);
            setFeedback("Lista actualizada correctamente");
            setTimeout(() => setFeedback(""), 2000);
        } catch (err) {
            setError(err.message);
            setFeedback("Error al actualizar la lista");
            setTimeout(() => setFeedback(""), 2000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-end mb-3">
            </div>
            {/* Header con información del analista */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">
                                    Bienvenido, {userData?.nombre === 'Pendiente' ? 'Analista' : userData?.nombre} {userData?.apellido === 'Pendiente' ? '' : userData?.apellido}
                                </h2>
                                <p className="text-muted mb-0">Panel de Analista - Gestión de Tickets</p>
                                <div className="mt-2">
                                    <span className="badge bg-success">
                                        <i className="fas fa-wifi me-1"></i>
                                        Conectado
                                    </span>
                                </div>
                                {userData?.especialidad && userData.especialidad !== 'Pendiente' && (
                                    <div className="mt-2">
                                        <small className="text-info d-flex align-items-center">
                                            <i className="fas fa-cog me-1"></i>
                                            <span className="fw-bold">Especialidad:</span>
                                            <span className="ms-1">{userData.especialidad}</span>
                                        </small>
                                    </div>
=======
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
                                        title="Limpiar búsqueda"
                                    >
                                        <i className="fas fa-times text-muted"></i>
                                    </button>
>>>>>>> develop
                                )}

                                {/* Resultados de búsqueda */}
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
                                                        {ticket.estado} • {ticket.prioridad}
                                                    </small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {/* Dropdown del usuario */}
                            <div className="position-relative">
                                <button
                                    className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                >
<<<<<<< HEAD
                                    <i className="fas fa-user-edit me-1"></i>
                                    {showInfoForm ? 'Ocultar Información' : 'Actualizar Información'}
                                </button>
                                <Link to="/analistas" className="btn btn-primary">Ir al CRUD</Link>
                                <Link to="/analista/ranking" className="btn btn-warning">
                                    <i className="fas fa-chart-bar me-1"></i>
                                    Rankings
                                </Link>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={logout}
                                >
                                    Cerrar Sesión
=======
                                    <div className="hyper-user-avatar bg-primary d-flex align-items-center justify-content-center rounded-circle avatar-small">
                                        <i className="fas fa-user-cog text-white icon-small"></i>
                                    </div>
                                    <span className="fw-semibold">
                                        {userData?.nombre === 'Pendiente' ? 'Analista' : userData?.nombre}
                                    </span>
                                    <i className="fas fa-chevron-down"></i>
>>>>>>> develop
                                </button>

                                {showUserDropdown && (
                                    <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width">
                                        <div className="p-3 border-bottom">
                                            <div className="fw-semibold">
                                                {userData?.nombre === 'Pendiente' ? 'Analista' : userData?.nombre}
                                            </div>
                                            <small className="text-muted">Analista</small>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                onClick={() => {
                                                    console.log('AnalistaPage - Mi Perfil button clicked');
                                                    changeView('profile');
                                                    setShowUserDropdown(false);
                                                    console.log('AnalistaPage - Dropdown closed, view changed to profile');
                                                }}
                                            >
                                                <i className="fas fa-user-edit"></i>
                                                Mi Perfil
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
                                                className="btn btn-link w-100 text-start text-danger d-flex align-items-center gap-2"
                                                onClick={logout}
                                            >
                                                <i className="fas fa-sign-out-alt"></i>
                                                Cerrar Sesion
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
                            <h1 className="hyper-page-title">Dashboard Analista</h1>

                            {/* Métricas principales */}
                            <div className="row mb-4 g-3">
                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Mis Tickets</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-primary me-2">{stats.total}</h3>
                                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-ticket-alt text-primary"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Total asignados</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">En Progreso</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-warning me-2">{stats.enProgreso}</h3>
                                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-clock text-warning"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Trabajando</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Resueltos</h6>
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
                                                <h6 className="card-title text-muted mb-2">Pendientes</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-info me-2">{stats.activos}</h3>
                                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-hourglass-half text-info"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Esperando</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-2 col-lg-3 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Tiempo Promedio</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-secondary me-2">
                                                        {stats.tiempoPromedio ? `${stats.tiempoPromedio}h` : '0h'}
                                                    </h3>
                                                    <div className="bg-secondary bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-stopwatch text-secondary"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Por ticket</small>
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
                                                    <h3 className="mb-0 text-success me-2">
                                                        {stats.eficiencia ? `${stats.eficiencia}%` : '0%'}
                                                    </h3>
                                                    <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-chart-line text-success"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Rendimiento</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tickets Recientes */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm">
                                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                            <h5 className="card-title mb-0">Mis Tickets Recientes</h5>
                                            <button
                                                className="btn btn-sidebar-primary btn-sm"
                                                onClick={() => changeView('tickets')}
                                            >
                                                <i className="fas fa-list me-1"></i>
                                                Ver Todos Mis Tickets
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
                                                                <th className="text-center">Prioridad</th>
                                                                <th className="text-center">Cliente</th>
                                                                <th className="text-center">Fecha y Hora</th>
                                                                <th className="text-center">Acciones</th>
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
                                                                                className={`rounded-circle d-inline-block ${ticket.estado === 'solucionado' ? 'dot-estado-solucionado' :
                                                                                    ticket.estado === 'en_proceso' ? 'dot-estado-en-proceso' :
                                                                                        ticket.estado === 'en_espera' ? 'dot-estado-en-espera' :
                                                                                            ticket.estado === 'escalado' ? 'dot-estado-escalado' : 'dot-ct-secondary'
                                                                                    }`}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.estado}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className={`rounded-circle d-inline-block ${ticket.prioridad === 'critica' ? 'dot-prioridad-critica' :
                                                                                    ticket.prioridad === 'alta' ? 'dot-prioridad-alta' :
                                                                                        ticket.prioridad === 'media' ? 'dot-prioridad-media' :
                                                                                            ticket.prioridad === 'baja' ? 'dot-prioridad-baja' : 'dot-ct-secondary'
                                                                                    }`}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.prioridad || 'Normal'}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block dot-ct-teal"
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block dot-ct-orange"
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            className="btn btn-sidebar-teal btn-sm"
                                                                            title="Ver detalles"
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
                                            ) : (
                                                <div className="text-center py-4">
                                                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                    <p className="text-muted">No tienes tickets asignados</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h1 className="hyper-page-title">Mis Tickets</h1>
                                <div className="d-flex gap-2">
                                    <div className="position-relative">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                        >
                                            <i className="fas fa-filter me-2"></i>
                                            Filtrar
                                        </button>
                                        {showFilterDropdown && (
                                            <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg p-3" style={{ minWidth: '250px', zIndex: 1000 }}>
                                                <div className="mb-3">
                                                    <label className="form-label small">Estado</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={filterEstado}
                                                        onChange={(e) => setFilterEstado(e.target.value)}
                                                    >
                                                        <option value="">Todos</option>
                                                        <option value="activo">Activo</option>
                                                        <option value="en_progreso">En Progreso</option>
                                                        <option value="resuelto">Resuelto</option>
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small">Prioridad</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={filterPrioridad}
                                                        onChange={(e) => setFilterPrioridad(e.target.value)}
                                                    >
                                                        <option value="">Todas</option>
                                                        <option value="baja">Baja</option>
                                                        <option value="media">Media</option>
                                                        <option value="alta">Alta</option>
                                                        <option value="critica">Crítica</option>
                                                    </select>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary w-100"
                                                    onClick={() => {
                                                        setFilterEstado('');
                                                        setFilterPrioridad('');
                                                    }}
                                                >
                                                    Limpiar Filtros
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="text-center">ID</th>
                                                    <th className="text-center">Título</th>
                                                    <th className="text-center">Estado</th>
                                                    <th className="text-center">Prioridad</th>
                                                    <th className="text-center">Cliente</th>
                                                    <th className="text-center">Fecha</th>
                                                    <th className="text-center">Acciones</th>
                                                    <th className="text-center px-2" style={{ width: '50px' }}>Expandir</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTickets.map((ticket) => {
                                                    const isExpanded = expandedTickets.has(ticket.id);
                                                    return (
                                                        <React.Fragment key={ticket.id}>
                                                            <tr>
                                                                <td>
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
                                                                <td>
                                                                    <div className="text-center">
                                                                        <div className="fw-semibold text-dark dark-theme:text-white">{ticket.titulo}</div>
                                                                        <small className="text-muted">{ticket.descripcion}</small>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block"
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    backgroundColor: ticket.estado === 'activo' ? 'var(--ct-warning)' :
                                                                                        ticket.estado === 'en_progreso' ? 'var(--ct-info)' : 'var(--ct-success)'
                                                                                }}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.estado}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="text-center">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block"
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    backgroundColor: ticket.prioridad === 'baja' ? 'var(--ct-secondary)' :
                                                                                        ticket.prioridad === 'media' ? 'var(--ct-blue)' :
                                                                                            ticket.prioridad === 'alta' ? 'var(--ct-warning)' : 'var(--ct-danger)'
                                                                                }}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.prioridad}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="text-center">
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
                                                                                {ticket.cliente?.nombre || 'N/A'}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="text-center">
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
                                                                                {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                                            </span>
                                                                        </span>
                                                                    </div>
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
                                                                            onClick={() => window.open(`/ticket/${ticket.id}/comentarios`, '_self')}
                                                                        >
                                                                            <i className="fas fa-comment-dots"></i>
                                                                        </button>

                                                                        {/* Chat con cliente */}
                                                                        <button
                                                                            className="btn btn-sidebar-secondary btn-sm"
                                                                            title="Chat con cliente"
                                                                            onClick={() => window.open(`/ticket/${ticket.id}/chat-analista-cliente`, '_self')}
                                                                        >
                                                                            <i className="fas fa-comments"></i>
                                                                        </button>

                                                                        {/* Chat con supervisor */}
                                                                        <button
                                                                            className="btn btn-sidebar-primary btn-sm"
                                                                            title="Chat con supervisor"
                                                                            onClick={() => window.open(`/ticket/${ticket.id}/chat-supervisor-analista`, '_self')}
                                                                        >
                                                                            <i className="fas fa-user-tie"></i>
                                                                        </button>

                                                                        {/* Escalar ticket */}
                                                                        <button
                                                                            className="btn btn-sidebar-warning btn-sm"
                                                                            title="Escalar al supervisor"
                                                                            onClick={() => escalarTicket(ticket.id)}
                                                                        >
                                                                            <i className="fas fa-arrow-up"></i>
                                                                        </button>

                                                                        {/* Iniciar trabajo - solo si está en espera */}
                                                                        {ticket.estado === 'en_espera' && (
                                                                            <button
                                                                                className="btn btn-sidebar-success btn-sm"
                                                                                title="Iniciar trabajo"
                                                                                onClick={() => iniciarTrabajo(ticket.id)}
                                                                            >
                                                                                <i className="fas fa-play"></i>
                                                                            </button>
                                                                        )}

                                                                        {/* Marcar como resuelto - solo si está en proceso */}
                                                                        {ticket.estado === 'en_proceso' && (
                                                                            <button
                                                                                className="btn btn-outline-success btn-sm"
                                                                                title="Marcar como resuelto"
                                                                                onClick={() => marcarComoResuelto(ticket.id)}
                                                                            >
                                                                                <i className="fas fa-check"></i>
                                                                            </button>
                                                                        )}
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
                                                                    <td colSpan="8" className="px-0 py-0">
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
                                                                                        onClick={() => window.open(`/ticket/${ticket.id}/comentarios`, '_self')}
                                                                                    >
                                                                                        <i className="fas fa-comment-dots me-2"></i>
                                                                                        Comentarios
                                                                                    </button>

                                                                                    <button
                                                                                        className="btn btn-sidebar-secondary flex-fill"
                                                                                        style={{ minWidth: '120px' }}
                                                                                        title="Chat con cliente"
                                                                                        onClick={() => window.open(`/ticket/${ticket.id}/chat-analista-cliente`, '_self')}
                                                                                    >
                                                                                        <i className="fas fa-comments me-2"></i>
                                                                                        Chat Cliente
                                                                                    </button>

                                                                                    <button
                                                                                        className="btn btn-sidebar-primary flex-fill"
                                                                                        style={{ minWidth: '120px' }}
                                                                                        title="Chat con supervisor"
                                                                                        onClick={() => window.open(`/ticket/${ticket.id}/chat-supervisor-analista`, '_self')}
                                                                                    >
                                                                                        <i className="fas fa-user-tie me-2"></i>
                                                                                        Chat Supervisor
                                                                                    </button>

                                                                                    <button
                                                                                        className="btn btn-sidebar-warning flex-fill"
                                                                                        style={{ minWidth: '120px' }}
                                                                                        title="Escalar al supervisor"
                                                                                        onClick={() => escalarTicket(ticket.id)}
                                                                                    >
                                                                                        <i className="fas fa-arrow-up me-2"></i>
                                                                                        Escalar
                                                                                    </button>

                                                                                    {/* Botón condicional - Iniciar o Resolver */}
                                                                                    {ticket.estado === 'en_espera' && (
                                                                                        <button
                                                                                            className="btn btn-sidebar-success flex-fill"
                                                                                            style={{ minWidth: '120px' }}
                                                                                            title="Iniciar trabajo"
                                                                                            onClick={() => iniciarTrabajo(ticket.id)}
                                                                                        >
                                                                                            <i className="fas fa-play me-2"></i>
                                                                                            Iniciar
                                                                                        </button>
                                                                                    )}

                                                                                    {ticket.estado === 'en_proceso' && (
                                                                                        <button
                                                                                            className="btn btn-outline-success flex-fill"
                                                                                            style={{ minWidth: '120px' }}
                                                                                            title="Marcar como resuelto"
                                                                                            onClick={() => marcarComoResuelto(ticket.id)}
                                                                                        >
                                                                                            <i className="fas fa-check me-2"></i>
                                                                                            Resolver
                                                                                        </button>
                                                                                    )}
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
                                </div>
                            </div>
                        </>
                    )}

                    {/* Resueltos View */}
                    {activeView === 'resueltos' && (
                        <>
                            <h1 className="hyper-page-title">Tickets Resueltos</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Título</th>
                                                    <th>Cliente</th>
                                                    <th>Fecha Resolución</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tickets.filter(t => t.estado === 'resuelto').map((ticket) => (
                                                    <tr key={ticket.id}>
                                                        <td>#{ticket.id}</td>
                                                        <td>{ticket.titulo}</td>
                                                        <td>
                                                            <span className="badge bg-info">
                                                                {ticket.cliente?.nombre || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(ticket.fecha_actualizacion).toLocaleDateString()}</td>
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

                    {/* Estadísticas View */}
                    {activeView === 'estadisticas' && (
                        <>
                            <h1 className="hyper-page-title">Mis Estadísticas</h1>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="hyper-widget card border-0 shadow-sm">
                                        <div className="hyper-widget-header card-header bg-white border-bottom">
                                            <h3 className="hyper-widget-title mb-0">Resumen de Actividad</h3>
                                        </div>
                                        <div className="hyper-widget-body card-body">
                                            <div className="text-center py-4">
                                                <i className="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                                                <p className="text-muted">Estadísticas detalladas en desarrollo</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="hyper-widget card border-0 shadow-sm">
                                        <div className="hyper-widget-header card-header bg-white border-bottom">
                                            <h3 className="hyper-widget-title mb-0">Rendimiento</h3>
                                        </div>
                                        <div className="hyper-widget-body card-body">
                                            <div className="text-center py-4">
                                                <i className="fas fa-trophy fa-3x text-muted mb-3"></i>
                                                <p className="text-muted">Métricas de rendimiento en desarrollo</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Profile View */}
                    {activeView === 'profile' && (
                        <>
                            {console.log('AnalistaPage - Rendering profile view, activeView:', activeView)}
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

<<<<<<< HEAD
            {/* Lista de tickets asignados */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div>
                                <h5 className="mb-0">Mis Tickets Asignados</h5>
                                {feedback && (
                                    <div className="alert alert-info py-1 px-3 mb-0 mt-2" style={{ display: 'inline-block', fontSize: '0.95em' }} role="alert">
                                        {feedback}
                                    </div>
                                )}
                            </div>
                            <button className="btn btn-primary" onClick={actualizarTickets}>
                                <i className="fas fa-refresh"></i> Actualizar Lista
                            </button>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando tickets...</span>
=======
                    {/* Formulario de informaciÃ³n del analista */}
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
>>>>>>> develop
                                    </div>
                                    <form onSubmit={updateInfo}>
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
                                                <label className="form-label">Especialidad</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={infoData.especialidad}
                                                    onChange={(e) => setInfoData({ ...infoData, especialidad: e.target.value })}
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

                    {/* Vista de Ticket Detallada */}
                    {activeView.startsWith('ticket-') && (
                        <VerTicketHDAnalista
                            ticketId={parseInt(activeView.split('-')[1])}
                            tickets={tickets}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// CAMBIO ANALISTA 1: Sistema de sincronización mejorado para eventos críticos
// (Agregado al final del componente para no interferir con la lógica existente)
const useAnalistaSyncEffects = () => {
    useEffect(() => {
        const handleForceUpdate = (event) => {
            console.log('🔄 ANALISTA - FORZAR ACTUALIZACIÓN:', event.detail);
            // Trigger update through global state or custom event
            window.dispatchEvent(new CustomEvent('analistaForceUpdate'));
        };

        const handleSyncAnalista = (event) => {
            console.log('👨‍💻 ANALISTA - SINCRONIZACIÓN ESPECÍFICA:', event.detail);
            window.dispatchEvent(new CustomEvent('analistaForceUpdate'));
        };

        const handleSyncTickets = (event) => {
            console.log('🎫 ANALISTA - SINCRONIZACIÓN TICKETS:', event.detail);
            window.dispatchEvent(new CustomEvent('analistaForceUpdate'));
        };

        const handleSyncError = (event) => {
            console.error('❌ ANALISTA - ERROR DE SINCRONIZACIÓN:', event.detail);
            // Intentar actualizar de todas formas
            window.dispatchEvent(new CustomEvent('analistaForceUpdate'));
        };

        // Agregar listeners para eventos del Footer (fallback HTTP)
        window.addEventListener('forceUpdateAllViews', handleForceUpdate);
        window.addEventListener('sync_analista', handleSyncAnalista);
        window.addEventListener('sync_tickets', handleSyncTickets);
        window.addEventListener('syncError', handleSyncError);

        // Cleanup
        return () => {
            window.removeEventListener('forceUpdateAllViews', handleForceUpdate);
            window.removeEventListener('sync_analista', handleSyncAnalista);
            window.removeEventListener('sync_tickets', handleSyncTickets);
            window.removeEventListener('syncError', handleSyncError);
        };
    }, []);
};
// FIN CAMBIO ANALISTA 1
