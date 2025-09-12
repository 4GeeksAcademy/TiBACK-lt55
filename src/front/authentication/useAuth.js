import { useAuth as useAuthContext } from './AuthContext';

// Hook personalizado que re-exporta useAuth del contexto
// Esto permite una importación más limpia y consistente
export const useAuth = useAuthContext;

export default useAuth;
