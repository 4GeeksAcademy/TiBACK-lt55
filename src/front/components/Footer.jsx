import { useState, useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Footer = () => {
	const { store, getRealtimeStatus, startRealtimeSync, joinAllCriticalRooms, connectWebSocket } = useGlobalReducer();
	const [showDetails, setShowDetails] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [sidebarState, setSidebarState] = useState({ collapsed: false, hidden: false, exists: false });

	const realtimeStatus = getRealtimeStatus();
	const { isAuthenticated } = store.auth;

	// Debug: Monitorear cambios en el estado de autenticación
	useEffect(() => {
		console.log('🔍 Footer - Estado de autenticación actualizado:', {
			isAuthenticated: store.auth.isAuthenticated,
			hasUser: !!store.auth.user,
			hasToken: !!store.auth.token,
			userRole: store.auth.user?.role,
			userId: store.auth.user?.id
		});
	}, [store.auth.isAuthenticated, store.auth.user, store.auth.token]);

	// Detectar estado del sidebar
	useEffect(() => {
		const checkSidebar = () => {
			const sidebar = document.querySelector('.hyper-sidebar');
			const layout = document.querySelector('.hyper-layout');

			if (sidebar && layout) {
				const isCollapsed = sidebar.classList.contains('collapsed');
				const isHidden = sidebar.classList.contains('hidden');
				setSidebarState({ collapsed: isCollapsed, hidden: isHidden, exists: true });
			} else {
				setSidebarState({ collapsed: false, hidden: false, exists: false });
			}
		};

		// Verificar inmediatamente
		checkSidebar();

		// Observar cambios en el DOM
		const observer = new MutationObserver(checkSidebar);
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class']
		});

		return () => observer.disconnect();
	}, []);

	const handleManualSync = async () => {
		if (isSyncing) {
			console.log('⏳ Sincronización ya en progreso...');
			return;
		}

		try {
			setIsSyncing(true);
			console.log('🔄 Iniciando SINCRONIZACIÓN TOTAL desde Footer...');

			// Debug: Verificar estado de autenticación
			console.log('🔍 Estado de autenticación:', {
				isAuthenticated: store.auth.isAuthenticated,
				hasUser: !!store.auth.user,
				hasToken: !!store.auth.token,
				userRole: store.auth.user?.role,
				userId: store.auth.user?.id
			});

			// Verificar que tenemos los datos necesarios
			if (!store.auth.isAuthenticated || !store.auth.token) {
				console.warn('⚠️ No hay usuario autenticado para sincronizar');
				return;
			}

			// Obtener datos del usuario
			let userData = store.auth.user;
			if (!userData && store.auth.token) {
				try {
					const tokenPayload = JSON.parse(atob(store.auth.token.split('.')[1]));
					userData = {
						id: tokenPayload.user_id,
						role: tokenPayload.role,
						email: tokenPayload.email
					};
					console.log('✅ Datos de usuario obtenidos del token:', userData);
				} catch (error) {
					console.error('❌ Error decodificando token:', error);
					return;
				}
			}

			// PASO 1: Reconectar WebSocket si está desconectado
			if (!store.websocket.connected || !store.websocket.socket) {
				console.log('🔌 Reconectando WebSocket...');
				const socket = connectWebSocket(store.auth.token);
				if (socket) {
					// CAMBIO 7: Mejora de reconexión WebSocket con fallback
					// Esperar un momento para que se establezca la conexión
					await new Promise(resolve => setTimeout(resolve, 1500));

					// Verificar si la conexión fue exitosa
					if (!store.websocket.connected) {
						console.warn('⚠️ WebSocket no se pudo conectar, usando modo offline');
						// Continuar con sincronización HTTP como fallback
					}
					// FIN CAMBIO 7
				}
			}

			// PASO 2: Unirse a TODAS las rooms críticas
			if (store.websocket.connected && store.websocket.socket) {
				console.log('🚨 Uniéndose a TODAS las rooms críticas...');
				joinAllCriticalRooms(store.websocket.socket, userData);

				// Unirse a rooms específicas por rol
				if (userData.role === 'administrador') {
					// Administrador se une a todas las rooms
					store.websocket.socket.emit('join_critical_rooms', {
						role: userData.role,
						user_id: userData.id,
						critical_rooms: [
							'global_tickets', 'global_chats', 'critical_updates',
							'admin_tickets', 'admin_users', 'admin_system'
						]
					});
				} else if (userData.role === 'supervisor') {
					store.websocket.socket.emit('join_critical_rooms', {
						role: userData.role,
						user_id: userData.id,
						critical_rooms: [
							'supervisor_tickets', 'supervisor_analistas', 'supervisor_chats'
						]
					});
				} else if (userData.role === 'analista') {
					store.websocket.socket.emit('join_critical_rooms', {
						role: userData.role,
						user_id: userData.id,
						critical_rooms: [
							'analista_tickets', 'analista_chats'
						]
					});
				} else if (userData.role === 'cliente') {
					store.websocket.socket.emit('join_critical_rooms', {
						role: userData.role,
						user_id: userData.id,
						critical_rooms: [
							'cliente_tickets', 'cliente_chats'
						]
					});
				}
			}

			// PASO 3: Configurar sincronización TOTAL con todos los tipos
			const allSyncTypes = [
				'tickets', 'comentarios', 'asignaciones', 'usuarios',
				'gestiones', 'chats', 'notificaciones', 'estadisticas'
			];

			// CAMBIO 8: Sincronización HTTP como fallback
			// Si WebSocket no está disponible, usar sincronización HTTP
			if (!store.websocket.connected) {
				console.log('📡 Iniciando sincronización HTTP como fallback...');
				await performHttpSync(userData);
			}
			// FIN CAMBIO 8

			const syncConfig = startRealtimeSync({
				syncTypes: allSyncTypes,
				syncInterval: 5000, // Sincronización más frecuente
				enablePolling: true,
				onSyncTriggered: (data) => {
					console.log('✅ SINCRONIZACIÓN TOTAL activada:', data);

					// Emitir evento personalizado para TODAS las vistas
					window.dispatchEvent(new CustomEvent('totalSyncTriggered', {
						detail: {
							type: data.type,
							source: data.source,
							role: userData.role,
							userId: userData.id,
							timestamp: new Date().toISOString(),
							priority: 'critical'
						}
					}));

					// Emitir evento específico por tipo
					window.dispatchEvent(new CustomEvent(`sync_${data.type}`, {
						detail: {
							...data,
							role: userData.role,
							userId: userData.id,
							timestamp: new Date().toISOString()
						}
					}));
				},
				onSyncRequested: (data) => {
					console.log('📡 Solicitud de sincronización TOTAL enviada:', data);
				}
			});

			// PASO 4: Inicializar y ejecutar sincronización
			if (syncConfig && syncConfig.initializeSync) {
				syncConfig.initializeSync();
			}

			if (syncConfig && syncConfig.triggerSync) {
				// Ejecutar múltiples sincronizaciones para asegurar cobertura total
				syncConfig.triggerSync('manual_total');
				syncConfig.triggerSync('critical');
				syncConfig.triggerSync('full_refresh');
			}

			// PASO 5: Solicitar sincronización desde el servidor
			if (store.websocket.connected && store.websocket.socket) {
				console.log('📡 Solicitando sincronización total desde servidor...');
				store.websocket.socket.emit('request_sync', {
					role: userData.role,
					user_id: userData.id,
					sync_type: 'total',
					include_all: true,
					timestamp: new Date().toISOString()
				});
			}

			// PASO 6: Forzar actualización de todas las vistas activas
			console.log('🔄 Forzando actualización de todas las vistas...');

			// Emitir eventos para cada tipo de vista
			const viewEvents = [
				'refresh_tickets', 'refresh_comentarios', 'refresh_asignaciones',
				'refresh_usuarios', 'refresh_gestiones', 'refresh_chats',
				'refresh_estadisticas', 'refresh_dashboard'
			];

			viewEvents.forEach(eventType => {
				window.dispatchEvent(new CustomEvent(eventType, {
					detail: {
						role: userData.role,
						userId: userData.id,
						timestamp: new Date().toISOString(),
						source: 'footer_sync'
					}
				}));
			});

			// PASO 7: Limpiar cache y forzar recarga de datos críticos
			console.log('🧹 Limpiando cache y forzando recarga...');

			// Limpiar localStorage de datos obsoletos
			const keysToClean = ['tickets_cache', 'comentarios_cache', 'asignaciones_cache'];
			keysToClean.forEach(key => {
				if (localStorage.getItem(key)) {
					localStorage.removeItem(key);
					console.log(`🗑️ Cache limpiado: ${key}`);
				}
			});

			console.log('✅ SINCRONIZACIÓN TOTAL completada desde Footer');

			// Mostrar notificación de éxito
			window.dispatchEvent(new CustomEvent('sync_completed', {
				detail: {
					type: 'success',
					message: 'Sincronización total completada exitosamente',
					timestamp: new Date().toISOString()
				}
			}));

		} catch (error) {
			console.error('❌ Error en sincronización total desde Footer:', error);

			// Mostrar notificación de error
			window.dispatchEvent(new CustomEvent('sync_error', {
				detail: {
					type: 'error',
					message: 'Error en sincronización total',
					error: error.message,
					timestamp: new Date().toISOString()
				}
			}));
		} finally {
			setIsSyncing(false);
		}
	};

	// CAMBIO 9: Función de sincronización HTTP como fallback MEJORADA
	const performHttpSync = async (userData) => {
		try {
			console.log('🔄 SINCRONIZACIÓN CRÍTICA HTTP para:', userData.role);

			// 1. Forzar actualización inmediata de todas las vistas
			const forceUpdateEvent = new CustomEvent('forceUpdateAllViews', {
				detail: {
					role: userData.role,
					userId: userData.id,
					timestamp: new Date().toISOString(),
					source: 'footer_critical_sync',
					priority: 'CRITICAL'
				}
			});
			window.dispatchEvent(forceUpdateEvent);

			// 2. Emitir sincronización específica por rol
			const roleSpecificSync = new CustomEvent(`sync_${userData.role}`, {
				detail: {
					userId: userData.id,
					timestamp: new Date().toISOString(),
					source: 'footer_critical_sync',
					action: 'FORCE_REFRESH_ALL'
				}
			});
			window.dispatchEvent(roleSpecificSync);

			// 3. Emitir evento de sincronización manual para todas las vistas
			const syncEvent = new CustomEvent('manualSyncTriggered', {
				detail: {
					role: userData.role,
					userId: userData.id,
					timestamp: new Date().toISOString(),
					source: 'footer_critical_sync',
					priority: 'HIGH'
				}
			});
			window.dispatchEvent(syncEvent);

			// 4. Emitir evento de sincronización total
			const totalSyncEvent = new CustomEvent('totalSyncTriggered', {
				detail: {
					type: 'success',
					message: 'Sincronización HTTP CRÍTICA completada exitosamente',
					timestamp: new Date().toISOString(),
					source: 'footer_critical_sync',
					priority: 'CRITICAL'
				}
			});
			window.dispatchEvent(totalSyncEvent);

			// 5. Emitir eventos específicos para cada tipo de dato
			const dataTypes = ['tickets', 'comentarios', 'asignaciones', 'chats', 'notificaciones'];
			dataTypes.forEach(dataType => {
				const dataEvent = new CustomEvent(`sync_${dataType}`, {
					detail: {
						role: userData.role,
						userId: userData.id,
						timestamp: new Date().toISOString(),
						source: 'footer_critical_sync',
						dataType: dataType
					}
				});
				window.dispatchEvent(dataEvent);
			});

			// 6. Emitir eventos específicos para acciones de tickets
			const ticketActions = [
				'ticket_created', 'ticket_updated', 'ticket_estado_changed',
				'ticket_asignado', 'ticket_escalado', 'ticket_solucionado',
				'ticket_cerrado', 'ticket_reabierto', 'solicitud_reapertura',
				'reapertura_aprobada', 'nuevo_comentario', 'nuevo_mensaje_chat'
			];
			ticketActions.forEach(action => {
				const actionEvent = new CustomEvent(`sync_${action}`, {
					detail: {
						role: userData.role,
						userId: userData.id,
						timestamp: new Date().toISOString(),
						source: 'footer_critical_sync',
						action: action,
						priority: 'HIGH'
					}
				});
				window.dispatchEvent(actionEvent);
			});

			// 7. Emitir eventos de sincronización por rol específico
			const roleEvents = {
				'cliente': ['sync_cliente_tickets', 'sync_cliente_chats', 'sync_cliente_comentarios'],
				'analista': ['sync_analista_tickets', 'sync_analista_chats', 'sync_analista_asignaciones'],
				'supervisor': ['sync_supervisor_tickets', 'sync_supervisor_analistas', 'sync_supervisor_chats'],
				'administrador': ['sync_admin_tickets', 'sync_admin_users', 'sync_admin_system']
			};

			if (roleEvents[userData.role]) {
				roleEvents[userData.role].forEach(eventName => {
					const roleEvent = new CustomEvent(eventName, {
						detail: {
							role: userData.role,
							userId: userData.id,
							timestamp: new Date().toISOString(),
							source: 'footer_critical_sync',
							priority: 'CRITICAL'
						}
					});
					window.dispatchEvent(roleEvent);
				});
			}

			console.log('✅ SINCRONIZACIÓN HTTP CRÍTICA COMPLETADA - Todos los eventos emitidos');
		} catch (error) {
			console.error('❌ Error en sincronización HTTP CRÍTICA:', error);

			// Emitir evento de error para que las vistas puedan manejarlo
			const errorEvent = new CustomEvent('syncError', {
				detail: {
					error: error.message,
					timestamp: new Date().toISOString(),
					source: 'footer_critical_sync'
				}
			});
			window.dispatchEvent(errorEvent);
		}
	};
	// FIN CAMBIO 9

	if (!isAuthenticated) {
		return (
			<footer className={`footer mt-auto py-4 text-center ${sidebarState.exists ? 'footer-with-sidebar' : ''} ${sidebarState.collapsed ? 'sidebar-collapsed' : ''} ${sidebarState.hidden ? 'sidebar-hidden' : ''}`}>
				<h4>"Tu turno, tu tiempo, tu solución. Con la velocidad que mereces."</h4>
			</footer>
		);
	}

	return (
		<footer className={`footer mt-auto py-4 ${sidebarState.exists ? 'footer-with-sidebar' : ''} ${sidebarState.collapsed ? 'sidebar-collapsed' : ''} ${sidebarState.hidden ? 'sidebar-hidden' : ''}`}>
			<div className="container">
				<div className="row">
					<div className="col-md-8">
						<h4>"Tu turno, tu tiempo, tu solución. Con la velocidad que mereces."</h4>
					</div>
					<div className="col-md-4">
						{/* Estado de sincronización compacto */}
						<div className="d-flex align-items-center justify-content-end">
							<div className="me-3">
								<span className={`badge ${realtimeStatus.isConnected ? 'bg-success' : realtimeStatus.isPolling ? 'bg-warning' : 'bg-danger'}`}>
									{realtimeStatus.statusIcon} {realtimeStatus.statusText}
								</span>
								<small className="text-muted ms-2">
									Última sync: {realtimeStatus.lastSyncFormatted}
								</small>
							</div>
							<button
								className={`btn btn-sm me-2 ${isSyncing ? 'btn-warning' : 'btn-outline-primary'}`}
								onClick={handleManualSync}
								disabled={isSyncing || !store.auth.isAuthenticated || !store.auth.token}
								title={
									isSyncing
										? "Sincronización total en progreso..."
										: (!store.auth.isAuthenticated || !store.auth.token)
											? "Usuario no autenticado"
											: "Sincronización total - Actualizar todo"
								}
							>
								{isSyncing ? (
									<>
										<span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
										⏳ Sincronizando...
									</>
								) : (
									'🔄 Sincronizar Todo'
								)}
							</button>
							<button
								className="btn btn-sm btn-outline-secondary"
								onClick={() => setShowDetails(!showDetails)}
								title="Mostrar detalles"
							>
								{showDetails ? '−' : '+'}
							</button>
						</div>

						{/* Detalles expandibles */}
						{showDetails && (
							<div className="mt-3 p-3 bg-light rounded">
								<h6>Estado de Sincronización</h6>
								<div className="row">
									<div className="col-6">
										<small>
											<strong>WebSocket:</strong> {realtimeStatus.isConnected ? 'Conectado' : 'Desconectado'}<br />
											<strong>Polling:</strong> {realtimeStatus.isPolling ? 'Activo' : 'Inactivo'}<br />
											<strong>Notificaciones:</strong> {realtimeStatus.notifications}
										</small>
									</div>
									<div className="col-6">
										<small>
											<strong>Polling activo:</strong> {realtimeStatus.pollingStats.activePolling.join(', ') || 'Ninguno'}<br />
											<strong>Total intervalos:</strong> {realtimeStatus.pollingStats.totalIntervals}<br />
											<strong>Usuario:</strong> {store.auth.user?.role || 'N/A'}
										</small>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</footer>
	);
};
