import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import GoogleMapsLocation from '../components/GoogleMapsLocation';

export function AuthForm() {
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        direccion: '',
        telefono: '',
        role: 'cliente'
    });
    const [locationData, setLocationData] = useState({
        address: '',
        lat: null,
        lng: null
    });
    const [error, setError] = useState('');

    const { login, register, store } = useGlobalReducer();
    const navigate = useNavigate();

    // Establecer el rol inicial basado en el parámetro de la URL
    useEffect(() => {
        const roleFromUrl = searchParams.get('role');
        if (roleFromUrl && ['cliente', 'analista', 'supervisor', 'administrador'].includes(roleFromUrl)) {
            setFormData(prev => ({
                ...prev,
                role: roleFromUrl
            }));
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLocationChange = (location) => {
        setLocationData(location);
        setFormData({
            ...formData,
            direccion: location.address
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            let result;

            if (isLogin) {
                result = await login(formData.email, formData.password, formData.role);
            } else {
                // Para clientes, solo registrar email y contraseña inicialmente
                if (formData.role === 'cliente') {
                    // Crear cliente básico solo con email y contraseña
                    const basicClientData = {
                        email: formData.email,
                        password: formData.password,
                        role: 'cliente',
                        nombre: 'Pendiente',
                        apellido: 'Pendiente',
                        direccion: 'Pendiente',
                        telefono: '0000000000'
                    };
                    result = await register(basicClientData);
                    
                    if (result.success) {
                        // Después del registro básico, ir directo al login
                        setError('');
                        alert('Cliente registrado exitosamente. Por favor inicia sesión con tus credenciales.');
                        setIsLogin(true);
                        setFormData({
                            nombre: '',
                            apellido: '',
                            email: formData.email, // Mantener el email para facilitar el login
                            password: '',
                            direccion: '',
                            telefono: '',
                            role: 'cliente'
                        });
                        return;
                    }
                } else {
                    // Para otros roles, registro completo
                    const registerData = {
                        nombre: formData.nombre,
                        apellido: formData.apellido,
                        email: formData.email,
                        password: formData.password,
                        direccion: formData.direccion,
                        telefono: formData.telefono,
                        role: formData.role,
                        latitude: locationData.lat,
                        longitude: locationData.lng
                    };
                    result = await register(registerData);
                }
            }

            if (result.success) {
                if (isLogin) {
                    // SEGURIDAD: Obtener rol del token, no del resultado
                    const role = result.role; // Este viene del token decodificado en store.js
                    if (role === 'cliente') {
                        navigate('/cliente');
                    } else if (role === 'analista') {
                        navigate('/analista');
                    } else if (role === 'supervisor') {
                        navigate('/supervisor');
                    } else if (role === 'administrador') {
                        navigate('/administrador');
                    }
                } else {
                    // Para registro completo, mostrar mensaje de éxito y cambiar a login
                    setError('');
                    alert('Cliente registrado exitosamente. Por favor inicia sesión con tus credenciales.');
                    setIsLogin(true);
                    setIsClientInfoStep(false);
                    setFormData({
                        nombre: '',
                        apellido: '',
                        email: formData.email, // Mantener el email para facilitar el login
                        password: '',
                        direccion: '',
                        telefono: '',
                        role: 'cliente'
                    });
                }
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('Error en handleSubmit:', err);
            setError(`Error inesperado: ${err.message}`);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            direccion: '',
            telefono: '',
            role: 'cliente'
        });
        setLocationData({
            address: '',
            lat: null,
            lng: null
        });
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header text-center">
                            <h3>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h3>
                            <p className="text-muted mb-0">
                                {isLogin 
                                    ? `Accede a tu cuenta de ${formData.role}` 
                                    : `Crea tu cuenta de ${formData.role}`
                                }
                            </p>
                            <div className="mt-2">
                                <span className={`badge ${
                                    formData.role === 'cliente' ? 'bg-primary' :
                                    formData.role === 'analista' ? 'bg-success' :
                                    formData.role === 'supervisor' ? 'bg-warning' :
                                    'bg-danger'
                                }`}>
                                    <i className={`fas ${
                                        formData.role === 'cliente' ? 'fa-user' :
                                        formData.role === 'analista' ? 'fa-user-tie' :
                                        formData.role === 'supervisor' ? 'fa-user-shield' :
                                        'fa-crown'
                                    } me-1`}></i>
                                    {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                                </span>
                            </div>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {!isLogin && formData.role !== 'cliente' && (
                                    <>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="nombre" className="form-label">Nombre *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="nombre"
                                                    name="nombre"
                                                    value={formData.nombre}
                                                    onChange={handleChange}
                                                    required={!isLogin}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="apellido" className="form-label">Apellido *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="apellido"
                                                    name="apellido"
                                                    value={formData.apellido}
                                                    onChange={handleChange}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="telefono" className="form-label">Teléfono *</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="telefono"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="form-label">Ubicación *</label>
                                            <GoogleMapsLocation
                                                onLocationChange={handleLocationChange}
                                                initialAddress={locationData.address}
                                                initialLat={locationData.lat}
                                                initialLng={locationData.lng}
                                            />
                                        </div>
                                    </>
                                )}


                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email *</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Contraseña *</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength="6"
                                    />
                                </div>


                                <div className="d-grid">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={store.auth.isLoading}
                                    >
                                        {store.auth.isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                                    </button>
                                </div>
                            </form>

                            <div className="text-center mt-3">
                                <button
                                    type="button"
                                    className="btn btn-link"
                                    onClick={toggleMode}
                                >
                                    {isLogin
                                        ? '¿No tienes cuenta? Regístrate aquí'
                                        : '¿Ya tienes cuenta? Inicia sesión aquí'
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthForm;
