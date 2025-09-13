import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        direccion: '',
        telefono: ''
    });
    const [error, setError] = useState('');

   const { login, register, store } = useGlobalReducer();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        

        try {
            let result;

            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                
                const registerData = {
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email,
                    password: formData.password,
                    direccion: formData.direccion,
                    telefono: formData.telefono,
                    role: 'cliente' 
                };
                result = await register(registerData);
            }

            if (result.success) {
                
                navigate('/cliente');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Error inesperado. Inténtalo de nuevo.');
        
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
            telefono: ''
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
                                {isLogin ? 'Accede a tu cuenta de cliente' : 'Crea tu cuenta de cliente'}
                            </p>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {!isLogin && (
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
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="direccion" className="form-label">Dirección *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="direccion"
                                                    name="direccion"
                                                    value={formData.direccion}
                                                    onChange={handleChange}
                                                    required={!isLogin}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
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
