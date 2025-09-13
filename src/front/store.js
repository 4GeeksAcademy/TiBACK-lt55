export const initialStore = () => {
  return {
    message: null,
    todos: [],

    // Estado de autenticacion
    auth: {
      accessToken: null,
      refreshToken: null,
      user: null,
      role: null,
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
  login: async (email, password, dispatch) => {
    try {
      dispatch({ type: 'auth_loading', payload: true });

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el login');
      }

      // Guardar en localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.role);

      dispatch({
        type: 'auth_login_success',
        payload: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          role: data.role
        }
      });

      return { success: true };
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

      // Guardar en localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.role);

      dispatch({
        type: 'auth_login_success',
        payload: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          role: data.role
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    dispatch({ type: 'auth_logout' });
  },

  // Refresh token
  refresh: async (dispatch) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error refreshing token');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      dispatch({
        type: 'auth_refresh_token',
        payload: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        }
      });

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      authActions.logout(dispatch);
      return false;
    }
  },

  // Restore session
  restoreSession: (dispatch) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const role = localStorage.getItem('role');

      if (accessToken && refreshToken) {
        dispatch({
          type: 'auth_restore_session',
          payload: { accessToken, refreshToken, user, role }
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
      const token = localStorage.getItem('accessToken');
      if (!token) return true;

      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - now;

      return timeUntilExpiry < 300; // 5 minutes
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  },

   
  hasRole: (userRole, allowedRoles) => {
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }
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
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          user: action.payload.user,
          role: action.payload.role,
          isAuthenticated: true,
          isLoading: false
        }
      };

    case 'auth_logout':
      return {
        ...store,
        auth: {
          accessToken: null,
          refreshToken: null,
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false
        }
      };

    case 'auth_refresh_token':
      return {
        ...store,
        auth: {
          ...store.auth,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken
        }
      };

    case 'auth_restore_session':
      return {
        ...store,
        auth: {
          ...store.auth,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          user: action.payload.user,
          role: action.payload.role,
          isAuthenticated: !!action.payload.accessToken,
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
