import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Estado inicial de autenticación
const initialState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true
};

// Tipos de acciones
const AUTH_ACTIONS = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
    REFRESH_TOKEN: 'REFRESH_TOKEN',
    SET_LOADING: 'SET_LOADING',
    RESTORE_SESSION: 'RESTORE_SESSION'
};

// Reducer para manejar el estado de autenticación
function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                accessToken: action.payload.accessToken,
                refreshToken: action.payload.refreshToken,
                user: action.payload.user,
                role: action.payload.role,
                isAuthenticated: true,
                isLoading: false
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...initialState,
                isLoading: false
            };

        case AUTH_ACTIONS.REFRESH_TOKEN:
            return {
                ...state,
                accessToken: action.payload.accessToken,
                refreshToken: action.payload.refreshToken
            };

        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload
            };

        case AUTH_ACTIONS.RESTORE_SESSION:
            return {
                ...state,
                accessToken: action.payload.accessToken,
                refreshToken: action.payload.refreshToken,
                user: action.payload.user,
                role: action.payload.role,
                isAuthenticated: !!action.payload.accessToken,
                isLoading: false
            };

        default:
            return state;
    }
}

// Crear el contexto
const AuthContext = createContext();

// Provider del contexto
export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Restaurar sesión al montar el componente
    useEffect(() => {
        const restoreSession = () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                const refreshToken = localStorage.getItem('refreshToken');
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                const role = localStorage.getItem('role');

                if (accessToken && refreshToken) {
                    dispatch({
                        type: AUTH_ACTIONS.RESTORE_SESSION,
                        payload: { accessToken, refreshToken, user, role }
                    });
                } else {
                    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                }
            } catch (error) {
                console.error('Error restoring session:', error);
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        };

        restoreSession();
    }, []);

    // Función de login
    const login = async (email, password) => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

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
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    user: data.user,
                    role: data.role
                }
            });

            return { success: true };
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            return { success: false, error: error.message };
        }
    };

    // Función de registro
    const register = async (userData) => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

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
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    user: data.user,
                    role: data.role
                }
            });

            return { success: true };
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            return { success: false, error: error.message };
        }
    };

    // Función de logout
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };

    // Función para refrescar token
    const refresh = async () => {
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
                type: AUTH_ACTIONS.REFRESH_TOKEN,
                payload: {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken
                }
            });

            return true;
        } catch (error) {
            console.error('Error refreshing token:', error);
            logout();
            return false;
        }
    };

    // Función para verificar roles
    const hasRole = (allowedRoles) => {
        if (!Array.isArray(allowedRoles)) {
            allowedRoles = [allowedRoles];
        }
        return allowedRoles.includes(state.role);
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        refresh,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para usar el contexto
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
