import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import GoogleMapsLocation from '../components/GoogleMapsLocation';
import TiBACKLogo from '../assets/img/TiBACK-logo.png';

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
    const backgroundImages = {
        cliente: "https://i.pravatar.cc/1000?img=68",
        analista: "https://i.pravatar.cc/1000?img=12",
        supervisor: "https://i.pravatar.cc/1000?img=54",
        administrador: "https://i.pravatar.cc/1000?img=10",
    };
    const [locationData, setLocationData] = useState({
        address: '',
        lat: null,
        lng: null
    });
    const [error, setError] = useState('');

    const { login, register, store } = useGlobalReducer();
    const navigate = useNavigate();

    // Establecer rol inicial desde la URL
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
                if (formData.role === 'cliente') {
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
                        alert('Cliente registrado exitosamente. Por favor inicia sesión.');
                        setIsLogin(true);
                        setFormData({
                            nombre: '',
                            apellido: '',
                            email: formData.email,
                            password: '',
                            direccion: '',
                            telefono: '',
                            role: 'cliente'
                        });
                        return;
                    }
                } else {
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
                    const role = result.role;
                    if (role === 'cliente') navigate('/cliente');
                    else if (role === 'analista') navigate('/analista');
                    else if (role === 'supervisor') navigate('/supervisor');
                    else if (role === 'administrador') navigate('/administrador');
                } else {
                    alert('Usuario registrado exitosamente. Inicia sesión.');
                    setIsLogin(true);
                    setFormData({
                        nombre: '',
                        apellido: '',
                        email: formData.email,
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
        <div className="container-fluid vh-100 m-0 p-0">
            <div className="row h-100 g-0">

                {/* Lado izquierdo: formulario (30%) */}
                <div className="col-lg-4 col-md-5 d-flex flex-column bg-white shadow-sm px-4 pb-4">

                    {/* Logo arriba */}
                    <div className="mb-4 ms-3">
                        <img src={TiBACKLogo} className="btn cursor-pointer ps-0" onClick={() => navigate('/')} alt="TiBACK Logo" style={{ maxWidth: "170px", height: "auto" }} />
                    </div>

                    {/* Formulario */}
                    <div className="w-100 ms-3" style={{ maxWidth: "320px" }}>
                        <h4 className="mb-2 text-muted">
                            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                        </h4>
                        <p className="text-muted mb-5">
                            {isLogin
                                ? `Accede a tu cuenta de ${formData.role}.`
                                : `Crea tu cuenta de ${formData.role}.`}
                        </p>

                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {!isLogin && formData.role !== 'cliente' && (
                                <>
                                    <div className="row">
                                        <div className="col-6 mb-3">
                                            <label className="form-label">Nombre *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6 mb-3">
                                            <label className="form-label">Apellido *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="apellido"
                                                value={formData.apellido}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Teléfono *</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            required
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

                            <div className="my-4">
                                <label className="form-label text-muted">Email</label>
                                <input
                                    type="email"
                                    className="form-control text-muted"
                                    name="email"
                                    value={formData.email}
                                    placeholder="Ingresa tu email"
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label text-muted">Contraseña</label>
                                <input
                                    type="password"
                                    className="form-control text-muted"
                                    name="password"
                                    value={formData.password}
                                    placeholder="Ingresa tu contraseña"
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 mt-3"
                                disabled={store.auth.isLoading}
                            >
                                <i className="fa-solid fa-right-to-bracket mx-2"></i>
                                {store.auth.isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                            </button>
                        </form>

                        <div className="text-center text-muted mt-3">
                            <button type="button" className="btn btn-link link-secondary my-5" onClick={toggleMode}>
                                {isLogin
                                    ? '¿No tienes cuenta? Regístrate aquí'
                                    : '¿Ya tienes cuenta? Inicia sesión aquí'}
                            </button>
                        </div>
                    </div>
                </div>


                {/* Lado derecho: imagen (70%) */}
                <div
                    className="col-lg-8 col-md-7 d-flex flex-column justify-content-center align-items-center text-white"
                    style={{
                        backgroundImage: `url("${backgroundImages[formData.role] || backgroundImages.cliente}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                    }}
                >
                    <div className="p-5 mt-auto rounded text-center">
                        <h1>Bienvenido a TiBACK!</h1>
                        <h5>"Tu turno, tu tiempo, tu solución. Con la velocidad que mereces..."</h5>
                        <h6> Hola de nuevo, {formData.role === "analista" ? "analista" : `${formData.role}/a`}</h6>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthForm;
