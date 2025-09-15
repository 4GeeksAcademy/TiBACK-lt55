import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

export function AuthFormSupervisor() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login, store } = useGlobalReducer();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(formData.email, formData.password, 'supervisor');

        if (!result.success) {
            setError(result.error);
        }
    };

    useEffect(() => {
        if (store.auth.isAuthenticated) {
            if (store.auth.role === 'supervisor') {
                navigate('/supervisor');
            } else {
                setError('No tienes permisos de supervisor.');
            }
        }
    }, [store.auth.isAuthenticated, store.auth.role, navigate]);

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header text-center">
                            <h3>Login de Supervisor</h3>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Contraseña</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-control"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="d-grid">
                                        <button className="btn btn-primary" type="submit" disabled={store.auth.isLoading}>
                                            {store.auth.isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                                        </button>
                                    </div>
                                    <div className="text-center mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-link"
                                            onClick={() => navigate('/auth')}
                                        >
                                            ¿No eres supervisor? Inicia sesión como cliente
                                        </button>
                                    </div>
                                </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthFormSupervisor;