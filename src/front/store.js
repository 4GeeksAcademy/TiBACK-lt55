import { string } from "prop-types";

// Utilidades de token seguras - SOLO TOKEN COMO FUENTE DE VERDAD
const tokenUtils = {
  // Decodifica el token JWT
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
    return role || 'usuario';
  }
};

export const initialStore = () => {
  return {
    message: null,
    todos: [],

    // Estado de autenticacion - SOLO TOKEN COMO FUENTE DE VERDAD
    auth: {
      token: null,
      isAuthenticated: false,
      isLoading: true
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
    ticketDetail: null,


    api: { loading: false, error: null }
  };
  
};


// Funciones de autenticación
export const authActions = {
  // Login
  login: async (email, password, role, dispatch) => {
    try {
      dispatch({ type: 'auth_loading', payload: true });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el login');
      }

      // SEGURIDAD: Guardar token con nombre dinámico según rol
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || 'usuario';
      
      // Eliminar cualquier token anterior y variables vulnerables
      localStorage.removeItem('token');
      localStorage.removeItem('cliente');
      localStorage.removeItem('analista');
      localStorage.removeItem('supervisor');
      localStorage.removeItem('administrador');
      localStorage.removeItem('usuario');
      // LIMPIAR VARIABLES VULNERABLES EXPLÍCITAMENTE
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      
      // Guardar con nombre dinámico del rol
      localStorage.setItem(dynamicKey, data.token);
      // ELIMINADO: localStorage.setItem('user', JSON.stringify(data.user)); // VULNERABILIDAD
      // ELIMINADO: localStorage.setItem('role', data.role); // VULNERABILIDAD CRÍTICA

      dispatch({
        type: 'auth_login_success',
        payload: {
          token: data.token
        }
      });

      return { success: true, role: secureRole };
    } catch (error) {
      dispatch({ type: 'auth_loading', payload: false });
      return { success: false, error: error.message };
    }
  },

  // Registro
  register: async (userData, dispatch) => {
    try {
      dispatch({ type: 'auth_loading', payload: true });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }

      // SEGURIDAD: Guardar token con nombre dinámico según rol
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || 'usuario';
      
      // Eliminar cualquier token anterior y variables vulnerables
      localStorage.removeItem('token');
      localStorage.removeItem('cliente');
      localStorage.removeItem('analista');
      localStorage.removeItem('supervisor');
      localStorage.removeItem('administrador');
      localStorage.removeItem('usuario');
      // LIMPIAR VARIABLES VULNERABLES EXPLÍCITAMENTE
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      
      // Guardar con nombre dinámico del rol
      localStorage.setItem(dynamicKey, data.token);
      // ELIMINADO: localStorage.setItem('user', JSON.stringify(data.user)); // VULNERABILIDAD
      // ELIMINADO: localStorage.setItem('role', data.role); // VULNERABILIDAD CRÍTICA

      dispatch({
        type: 'auth_login_success',
        payload: {
          token: data.token
        }
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'auth_loading', payload: false });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: (dispatch) => {
    // Limpiar todas las variables dinámicas posibles
    localStorage.removeItem('token');
    localStorage.removeItem('cliente');
    localStorage.removeItem('analista');
    localStorage.removeItem('supervisor');
    localStorage.removeItem('administrador');
    localStorage.removeItem('usuario');
    // LIMPIAR VARIABLES VULNERABLES EXPLÍCITAMENTE
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    dispatch({ type: 'auth_logout' });
  },

  // Refresh token
  refresh: async (dispatch) => {
    try {
      // Buscar token en cualquiera de las variables dinámicas
      const possibleKeys = ['token', 'cliente', 'analista', 'supervisor', 'administrador', 'usuario'];
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

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error refreshing token');
      }

      // Actualizar con el mismo nombre dinámico
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || 'usuario';
      
      // Limpiar token anterior
      if (currentKey && currentKey !== dynamicKey) {
        localStorage.removeItem(currentKey);
      }
      
      // Guardar nuevo token con nombre dinámico
      localStorage.setItem(dynamicKey, data.token);

      dispatch({
        type: 'auth_refresh_token',
        payload: {
          token: data.token
        }
      });

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      authActions.logout(dispatch);
      return false;
    }
  },

  // Restore session - BUSCAR EN VARIABLES DINÁMICAS
  restoreSession: (dispatch) => {
    try {
      // LIMPIAR VARIABLES VULNERABLES AL INICIALIZAR
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      
      // Buscar token en cualquiera de las variables dinámicas
      const possibleKeys = ['token', 'cliente', 'analista', 'supervisor', 'administrador', 'usuario'];
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
          type: 'auth_restore_session',
          payload: { token }
        });
      } else {
        dispatch({ type: 'auth_loading', payload: false });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      dispatch({ type: 'auth_loading', payload: false });
    }
  },

  
  isTokenExpiringSoon: () => {
    try {
      // Buscar token en cualquiera de las variables dinámicas
      const possibleKeys = ['token', 'cliente', 'analista', 'supervisor', 'administrador', 'usuario'];
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
      console.error('Error checking token expiry:', error);
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
  }
};  

export default function storeReducer(store, action = {}) {
  switch (action.type) {
      
    case 'auth_loading':
      return {
        ...store,
        auth: { ...store.auth, isLoading: action.payload }
      };

    case 'auth_login_success':
      return {
        ...store,
        auth: {
          ...store.auth,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false
        }
      };

    case 'auth_logout':
      return {
        ...store,
        auth: {
          token: null,
          isAuthenticated: false,
          isLoading: false
        }
      };

    case 'auth_refresh_token':
      return {
        ...store,
        auth: {
          ...store.auth,
          token: action.payload.token
        }
      };

    case 'auth_restore_session':
      return {
        ...store,
        auth: {
          ...store.auth,
          token: action.payload.token,
          isAuthenticated: !!action.payload.token,
          isLoading: false
        }
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
    case 'api_loading':
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
      const exists = store.clientes.some((x) => x.id === c.id);
      return {
        ...store,
        clientes: exists
          ? store.clientes.map((x) => (x.id === c.id ? c : x))
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
    case 'analistas_add':
      return { ...store, analistas: [...store.analistas, action.payload], api: { loading: false, error: null } };
    case 'analistas_upsert': {
      const a = action.payload;
      const exists = store.analistas.some((x) => x.id === a.id);
      return {
        ...store,
        analistas: exists
          ? store.analistas.map((x) => (x.id === a.id ? a : x))
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
      const exists = store.supervisores.some((x) => x.id === s.id);
      return {
        ...store,
        supervisores: exists
          ? store.supervisores.map((x) => (x.id === s.id ? s : x))
          : [...store.supervisores, s],
        api: { loading: false, error: null },
      };
    }
    case 'supervisores_remove':
      return { ...store, supervisores: store.supervisores.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'supervisores_set_list':
      return { ...store, supervisores: action.payload, api: { loading: false, error: null } };
    case 'supervisor_set_detail':
      return { ...store, supervisorDetail: action.payload, api: { loading: false, error: null } };
    case 'supervisor_clear_detail':
      return { ...store, supervisorDetail: null, api: { loading: false, error: null } };  


      // Comentarios
    case 'comentarios_add':
      return { ...store, comentarios: [...store.comentarios, action.payload], api: { loading: false, error: null } };
    case 'comentarios_upsert': {
      const c = action.payload;
      const exists = store.comentarios.some(x => x.id === c.id);
      return {
        ...store,
        comentarios: exists ? store.comentarios.map(x => x.id === c.id ? c : x) : [...store.comentarios, c],
        api: { loading: false, error: null }
      };
    }
    case 'comentarios_remove':
      return { ...store, comentarios: store.comentarios.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'comentarios_set_list':
      return { ...store, comentarios: action.payload, api: { loading: false, error: null } };
    case 'comentario_set_detail':
      return { ...store, comentarioDetail: action.payload, api: { loading: false, error: null } };
    case 'comentario_clear_detail':
      return { ...store, comentarioDetail: null, api: { loading: false, error: null } };
    

    // Asignaciones
    case 'asignaciones_add':
      return { ...store, asignaciones: [...store.asignaciones, action.payload], api: { loading: false, error: null } };
    case 'asignaciones_upsert': {
      const a = action.payload;
      const exists = store.asignaciones.some(x => x.id === a.id);
      return {
        ...store,
        asignaciones: exists ? store.asignaciones.map(x => x.id === a.id ? a : x) : [...store.asignaciones, a],
        api: { loading: false, error: null }
      };
    }
    case 'asignaciones_remove':
      return { ...store, asignaciones: store.asignaciones.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'asignaciones_set_list':
      return { ...store, asignaciones: action.payload, api: { loading: false, error: null } };
    case 'asignacion_set_detail':
      return { ...store, asignacionDetail: action.payload, api: { loading: false, error: null } };
    case 'asignacion_clear_detail':
      return { ...store, asignacionDetail: null, api: { loading: false, error: null } };
  

      // Administradores
    case 'administradores_add':
      return { ...store, administradores: [...store.administradores, action.payload], api: { loading: false, error: null } };
    case 'administradores_upsert': {
      const a = action.payload;
      const exists = store.administradores.some(x => x.id === a.id);
      return {
        ...store,
        administradores: exists ? store.administradores.map(x => x.id === a.id ? a : x) : [...store.administradores, a],
        api: { loading: false, error: null }
      };
    }
    case 'administradores_remove':
      return { ...store, administradores: store.administradores.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'administradores_set_list':
      return { ...store, administradores: action.payload, api: { loading: false, error: null } };
    case 'administrador_set_detail':
      return { ...store, administradorDetail: action.payload, api: { loading: false, error: null } };
    case 'administrador_clear_detail':
      return { ...store, administradorDetail: null, api: { loading: false, error: null } };
 

  
    // Tickets
    case 'tickets_add':
      return { ...store, tickets: [...store.tickets, action.payload], api: { loading: false, error: null } };
    case 'tickets_upsert': {
      const t = action.payload;
      const exists = store.tickets.some(x => x.id === t.id);
      return {
        ...store,
        tickets: exists ? store.tickets.map(x => x.id === t.id ? t : x) : [...store.tickets, t],
        api: { loading: false, error: null }
      };
    }
    case 'tickets_remove':
      return { ...store, tickets: store.tickets.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'tickets_set_list':
      return { ...store, tickets: action.payload, api: { loading: false, error: null } };
    case 'ticket_set_detail':
      return { ...store, ticketDetail: action.payload, api: { loading: false, error: null } };
    case 'ticket_clear_detail':
      return { ...store, ticketDetail: null, api: { loading: false, error: null } };

       // Gestiones
    case 'gestiones_add':
      return { ...store, gestiones: [...store.gestiones, action.payload], api: { loading: false, error: null } };
    case 'gestiones_upsert': {
      const t = action.payload;
      const exists = store.gestiones.some(x => x.id === t.id); 
      return {
        ...store,
        gestiones: exists ? store.gestiones.map(x => x.id === t.id ? t : x) : [...store.gestiones, t],
        api: { loading: false, error: null }
      };
    }
    case 'gestiones_remove':
      return { ...store, gestiones: store.gestiones.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'gestiones_set_list':
      return { ...store, gestiones: action.payload, api: { loading: false, error: null } };
    case 'gestion_set_detail':
      return { ...store, gestionDetail: action.payload, api: { loading: false, error: null } };
    case 'gestion_clear_detail':
      return { ...store, gestionDetail: null, api: { loading: false, error: null } };
      

    default:
      throw Error("Unknown action.");
  }
}
