export const initialStore=()=>{
  return{
    message: null,
    todos: [
      {
        id: 1,
        title: "Make the bed",
        background: null,
      },
      {
        id: 2,
        title: "Do my homework",
        background: null,
      }
    ],

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

    api: { loading: false, error: null }
  }
  
}

export default function storeReducer(store, action = {}) {
  switch(action.type){
    case 'set_hello':
      return {
        ...store,
        message: action.payload
      };
      
    case 'add_task':

      const { id,  color } = action.payload

      return {
        ...store,
        todos: store.todos.map((todo) => (todo.id === id ? { ...todo, background: color } : todo))
      };
    
      
      // API helpers
    case 'api_loading':
      return { ...store, api: { ...store.api, loading: action.payload } };
    case 'api_error':
      return { ...store, api: { loading: false, error: action.payload } };


    // Cliente
    case 'clientes_add':
      return { ...store, clientes: [...store.clientes, action.payload], api: { loading: false, error: null } };
    
    case 'clientes_upsert': {
      const c = action.payload;
      const exists = store.clientes.some(x => x.id === c.id);
      return {
        ...store,
        clientes: exists ? store.clientes.map(x => x.id === c.id ? c : x) : [...store.clientes, c],
        api: { loading: false, error: null }
      };
    }

    case 'clientes_remove':

      return { ...store, clientes: store.clientes.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
   
    case 'clientes_set_list':

      return { ...store, clientes: action.payload, api: { loading: false, error: null } };
  
    case 'cliente_set_detail':
      
      return { ...store, clienteDetail: action.payload, api: { loading: false, error: null } };
    
    case 'cliente_clear_detail':
      return { ...store, clienteDetail: null, api: { loading: false, error: null } };


     // Analista
    case 'analistas_add':
      return { ...store, analistas: [...store.analistas, action.payload], api: { loading: false, error: null } };
    case 'analistas_upsert': {
      const a = action.payload;
      const exists = store.analistas.some(x => x.id === a.id);
      return {
        ...store,
        analistas: exists ? store.analistas.map(x => x.id === a.id ? a : x) : [...store.analistas, a],
        api: { loading: false, error: null }
      };
    }
    case 'analistas_remove':
      return { ...store, analistas: store.analistas.filter(x => x.id !== action.payload), api: { loading: false, error: null } };
    case 'analistas_set_list':
      return { ...store, analistas: action.payload, api: { loading: false, error: null } };
    case 'analista_set_detail':
      return { ...store, analistaDetail: action.payload, api: { loading: false, error: null } };
    case 'analista_clear_detail':
      return { ...store, analistaDetail: null, api: { loading: false, error: null } };
  

       // Supervisor
    case 'supervisores_add':
      return { ...store, supervisores: [...store.supervisores, action.payload], api: { loading: false, error: null } };
    case 'supervisores_upsert': {
      const s = action.payload;
      const exists = store.supervisores.some(x => x.id === s.id);
      return {
        ...store,
        supervisores: exists ? store.supervisores.map(x => x.id === s.id ? s : x) : [...store.supervisores, s],
        api: { loading: false, error: null }
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
  

    default:
      throw Error('Unknown action.');
  }    
}
