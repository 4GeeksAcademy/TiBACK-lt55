import { io } from "socket.io-client";
 

// Función global para manejar chats activos en localStorage
window.updateActiveChat = (
  ticketId,
  ticketTitle,
  userId,
  commentsCount = 0,
  messagesCount = 0
) => {
  try {
    const chatsData = localStorage.getItem("activeChats");
    let activeChats = chatsData ? JSON.parse(chatsData) : [];

    // Buscar si ya existe un chat para este ticket y usuario
    const existingChatIndex = activeChats.findIndex(
      (chat) => chat.ticketId === ticketId && chat.userId === userId
    );

    const chatData = {
      ticketId,
      ticketTitle,
      userId,
      commentsCount,
      messagesCount,
      lastActivity: new Date().toISOString(),
    };

    if (existingChatIndex !== -1) {
      // Actualizar chat existente
      activeChats[existingChatIndex] = chatData;
    } else {
      // Agregar nuevo chat
      activeChats.push(chatData);
    }

    // Guardar en localStorage
    localStorage.setItem("activeChats", JSON.stringify(activeChats));

    // Disparar evento personalizado para notificar cambios
    window.dispatchEvent(new CustomEvent("activeChatsUpdated"));

    console.log("Chat activo actualizado:", chatData);
  } catch (error) {
    console.error("Error al actualizar chat activo:", error);
  }
};

// Utilidades de token seguras - SOLO TOKEN COMO FUENTE DE VERDAD
export const tokenUtils = {
  // Decodifica el token JWT
  decodeToken: (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      return null;
    }
  },

  // Obtiene el rol del token
  getRole: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.role : null;
  },

  // Obtiene el ID del usuario del token
  getUserId: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.user_id : null;
  },

  // Obtiene el email del usuario del token
  getEmail: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.email : null;
  },

  // Verifica si el token es válido
  isValid: (token) => {
    const payload = tokenUtils.decodeToken(token);
    if (!payload || !payload.exp) return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  },

  // Genera hash transaccional dinámico basado en rol
  generateTransactionHash: (token) => {
    const role = tokenUtils.getRole(token);
    if (!role) return null;
    return btoa(token + role + Date.now());
  },

  // Obtiene nombre de variable transaccional dinámico
  getTransactionVariableName: (token) => {
    const role = tokenUtils.getRole(token);
    return role || "usuario";
  },
};

export const initialStore = () => {
  return {
    message: null,
    todos: [],

    // Estado de autenticacion - SOLO TOKEN COMO FUENTE DE VERDAD
    auth: {
      token: null,
      isAuthenticated: false,
      isLoading: true,
    },

    // Estado de WebSocket
    websocket: {
      socket: null,
      connected: false,
      notifications: [],
    },

    // Estado global para Clientes
    clientes: [],
    clienteDetail: null,

    // Estado global para Analistas
    analistas: [],
    analistaDetail: null,

    // Estado global para Supervisores
    supervisores: [],
    supervisorDetail: null,

    // Estado global para Comentarios
    comentarios: [],
    comentarioDetail: null,

    // Estado global para Asignaciones
    asignaciones: [],
    asignacionDetail: null,

    // Estado global para Administradores
    administradores: [],
    administradorDetail: null,

    // Estado global para gestiones
    gestiones: [],
    gestionDetail: null,

    // Estado global para Tickets
    tickets: [],
    ticketsCerrados: [],
    ticketDetail: null,

    imagegentle: [
      {
        id: 1,
        src: "https://res.cloudinary.com/mystoreimg/image/upload/v1759732962/zsxxv0qlqrbsdt5760cv.png",
        name: "Elkin Botero",
        subtit: "Técnico Web",
        prrfo: "Mejorando procesos de sistemas para clientes.",
        stl: "img-clp-w-1",
        skillstech: [
          "JavaScript",
          "Python",
          "Flask",
          "PostgreSQL",
          "React",
          "Node.js",
        ],
        experiencia: ["3 años desarrollando aplicaciones web"],
        proyectos: [
          "Sistema de gestión documental",
          "Plataforma de reservas online",
        ],
        contacto: {
          email: "elkin@empresa.com",
          linkedin: "https://linkedin.com/in/elkinbotero",
          github: "https://github.com/eybagit",
        },
      },
      {
        id: 2,
        src: "https://res.cloudinary.com/mystoreimg/image/upload/v1759732963/xb3jsgkapv50aj4vtzty.png",
        name: "Johan Gómez",
        subtit: "Tecnico Web",
        prrfo:
          "Trabajando para mejorar los rocesos para los sistemas de nuestros clientes",
        stl: "img-clp-w-2",
        skillstech: [
          "JavaScript",
          "Python",
          "Flask",
          "PostgreSQL",
          "React",
          "Node.js",
        ],
        experiencia: ["Diseño de interfaces modernas"],
        proyectos: ["Dashboard Analítico", "App de control de inventarios"],
        contacto: {
          email: "johan@empresa.com",
          linkedin: "https://linkedin.com/in/johan",
          github: "https://github.com/J4gG3Rr",
        },
      },
      {
        id: 3,
        src: "https://res.cloudinary.com/mystoreimg/image/upload/v1759732962/flzh94tm0xienaqf5kbf.png",
        name: "Manuel Freire",
        subtit: "Tecnico Web",
        prrfo:
          "Trabajando para mejorar los rocesos para los sistemas de nuestros clientes",
        stl: "img-clp-w-3",
        skillstech: [
          "JavaScript",
          "Python",
          "Flask",
          "PostgreSQL",
          "React",
          "Node.js",
        ],
        experiencia: [
          "Desarrollo de APIs REST",
          "Automatización de procesos internos",
        ],
        proyectos: ["Sistema de tickets de soporte"],
        contacto: {
          email: "manuel@empresa.com",
          linkedin: "https://www.linkedin.com/in/manuel-freire-60837837b/",
          github: "https://github.com/ManuelFreire-rgb",
        },
      },
    ],
    designs: [
    {
      img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759717169/ggffu4ot48feqozj7ryl.png",
      title: "Diseño Visualización de Tickets",
    },
    {
      img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728155/caoub9ckl0cdak37zkk8.png",
      title: "Diseño de Dashboard",
    },
    {
      img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759716845/cgnezuaawg2up8uhsg9c.png",
      title: "Diseño de Vistas",
    },
    {
      img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728508/znxsjqcmikpmdzqt100x.png",
      title: "Disposición de Navegador Lateral Ligero",
    },
    {
      img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728628/nnk1kdwtj0a04qygaecl.png",
      title: "Diseño en Caja",
    },
    {
      img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728314/cgnrshquvfk2rgj1hxsr.png",
      title: "Diseño Semi Oscuro",
    },
  ],
    api: { loading: false, error: null },
  };
};

// Funciones de autenticación
export const authActions = {
  // Login
  login: async (email, password, role, dispatch) => {
    try {
      dispatch({ type: "auth_loading", payload: true });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el login");
      }

      // SEGURIDAD: Guardar token con nombre dinámico según rol
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || "usuario";

      // Eliminar cualquier token anterior y variables vulnerables
      localStorage.removeItem("token");
      localStorage.removeItem("cliente");
      localStorage.removeItem("analista");
      localStorage.removeItem("supervisor");
      localStorage.removeItem("administrador");
      localStorage.removeItem("usuario");
      // LIMPIAR VARIABLES VULNERABLES EXPLÍCITAMENTE
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      // Guardar con nombre dinámico del rol
      localStorage.setItem(dynamicKey, data.token);
      // ELIMINADO: localStorage.setItem('user', JSON.stringify(data.user)); // VULNERABILIDAD
      // ELIMINADO: localStorage.setItem('role', data.role); // VULNERABILIDAD CRÍTICA

      dispatch({
        type: "auth_login_success",
        payload: {
          token: data.token,
        },
      });

      return { success: true, role: secureRole };
    } catch (error) {
      dispatch({ type: "auth_loading", payload: false });
      return { success: false, error: error.message };
    }
  },

  // Registro
  register: async (userData, dispatch) => {
    try {
      dispatch({ type: "auth_loading", payload: true });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el registro");
      }

      // SEGURIDAD: Guardar token con nombre dinámico según rol
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || "usuario";

      // Eliminar cualquier token anterior y variables vulnerables
      localStorage.removeItem("token");
      localStorage.removeItem("cliente");
      localStorage.removeItem("analista");
      localStorage.removeItem("supervisor");
      localStorage.removeItem("administrador");
      localStorage.removeItem("usuario");
      // LIMPIAR VARIABLES VULNERABLES EXPLÍCITAMENTE
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      // Guardar con nombre dinámico del rol
      localStorage.setItem(dynamicKey, data.token);
      // ELIMINADO: localStorage.setItem('user', JSON.stringify(data.user)); // VULNERABILIDAD
      // ELIMINADO: localStorage.setItem('role', data.role); // VULNERABILIDAD CRÍTICA

      dispatch({
        type: "auth_login_success",
        payload: {
          token: data.token,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: "auth_loading", payload: false });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: (dispatch) => {
    // Limpiar todas las variables dinámicas posibles
    localStorage.removeItem("token");
    localStorage.removeItem("cliente");
    localStorage.removeItem("analista");
    localStorage.removeItem("supervisor");
    localStorage.removeItem("administrador");
    localStorage.removeItem("usuario");
    // LIMPIAR VARIABLES VULNERABLES EXPLÍCITAMENTE
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    dispatch({ type: "auth_logout" });
  },

  // Refresh token
  refresh: async (dispatch) => {
    try {
      // Buscar token en cualquiera de las variables dinámicas
      const possibleKeys = [
        "token",
        "cliente",
        "analista",
        "supervisor",
        "administrador",
        "usuario",
      ];
      let token = null;
      let currentKey = null;

      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value && tokenUtils.isValid(value)) {
          token = value;
          currentKey = key;
          break;
        }
      }

      if (!token) return false;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error refreshing token");
      }

      // Actualizar con el mismo nombre dinámico
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || "usuario";

      // Limpiar token anterior
      if (currentKey && currentKey !== dynamicKey) {
        localStorage.removeItem(currentKey);
      }

      // Guardar nuevo token con nombre dinámico
      localStorage.setItem(dynamicKey, data.token);

      dispatch({
        type: "auth_refresh_token",
        payload: {
          token: data.token,
        },
      });

      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      authActions.logout(dispatch);
      return false;
    }
  },

  // Restore session - BUSCAR EN VARIABLES DINÁMICAS
  restoreSession: (dispatch) => {
    try {
      // LIMPIAR VARIABLES VULNERABLES AL INICIALIZAR
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      // Buscar token en cualquiera de las variables dinámicas
      const possibleKeys = [
        "token",
        "cliente",
        "analista",
        "supervisor",
        "administrador",
        "usuario",
      ];
      let token = null;

      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value && tokenUtils.isValid(value)) {
          token = value;
          break;
        }
      }

      if (token) {
        dispatch({
          type: "auth_restore_session",
          payload: { token },
        });
      } else {
        dispatch({ type: "auth_loading", payload: false });
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      dispatch({ type: "auth_loading", payload: false });
    }
  },

  isTokenExpiringSoon: () => {
    try {
      // Buscar token en cualquiera de las variables dinámicas
      const possibleKeys = [
        "token",
        "cliente",
        "analista",
        "supervisor",
        "administrador",
        "usuario",
      ];
      let token = null;

      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value && tokenUtils.isValid(value)) {
          token = value;
          break;
        }
      }

      if (!token) return true;

      const payload = tokenUtils.decodeToken(token);
      if (!payload || !payload.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      return timeUntilExpiry < 3600; // 1 hour
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  },

  // Función segura para verificar roles usando token
  hasRole: (token, allowedRoles) => {
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }

    const userRole = tokenUtils.getRole(token);
    return allowedRoles.includes(userRole);
  },

  // Funciones de WebSocket mejoradas
  connectWebSocket: (dispatch, token) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) return;

      // Suprimir errores específicos de WebSocket frame header
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.error = (...args) => {
        const message = args.join(" ");
        if (
          message.includes("Invalid frame header") ||
          message.includes("WebSocket connection failed") ||
          message.includes("probe") ||
          message.includes("WebSocket") ||
          message.includes("transport") ||
          message.includes("socket.io") ||
          message.includes("EIO=4")
        ) {
          return; // No mostrar estos errores específicos
        }
        originalConsoleError.apply(console, args);
      };

      console.warn = (...args) => {
        const message = args.join(" ");
        if (
          message.includes("Invalid frame header") ||
          message.includes("WebSocket connection failed") ||
          message.includes("probe") ||
          message.includes("WebSocket") ||
          message.includes("transport") ||
          message.includes("socket.io") ||
          message.includes("EIO=4")
        ) {
          return; // No mostrar estos warnings específicos
        }
        originalConsoleWarn.apply(console, args);
      };

      // Verificar si ya hay una conexión activa
      const currentSocket = dispatch.getState?.()?.websocket?.socket;
      if (currentSocket && currentSocket.connected) {
        console.log("WebSocket ya conectado, reutilizando conexión");
        return currentSocket;
      }

      // Cerrar conexión anterior si existe pero no está conectada
      if (currentSocket && !currentSocket.connected) {
        currentSocket.disconnect();
      }

      // Verificar si ya hay una conexión en proceso
      const isConnecting = dispatch.getState?.()?.websocket?.connecting;
      if (isConnecting) {
        return null;
      }

      // Verificar si ya hay una conexión en progreso
      if (window.websocketConnecting) {
        console.log("🔄 WebSocket ya está conectando, esperando...");
        return null;
      }

      // Verificar si hay un retry reciente (evitar reconexiones demasiado frecuentes)
      const lastRetry = window.lastWebSocketRetry || 0;
      const now = Date.now();
      if (now - lastRetry < 5000) {
        // Esperar al menos 5 segundos entre intentos
        console.log("⏳ Esperando antes del siguiente intento de conexión...");
        return null;
      }
      window.lastWebSocketRetry = now;

      // Marcar como conectando globalmente
      window.websocketConnecting = true;
      dispatch({ type: "websocket_connecting" });

      const socket = io(backendUrl, {
        //  transports: ["websocket", "polling"],
        transports: ["polling"], // Empezar solo con polling para evitar errores de frame
        auth: {
          token: token,
        },
        forceNew: true, // Forzar nueva conexión
      });

      socket.on("connect", () => {
        console.log("WebSocket conectado");
        dispatch({ type: "websocket_connected", payload: socket });
      });

      socket.on("disconnect", () => {
        console.log("WebSocket desconectado");
        dispatch({ type: "websocket_disconnected" });
      });

      // Eventos de tickets
      socket.on("nuevo_ticket", (data) => {
        console.log("⚡ NUEVO TICKET RECIBIDO:", data);
        dispatch({ type: "websocket_notification", payload: data });
      });

      socket.on("connect", () => {
        window.websocketConnecting = false;
        console.log("🔌 WebSocket conectado exitosamente");
        dispatch({ type: "websocket_connected", payload: socket });

        // Unirse automáticamente a rooms del rol si el usuario está autenticado
        const currentUser = dispatch.getState?.()?.auth?.user;
        if (currentUser) {
          // Unirse a todas las rooms críticas
          authActions.joinAllCriticalRooms(socket, currentUser);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket desconectado:", reason);
        dispatch({ type: "websocket_disconnected", payload: { reason } });
      });

      socket.on("connect_error", (error) => {
        window.websocketConnecting = false;
        console.error("❌ Error de conexión WebSocket:", error);

        // Manejo específico para errores de frame
        if (error.message && error.message.includes("Invalid frame header")) {
          console.log(
            "🔄 Error de frame detectado, intentando reconexión con polling..."
          );
          // Forzar reconexión con polling primero
          setTimeout(() => {
            if (socket && !socket.connected) {
              socket.io.opts.transports = ["polling"];
              socket.connect();
            }
          }, 2000);
        }

        dispatch({
          type: "websocket_error",
          payload: { error: error.message },
        });
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(
          `🔄 WebSocket reconectado después de ${attemptNumber} intentos`
        );
        dispatch({
          type: "websocket_reconnected",
          payload: { attempts: attemptNumber },
        });

        // Reunirse a todas las rooms críticas después de reconexión
        const currentUser = dispatch.getState?.()?.auth?.user;
        if (currentUser) {
          authActions.joinAllCriticalRooms(socket, currentUser);
        }
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 Intento de reconexión WebSocket #${attemptNumber}`);
        dispatch({
          type: "websocket_reconnecting",
          payload: { attempt: attemptNumber },
        });
      });

      socket.on("reconnect_error", (error) => {
        console.error("❌ Error en reconexión WebSocket:", error);
        dispatch({
          type: "websocket_reconnect_error",
          payload: { error: error.message },
        });
      });

      socket.on("reconnect_failed", () => {
        console.error(
          "❌ Falló la reconexión WebSocket después de todos los intentos"
        );
        dispatch({ type: "websocket_reconnect_failed" });
      });

      // Eventos de sincronización global
      socket.on("sync_triggered", (data) => {
        console.log("🔄 Sincronización global solicitada:", data);
        dispatch({ type: "sync_triggered", payload: data });
      });

      socket.on("sync_requested", (data) => {
        console.log("🔄 Solicitud de sincronización recibida:", data);
        dispatch({ type: "sync_requested", payload: data });
      });

      // Eventos críticos de tickets
      socket.on("critical_ticket_update", (data) => {
        console.log("🚨 ACTUALIZACIÓN CRÍTICA DE TICKET:", data);
        dispatch({
          type: "critical_ticket_update",
          payload: {
            ...data,
            timestamp: Date.now(),
          },
        });
      });

      socket.on("joined_critical_rooms", (data) => {
        console.log("🔐 Unido a rooms críticos:", data);
        dispatch({ type: "joined_critical_rooms", payload: data });
      });

      // Remover el evento disconnect duplicado - se maneja más abajo

      // Manejar errores de conexión
      socket.on("connect_error", (error) => {
        window.websocketConnecting = false;
        // Filtrar errores específicos de frame header y upgrade
        const errorMessage = error.message || error.toString();
        const isFrameHeaderError =
          errorMessage.includes("Invalid frame header") ||
          errorMessage.includes("WebSocket connection failed") ||
          errorMessage.includes("probe") ||
          errorMessage.includes("WebSocket") ||
          errorMessage.includes("transport");

        if (!isFrameHeaderError) {
          console.warn("Error de conexión WebSocket:", errorMessage);
        }
        // No dispatchar errores de frame header para evitar interrupciones
        if (!isFrameHeaderError) {
          dispatch({ type: "websocket_error", payload: errorMessage });
        }
      });

      // Manejar errores de transporte
      socket.on("error", (error) => {
        const errorMessage = error.toString();
        const isFrameHeaderError =
          errorMessage.includes("Invalid frame header") ||
          errorMessage.includes("WebSocket connection failed") ||
          errorMessage.includes("probe") ||
          errorMessage.includes("WebSocket") ||
          errorMessage.includes("transport");

        if (!isFrameHeaderError) {
          console.warn("Error WebSocket:", error);
        }
        // No dispatchar errores de frame header para evitar interrupciones
        if (!isFrameHeaderError) {
          dispatch({ type: "websocket_error", payload: error });
        }
      });

      // Manejar errores específicos de upgrade
      socket.on("upgradeError", (error) => {
        // Silenciar errores de upgrade ya que usamos solo polling
        window.websocketConnecting = false;
      });

      // Interceptar errores de WebSocket antes de que se propaguen
      const originalEmit = socket.emit;
      socket.emit = function (event, ...args) {
        try {
          return originalEmit.call(this, event, ...args);
        } catch (error) {
          // Silenciar errores de frame header durante el probe
          if (error.message && error.message.includes("Invalid frame header")) {
            return;
          }
          throw error;
        }
      };

      // Manejar errores específicos de WebSocket
      socket.on("disconnect", (reason) => {
        window.websocketConnecting = false;
        // Solo mostrar desconexiones no intencionales
        if (reason !== "io client disconnect") {
          console.warn("WebSocket desconectado:", reason);
        }
        dispatch({ type: "websocket_disconnected" });
      });

      // Eventos de tickets
      socket.on("nuevo_ticket", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // Para administradores, agregar el ticket completo al store
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        } else {
          // Convertir datos de notificación a formato de ticket
          const ticketData = {
            id: data.ticket_id,
            estado: data.ticket_estado,
            titulo: data.ticket_titulo,
            prioridad: data.ticket_prioridad,
            id_cliente: data.cliente_id,
            fecha_creacion: data.timestamp,
          };
          dispatch({ type: "tickets_upsert", payload: ticketData });
        }
      });

      socket.on("nuevo_ticket_disponible", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // Convertir datos de notificación a formato de ticket
        const ticketData = {
          id: data.ticket_id,
          estado: data.ticket_estado,
          titulo: data.ticket_titulo,
          prioridad: data.ticket_prioridad,
          id_cliente: data.cliente_id,
          fecha_creacion: data.timestamp,
        };
        dispatch({ type: "tickets_upsert", payload: ticketData });
      });

      socket.on("ticket_actualizado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // Si tiene ticket completo, usarlo; si no, convertir datos de notificación
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        } else if (data.ticket_id) {
          const ticketData = {
            id: data.ticket_id,
            estado: data.ticket_estado || data.nuevo_estado,
            titulo: data.ticket_titulo,
            prioridad: data.ticket_prioridad,
            id_cliente: data.cliente_id,
            fecha_creacion: data.timestamp,
          };
          dispatch({ type: "tickets_upsert", payload: ticketData });
        }
      });

      socket.on("ticket_asignado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // Si tiene ticket completo, usarlo; si no, convertir datos de notificación
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        } else if (data.ticket_id) {
          const ticketData = {
            id: data.ticket_id,
            estado: data.ticket_estado,
            titulo: data.ticket_titulo,
            prioridad: data.ticket_prioridad,
            id_cliente: data.cliente_id,
            fecha_creacion: data.timestamp,
          };
          dispatch({ type: "tickets_upsert", payload: ticketData });
        }
      });

      socket.on("nuevo_comentario", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "comentarios_add", payload: data.comentario });
      });

      socket.on("ticket_eliminado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "tickets_remove", payload: data.ticket_id });
      });

      // Eventos de confirmación de rooms
      socket.on("joined_ticket", (data) => {});

      socket.on("left_ticket", (data) => {});

      // Eventos de confirmación de chats específicos
      socket.on("joined_chat_supervisor_analista", (data) => {});

      socket.on("left_chat_supervisor_analista", (data) => {});

      socket.on("joined_chat_analista_cliente", (data) => {});

      socket.on("left_chat_analista_cliente", (data) => {});

      // Eventos de analistas
      socket.on("analista_creado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "analistas_add", payload: data.analista });
      });

      socket.on("analista_eliminado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "analistas_remove", payload: data.analista_id });
      });

      socket.on("solicitud_reapertura", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // No actualizar tickets aquí, solo es una notificación
      });

      // Evento de ticket escalado
      socket.on("ticket_escalado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // No actualizar tickets aquí, solo es una notificación
      });

      // Evento de ticket reabierto
      socket.on("ticket_reabierto", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // No actualizar tickets aquí, solo es una notificación
      });

      // Evento de ticket cerrado
      socket.on("ticket_cerrado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        // Para tickets cerrados, actualizar el estado pero no agregar a la lista activa
        if (data.ticket_id) {
          const ticketData = {
            id: data.ticket_id,
            estado: data.ticket_estado || "cerrado",
            titulo: data.ticket_titulo,
            prioridad: data.ticket_prioridad,
            id_cliente: data.cliente_id,
            fecha_creacion: data.timestamp,
            fecha_cierre: data.timestamp,
            calificacion: data.calificacion,
          };
          dispatch({ type: "tickets_upsert", payload: ticketData });
          // También agregar a la lista de tickets cerrados
          dispatch({ type: "tickets_cerrados_upsert", payload: ticketData });
        }
      });

      // Evento de ticket asignado específicamente a mí (analista)
      socket.on("ticket_asignado_a_mi", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "tickets_upsert", payload: data });
      });

      // Evento específico para actualizaciones de CRUD de administradores
      socket.on("ticket_crud_update", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        }
      });

      return socket;
    } catch (error) {
      console.error("Error conectando WebSocket:", error);
      window.websocketConnecting = false;
      dispatch({ type: "websocket_disconnected" });
      return null;
    } finally {
      // Restaurar console.error y console.warn originales
      if (typeof originalConsoleError !== "undefined") {
        console.error = originalConsoleError;
      }
      if (typeof originalConsoleWarn !== "undefined") {
        console.warn = originalConsoleWarn;
      }
    }
  },

  disconnectWebSocket: (dispatch, socket) => {
    if (socket) {
      // Salir de todas las rooms antes de desconectar
      const currentUser = dispatch.getState?.()?.auth?.user;
      if (currentUser) {
        socket.emit("leave_role_room", {
          role: currentUser.role,
          user_id: currentUser.id,
        });
      }

      // Limpiar todos los listeners antes de desconectar
      socket.removeAllListeners();
      socket.disconnect();
      dispatch({ type: "websocket_disconnected" });
    }
  },

  // Función para solicitar sincronización global
  requestSync: (socket, syncType = "all", userData = null) => {
    if (socket && socket.connected) {
      const currentUser =
        userData || (typeof window !== "undefined" && window.store?.auth?.user);
      if (currentUser) {
        socket.emit("request_sync", {
          type: syncType,
          user_id: currentUser.id,
          role: currentUser.role,
        });
      }
    }
  },

  // Función para emitir acción crítica de ticket
  emitCriticalTicketAction: (socket, ticketId, action, userData = null) => {
    if (socket && socket.connected) {
      const currentUser =
        userData || (typeof window !== "undefined" && window.store?.auth?.user);
      if (currentUser) {
        console.log(
          `🚨 Emitiendo acción crítica: ${action} en ticket ${ticketId}`
        );
        socket.emit("critical_ticket_action", {
          ticket_id: ticketId,
          action: action,
          user_id: currentUser.id,
          role: currentUser.role,
        });
      }
    }
  },

  // Función para unirse a rooms críticos
  joinCriticalRooms: (socket, ticketIds = [], userData = null) => {
    if (socket && socket.connected) {
      const currentUser =
        userData || (typeof window !== "undefined" && window.store?.auth?.user);
      if (currentUser) {
        console.log(
          `🔐 Uniéndose a rooms críticos para tickets: ${ticketIds.join(", ")}`
        );
        socket.emit("join_critical_rooms", {
          user_id: currentUser.id,
          role: currentUser.role,
          ticket_ids: ticketIds,
        });
      }
    }
  },

  // Función para unirse a room de rol
  joinRoleRoom: (socket, role, userId) => {
    if (socket && socket.connected) {
      socket.emit("join_role_room", {
        role: role,
        user_id: userId,
      });
    }
  },

  // Función para salir de room de rol
  leaveRoleRoom: (socket, role, userId) => {
    if (socket && socket.connected) {
      socket.emit("leave_role_room", {
        role: role,
        user_id: userId,
      });
    }
  },

  // Servicio de polling integrado
  pollingService: {
    intervals: new Map(),
    isActive: false,
    retryCounts: new Map(),
    lastCallbacks: new Map(),

    startPolling(type, callback, interval = 30000, options = {}) {
      if (this.intervals.has(type)) {
        console.log(`⚠️ Polling ya activo para ${type}`);
        return;
      }

      const {
        endpoint = this.getEndpoint(type),
        method = "GET",
        headers = {},
        onError = null,
        retryOnError = true,
        maxRetries = 3,
      } = options;

      console.log(`🔄 Iniciando polling para ${type} cada ${interval}ms`);

      const pollFunction = async () => {
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL;
          const token = localStorage.getItem("token");

          const response = await fetch(`${backendUrl}${endpoint}`, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              ...headers,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          callback(data);

          // Reset retry count on success
          this.retryCounts.set(type, 0);
        } catch (error) {
          console.error(`❌ Error en polling ${type}:`, error);

          if (onError) {
            onError(error);
          }

          if (retryOnError) {
            this.handleRetry(type, error, maxRetries);
          }
        }
      };

      // Ejecutar inmediatamente
      pollFunction();

      // Configurar intervalo
      const intervalId = setInterval(pollFunction, interval);
      this.intervals.set(type, intervalId);
      this.lastCallbacks.set(type, callback);
      this.isActive = true;

      return intervalId;
    },

    stopPolling(type) {
      const intervalId = this.intervals.get(type);
      if (intervalId) {
        clearInterval(intervalId);
        this.intervals.delete(type);
        this.lastCallbacks.delete(type);
        console.log(`⏹️ Polling detenido para ${type}`);
      }

      if (this.intervals.size === 0) {
        this.isActive = false;
      }
    },

    stopAllPolling() {
      console.log("⏹️ Deteniendo todo el polling");
      this.intervals.forEach((intervalId, type) => {
        clearInterval(intervalId);
        console.log(`⏹️ Polling detenido para ${type}`);
      });
      this.intervals.clear();
      this.lastCallbacks.clear();
      this.isActive = false;
    },

    getEndpoint(type) {
      const endpoints = {
        tickets: "/api/tickets",
        comentarios: "/api/comentarios",
        asignaciones: "/api/asignaciones",
        clientes: "/api/clientes",
        analistas: "/api/analistas",
        supervisores: "/api/supervisores",
        administradores: "/api/administradores",
        gestion: "/api/gestion",
      };
      return endpoints[type] || "/api/tickets";
    },

    handleRetry(type, error, maxRetries) {
      const currentRetries = this.retryCounts.get(type) || 0;

      if (currentRetries < maxRetries) {
        this.retryCounts.set(type, currentRetries + 1);
        console.log(
          `🔄 Reintentando polling ${type} (${
            currentRetries + 1
          }/${maxRetries})`
        );

        const delay = Math.min(1000 * Math.pow(2, currentRetries), 30000);
        setTimeout(() => {
          if (this.intervals.has(type)) {
            const callback = this.lastCallbacks.get(type);
            if (callback) {
              this.startPolling(type, callback, 30000);
            }
          }
        }, delay);
      } else {
        console.error(`❌ Máximo de reintentos alcanzado para ${type}`);
        this.stopPolling(type);
      }
    },

    setupRoleBasedPolling(role, callbacks = {}) {
      const roleConfigs = {
        cliente: {
          tickets: { interval: 15000, priority: "high" },
          comentarios: { interval: 10000, priority: "high" },
        },
        analista: {
          tickets: { interval: 20000, priority: "high" },
          comentarios: { interval: 15000, priority: "high" },
          asignaciones: { interval: 30000, priority: "medium" },
        },
        supervisor: {
          tickets: { interval: 25000, priority: "high" },
          asignaciones: { interval: 20000, priority: "high" },
          analistas: { interval: 60000, priority: "low" },
        },
        administrador: {
          tickets: { interval: 30000, priority: "medium" },
          clientes: { interval: 120000, priority: "low" },
          analistas: { interval: 120000, priority: "low" },
          supervisores: { interval: 120000, priority: "low" },
        },
      };

      const config = roleConfigs[role] || {};

      Object.entries(config).forEach(([type, { interval, priority }]) => {
        if (callbacks[type]) {
          this.startPolling(type, callbacks[type], interval, {
            priority,
            retryOnError: priority === "high",
          });
        }
      });
    },

    getStats() {
      return {
        isActive: this.isActive,
        activePolling: Array.from(this.intervals.keys()),
        totalIntervals: this.intervals.size,
        retryCounts: Object.fromEntries(this.retryCounts),
      };
    },
  },

  // Función para unirse a todas las rooms críticas
  joinAllCriticalRooms: (socket, userData) => {
    if (!socket || !userData) return;

    const { role, id } = userData;
    console.log(
      `🚨 Uniéndose a todas las rooms críticas para ${role} (ID: ${id})`
    );

    // Unirse al room del rol
    socket.emit("join_role_room", { role, user_id: id });

    // Unirse a rooms críticas globales
    socket.emit("join_critical_rooms", {
      role,
      user_id: id,
      critical_rooms: ["global_tickets", "global_chats", "critical_updates"],
    });

    console.log(
      `✅ Unido a rooms críticas: role_${role}, global_tickets, global_chats, critical_updates`
    );
  },

  // Funciones de sincronización en tiempo real integradas
  startRealtimeSync: (dispatch, config = {}, store = null) => {
    const {
      syncInterval = 30000,
      enablePolling = true,
      syncTypes = ["tickets", "comentarios", "asignaciones"],
      onSyncTriggered = null,
      onSyncRequested = null,
    } = config;

    // Intentar obtener el store de diferentes maneras
    let currentStore = store;
    if (!currentStore) {
      currentStore = dispatch.getState?.();
    }
    if (!currentStore && typeof window !== "undefined" && window.store) {
      currentStore = window.store;
    }

    const pollingService = authActions.pollingService;

    // Verificar que store esté disponible
    if (!currentStore) {
      console.error("❌ No se pudo obtener el estado del store");
      return {
        triggerSync: () => console.warn("⚠️ Store no disponible"),
        stopSync: () => console.warn("⚠️ Store no disponible"),
      };
    }

    // Función para iniciar polling como fallback
    const startPolling = () => {
      if (!enablePolling || pollingService.isActive) return;

      console.log("🔄 Iniciando polling como fallback");

      if (currentStore.auth.user) {
        const callbacks = {
          tickets: (data) => {
            console.log("📡 Datos de tickets recibidos por polling:", data);
            if (onSyncTriggered) {
              onSyncTriggered({ type: "tickets", data, source: "polling" });
            }
          },
          comentarios: (data) => {
            console.log("📡 Datos de comentarios recibidos por polling:", data);
            if (onSyncTriggered) {
              onSyncTriggered({ type: "comentarios", data, source: "polling" });
            }
          },
          asignaciones: (data) => {
            console.log(
              "📡 Datos de asignaciones recibidos por polling:",
              data
            );
            if (onSyncTriggered) {
              onSyncTriggered({
                type: "asignaciones",
                data,
                source: "polling",
              });
            }
          },
        };

        pollingService.setupRoleBasedPolling(
          currentStore.auth.user.role,
          callbacks
        );
      }
    };

    // Función para detener polling
    const stopPolling = () => {
      console.log("⏹️ Deteniendo polling");
      pollingService.stopAllPolling();
    };

    // Función para solicitar sincronización manual
    const triggerSync = (type = "manual") => {
      if (
        currentStore.websocket &&
        currentStore.websocket.connected &&
        currentStore.websocket.socket
      ) {
        console.log(`🔄 Solicitando sincronización: ${type}`);
        authActions.requestSync(currentStore.websocket.socket, type);
      } else {
        console.log("⚠️ WebSocket no conectado, usando polling");
        startPolling();
      }
    };

    // Función para unirse a rooms de sincronización
    const joinSyncRooms = () => {
      if (
        currentStore.auth.user &&
        currentStore.websocket &&
        currentStore.websocket.connected &&
        currentStore.websocket.socket
      ) {
        const { role, id } = currentStore.auth.user;
        authActions.joinRoleRoom(currentStore.websocket.socket, role, id);
        console.log(`🏠 Unido a rooms de sincronización para ${role} (${id})`);
      }
    };

    // Función para salir de rooms de sincronización
    const leaveSyncRooms = () => {
      if (
        currentStore.auth.user &&
        currentStore.websocket &&
        currentStore.websocket.connected &&
        currentStore.websocket.socket
      ) {
        const { role, id } = currentStore.auth.user;
        authActions.leaveRoleRoom(currentStore.websocket.socket, role, id);
        console.log(
          `👋 Saliendo de rooms de sincronización para ${role} (${id})`
        );
      }
    };

    // Función para inicializar la sincronización (no ejecutar automáticamente)
    const initializeSync = () => {
      if (currentStore.websocket && currentStore.websocket.connected) {
        stopPolling();
        joinSyncRooms();
      } else {
        leaveSyncRooms();
        startPolling();
      }
    };

    return {
      triggerSync,
      startPolling,
      stopPolling,
      joinSyncRooms,
      leaveSyncRooms,
      initializeSync,
      pollingStats: pollingService.getStats(),
    };
  },

  // Función para mostrar estado de sincronización
  getRealtimeStatus: (store) => {
    const pollingService = authActions.pollingService;
    const isConnected = store.websocket.connected;
    const isPolling = pollingService.isActive;
    const lastSync = store.websocket.lastSync || 0;

    const getStatusColor = () => {
      if (isConnected) return "text-green-500";
      if (isPolling) return "text-yellow-500";
      return "text-red-500";
    };

    const getStatusText = () => {
      if (isConnected) return "Conectado";
      if (isPolling) return "Polling";
      return "Desconectado";
    };

    const getStatusIcon = () => {
      if (isConnected) return "🟢";
      if (isPolling) return "🟡";
      return "🔴";
    };

    const formatLastSync = () => {
      if (!lastSync) return "Nunca";
      const diff = Math.floor((Date.now() - lastSync) / 1000);
      if (diff < 60) return `${diff}s`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m`;
      return `${Math.floor(diff / 3600)}h`;
    };

    return {
      isConnected,
      isPolling,
      lastSync,
      statusColor: getStatusColor(),
      statusText: getStatusText(),
      statusIcon: getStatusIcon(),
      lastSyncFormatted: formatLastSync(),
      pollingStats: pollingService.getStats(),
      notifications: store.websocket.notifications.length,
    };
  },

  joinRoom: (socket, role, userId) => {
    if (socket) {
      // Unirse a las salas generales según el rol (solo para gestión de usuarios)
      if (role === "supervisor") {
        socket.emit("join_room", "supervisores");
      } else if (role === "administrador") {
        socket.emit("join_room", "supervisores");
        socket.emit("join_room", "administradores");
      } else if (role === "analista") {
        socket.emit("join_room", "analistas"); // Sala general de analistas
        socket.emit("join_room", `analista_${userId}`); // Sala específica del analista
      } else if (role === "cliente") {
        socket.emit("join_room", "clientes"); // Sala general de clientes
      }
    }
  },

  joinTicketRoom: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_ticket", { ticket_id: ticketId });
    }
  },

  leaveTicketRoom: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_ticket", { ticket_id: ticketId });
    }
  },

  joinChatSupervisorAnalista: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_chat_supervisor_analista", { ticket_id: ticketId });
    } else {
    }
  },

  leaveChatSupervisorAnalista: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_chat_supervisor_analista", { ticket_id: ticketId });
    }
  },

  joinChatAnalistaCliente: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_chat_analista_cliente", { ticket_id: ticketId });
    } else {
    }
  },

  leaveChatAnalistaCliente: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_chat_analista_cliente", { ticket_id: ticketId });
    }
  },
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "auth_loading":
      return {
        ...store,
        auth: { ...store.auth, isLoading: action.payload },
      };

    case "auth_login_success":
      return {
        ...store,
        auth: {
          ...store.auth,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false,
        },
      };

    case "auth_logout":
      return {
        ...store,
        auth: {
          token: null,
          isAuthenticated: false,
          isLoading: false,
        },
      };

    case "auth_refresh_token":
      return {
        ...store,
        auth: {
          ...store.auth,
          token: action.payload.token,
        },
      };

    case "auth_restore_session":
      return {
        ...store,
        auth: {
          ...store.auth,
          token: action.payload.token,
          isAuthenticated: !!action.payload.token,
          isLoading: false,
        },
      };

    case "SET_USER":
      return {
        ...store,
        auth: {
          ...store.auth,
          user: action.payload,
        },
      };

    // WebSocket cases
    case "websocket_connecting":
      return {
        ...store,
        websocket: {
          ...store.websocket,
          connecting: true,
        },
      };

    case "websocket_connected":
      return {
        ...store,
        websocket: {
          ...store.websocket,
          socket: action.payload,
          connected: true,
          connecting: false,
        },
      };

    case "websocket_disconnected":
      return {
        ...store,
        websocket: {
          ...store.websocket,
          socket: null,
          connected: false,
          connecting: false,
        },
      };

    case "websocket_error":
      return {
        ...store,
        websocket: {
          ...store.websocket,
          socket: null,
          connected: false,
          connecting: false,
          error: action.payload,
        },
      };

    case "websocket_notification":
      return {
        ...store,
        websocket: {
          ...store.websocket,
          notifications: [...store.websocket.notifications, action.payload],
        },
      };

    case "set_hello":
      return {
        ...store,
        message: action.payload,
      };

    case "add_task":
      const { id, color } = action.payload;

      return {
        ...store,
        todos: store.todos.map((todo) =>
          todo.id === id ? { ...todo, background: color } : todo
        ),
      };

    // API helpers
    case "api_loading":
      return { ...store, api: { ...store.api, loading: action.payload } };
    case "api_error":
      return { ...store, api: { loading: false, error: action.payload } };

    // Cliente
    case "clientes_add":
      return {
        ...store,
        clientes: [...store.clientes, action.payload],
        api: { loading: false, error: null },
      };

    case "clientes_upsert": {
      const c = action.payload;
      if (!c || !c.id) {
        console.warn("clientes_upsert: payload inválido", c);
        return store;
      }
      const exists = store.clientes.some((x) => x && x.id === c.id);
      return {
        ...store,
        clientes: exists
          ? store.clientes.map((x) => (x && x.id === c.id ? c : x))
          : [...store.clientes, c],
        api: { loading: false, error: null },
      };
    }

    case "clientes_remove":
      return {
        ...store,
        clientes: store.clientes.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };

    case "clientes_set_list":
      return {
        ...store,
        clientes: action.payload,
        api: { loading: false, error: null },
      };

    case "cliente_set_detail":
      return {
        ...store,
        clienteDetail: action.payload,
        api: { loading: false, error: null },
      };

    case "cliente_clear_detail":
      return {
        ...store,
        clienteDetail: null,
        api: { loading: false, error: null },
      };

    // Analista
    case "analistas_add": {
      const analista = action.payload;
      if (!analista || !analista.id) {
        console.warn("analistas_add: payload inválido", analista);
        return store;
      }
      const exists = store.analistas.some((a) => a && a.id === analista.id);
      if (exists) {
        console.log(
          "analistas_add: analista ya existe, ignorando duplicado",
          analista
        );
        return store;
      }
      return {
        ...store,
        analistas: [...store.analistas, analista],
        api: { loading: false, error: null },
      };
    }
    case "analistas_upsert": {
      const a = action.payload;
      if (!a || !a.id) {
        console.warn("analistas_upsert: payload inválido", a);
        return store;
      }
      const exists = store.analistas.some((x) => x && x.id === a.id);
      return {
        ...store,
        analistas: exists
          ? store.analistas.map((x) => (x && x.id === a.id ? a : x))
          : [...store.analistas, a],
        api: { loading: false, error: null },
      };
    }
    case "analistas_remove":
      return {
        ...store,
        analistas: store.analistas.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };
    case "analistas_set_list":
      return {
        ...store,
        analistas: action.payload,
        api: { loading: false, error: null },
      };
    case "analista_set_detail":
      return {
        ...store,
        analistaDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "analista_clear_detail":
      return {
        ...store,
        analistaDetail: null,
        api: { loading: false, error: null },
      };

    case "supervisores_add":
      return {
        ...store,
        supervisores: [...store.supervisores, action.payload],
        api: { loading: false, error: null },
      };

    case "supervisores_upsert": {
      const s = action.payload;
      if (!s || !s.id) {
        console.warn("supervisores_upsert: payload inválido", s);
        return store;
      }
      const exists = store.supervisores.some((x) => x && x.id === s.id);
      return {
        ...store,
        supervisores: exists
          ? store.supervisores.map((x) => (x && x.id === s.id ? s : x))
          : [...store.supervisores, s],
        api: { loading: false, error: null },
      };
    }
    case "supervisores_remove":
      return {
        ...store,
        supervisores: store.supervisores.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };
    case "supervisores_set_list":
      return {
        ...store,
        supervisores: action.payload,
        api: { loading: false, error: null },
      };
    case "supervisor_set_detail":
      return {
        ...store,
        supervisorDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "supervisor_clear_detail":
      return {
        ...store,
        supervisorDetail: null,
        api: { loading: false, error: null },
      };

    // Comentarios
    case "comentarios_add":
      return {
        ...store,
        comentarios: [...store.comentarios, action.payload],
        api: { loading: false, error: null },
      };
    case "comentarios_upsert": {
      const c = action.payload;
      if (!c || !c.id) {
        console.warn("comentarios_upsert: payload inválido", c);
        return store;
      }
      const exists = store.comentarios.some((x) => x && x.id === c.id);
      return {
        ...store,
        comentarios: exists
          ? store.comentarios.map((x) => (x && x.id === c.id ? c : x))
          : [...store.comentarios, c],
        api: { loading: false, error: null },
      };
    }
    case "comentarios_remove":
      return {
        ...store,
        comentarios: store.comentarios.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };
    case "comentarios_set_list":
      return {
        ...store,
        comentarios: action.payload,
        api: { loading: false, error: null },
      };
    case "comentario_set_detail":
      return {
        ...store,
        comentarioDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "comentario_clear_detail":
      return {
        ...store,
        comentarioDetail: null,
        api: { loading: false, error: null },
      };

    // Asignaciones
    case "asignaciones_add":
      return {
        ...store,
        asignaciones: [...store.asignaciones, action.payload],
        api: { loading: false, error: null },
      };
    case "asignaciones_upsert": {
      const a = action.payload;
      if (!a || !a.id) {
        console.warn("asignaciones_upsert: payload inválido", a);
        return store;
      }
      const exists = store.asignaciones.some((x) => x && x.id === a.id);
      return {
        ...store,
        asignaciones: exists
          ? store.asignaciones.map((x) => (x && x.id === a.id ? a : x))
          : [...store.asignaciones, a],
        api: { loading: false, error: null },
      };
    }
    case "asignaciones_remove":
      return {
        ...store,
        asignaciones: store.asignaciones.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };
    case "asignaciones_set_list":
      return {
        ...store,
        asignaciones: action.payload,
        api: { loading: false, error: null },
      };
    case "asignacion_set_detail":
      return {
        ...store,
        asignacionDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "asignacion_clear_detail":
      return {
        ...store,
        asignacionDetail: null,
        api: { loading: false, error: null },
      };

    // Administradores
    case "administradores_add":
      return {
        ...store,
        administradores: [...store.administradores, action.payload],
        api: { loading: false, error: null },
      };
    case "administradores_upsert": {
      const a = action.payload;
      if (!a || !a.id) {
        console.warn("administradores_upsert: payload inválido", a);
        return store;
      }
      const exists = store.administradores.some((x) => x && x.id === a.id);
      return {
        ...store,
        administradores: exists
          ? store.administradores.map((x) => (x && x.id === a.id ? a : x))
          : [...store.administradores, a],
        api: { loading: false, error: null },
      };
    }
    case "administradores_remove":
      return {
        ...store,
        administradores: store.administradores.filter(
          (x) => x.id !== action.payload
        ),
        api: { loading: false, error: null },
      };
    case "administradores_set_list":
      return {
        ...store,
        administradores: action.payload,
        api: { loading: false, error: null },
      };
    case "administrador_set_detail":
      return {
        ...store,
        administradorDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "administrador_clear_detail":
      return {
        ...store,
        administradorDetail: null,
        api: { loading: false, error: null },
      };

    // Tickets
    case "tickets_add":
      return {
        ...store,
        tickets: [...store.tickets, action.payload],
        api: { loading: false, error: null },
      };
    case "tickets_upsert": {
      const t = action.payload;
      if (!t || !t.id || typeof t.id !== "number") {
        console.warn("tickets_upsert: payload inválido", t);
        return store;
      }
      const exists = store.tickets.some((x) => x && x.id === t.id);
      return {
        ...store,
        tickets: exists
          ? store.tickets.map((x) => (x && x.id === t.id ? t : x))
          : [...store.tickets, t],
        api: { loading: false, error: null },
      };
    }
    case "tickets_remove":
      return {
        ...store,
        tickets: store.tickets.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };
    case "tickets_set_list":
      return {
        ...store,
        tickets: action.payload,
        api: { loading: false, error: null },
      };
    case "ticket_set_detail":
      return {
        ...store,
        ticketDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "ticket_clear_detail":
      return {
        ...store,
        ticketDetail: null,
        api: { loading: false, error: null },
      };

    // Tickets Cerrados
    case "tickets_cerrados_add":
      return {
        ...store,
        ticketsCerrados: [...store.ticketsCerrados, action.payload],
        api: { loading: false, error: null },
      };
    case "tickets_cerrados_upsert": {
      const t = action.payload;
      if (!t || !t.id || typeof t.id !== "number") {
        console.warn("tickets_cerrados_upsert: payload inválido", t);
        return store;
      }
      const exists = store.ticketsCerrados.some((x) => x && x.id === t.id);
      return {
        ...store,
        ticketsCerrados: exists
          ? store.ticketsCerrados.map((x) => (x && x.id === t.id ? t : x))
          : [...store.ticketsCerrados, t],
        api: { loading: false, error: null },
      };
    }
    case "tickets_cerrados_set_list":
      return {
        ...store,
        ticketsCerrados: action.payload,
        api: { loading: false, error: null },
      };

    // Gestiones
    case "gestiones_add":
      return {
        ...store,
        gestiones: [...store.gestiones, action.payload],
        api: { loading: false, error: null },
      };
    case "gestiones_upsert": {
      const t = action.payload;
      if (!t || !t.id) {
        console.warn("gestiones_upsert: payload inválido", t);
        return store;
      }
      const exists = store.gestiones.some((x) => x && x.id === t.id);
      return {
        ...store,
        gestiones: exists
          ? store.gestiones.map((x) => (x && x.id === t.id ? t : x))
          : [...store.gestiones, t],
        api: { loading: false, error: null },
      };
    }
    case "gestiones_remove":
      return {
        ...store,
        gestiones: store.gestiones.filter((x) => x.id !== action.payload),
        api: { loading: false, error: null },
      };
    case "gestiones_set_list":
      return {
        ...store,
        gestiones: action.payload,
        api: { loading: false, error: null },
      };
    case "gestion_set_detail":
      return {
        ...store,
        gestionDetail: action.payload,
        api: { loading: false, error: null },
      };
    case "gestion_clear_detail":
      return {
        ...store,
        gestionDetail: null,
        api: { loading: false, error: null },
      };

    default:
      return store;
  }
}
