// Import necessary hooks and functions from React.
import { useContext, useReducer, createContext, useEffect } from "react";
import storeReducer, { initialStore, authActions } from "../store"  // Import the reducer and the initial state.

// Create a context to hold the global state of the application
// We will call this global state the "store" to avoid confusion while using local states
const StoreContext = createContext()

// Define a provider component that encapsulates the store and warps it in a context provider to 
// broadcast the information throught all the app pages and components.
export function StoreProvider({ children }) {
    // Initialize reducer with the initial state.
    const [store, dispatch] = useReducer(storeReducer, initialStore())
    // Provide the store and dispatch method to all child components.
    // return <StoreContext.Provider value={{ store, dispatch }}>
    // Restore session on mount
    useEffect(() => {
        authActions.restoreSession(dispatch);
    }, []);

    // Auto-refresh token when it's about to expire
    useEffect(() => {
        if (store.auth.isAuthenticated && authActions.isTokenExpiringSoon()) {
            authActions.refresh(dispatch);
        }
    }, [store.auth.isAuthenticated]);

    // Provide the store, dispatch method, and auth functions to all child components.
    return <StoreContext.Provider value={{
        store,
        dispatch,
        // Auth functions
        login: (email, password, role) => authActions.login(email, password, role, dispatch),
        register: (userData) => authActions.register(userData, dispatch),
        logout: () => authActions.logout(dispatch),
        refresh: () => authActions.refresh(dispatch),
        hasRole: (allowedRoles) => authActions.hasRole(store.auth.token, allowedRoles),
        isTokenExpiringSoon: authActions.isTokenExpiringSoon,
        // WebSocket functions
        connectWebSocket: (token) => authActions.connectWebSocket(dispatch, token),
        disconnectWebSocket: (socket) => authActions.disconnectWebSocket(dispatch, socket),
        joinRoom: (socket, role, userId) => authActions.joinRoom(socket, role, userId),
        joinTicketRoom: (socket, ticketId) => authActions.joinTicketRoom(socket, ticketId),
        leaveTicketRoom: (socket, ticketId) => authActions.leaveTicketRoom(socket, ticketId),
        joinChatSupervisorAnalista: (socket, ticketId) => authActions.joinChatSupervisorAnalista(socket, ticketId),
        leaveChatSupervisorAnalista: (socket, ticketId) => authActions.leaveChatSupervisorAnalista(socket, ticketId),
        joinChatAnalistaCliente: (socket, ticketId) => authActions.joinChatAnalistaCliente(socket, ticketId),
        leaveChatAnalistaCliente: (socket, ticketId) => authActions.leaveChatAnalistaCliente(socket, ticketId),
        // Nuevas funciones de sincronización
        requestSync: (socket, syncType) => authActions.requestSync(socket, syncType),
        joinRoleRoom: (socket, role, userId) => authActions.joinRoleRoom(socket, role, userId),
        leaveRoleRoom: (socket, role, userId) => authActions.leaveRoleRoom(socket, role, userId),
        // Funciones críticas de sincronización
        emitCriticalTicketAction: (socket, ticketId, action) => authActions.emitCriticalTicketAction(socket, ticketId, action),
        joinCriticalRooms: (socket, ticketIds) => authActions.joinCriticalRooms(socket, ticketIds),
        joinAllCriticalRooms: (socket, userData) => authActions.joinAllCriticalRooms(socket, userData),
        // Funciones de sincronización en tiempo real integradas
        startRealtimeSync: (config) => authActions.startRealtimeSync(dispatch, config, store),
        getRealtimeStatus: () => authActions.getRealtimeStatus(store),
        pollingService: authActions.pollingService
    }}>
        {children}
    </StoreContext.Provider>
}

// Custom hook to access the global state and dispatch function.
export default function useGlobalReducer() {
    // const { dispatch, store } = useContext(StoreContext)
    // return { dispatch, store };
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useGlobalReducer must be used within a StoreProvider');
    }
    return context;
}