import React, { useState } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

const ImageUpload = ({ onImageUpload, onImageRemove, currentImageUrl, disabled = false }) => {
    const { store } = useGlobalReducer();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen debe ser menor a 5MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Debug: Verificar token
            console.log('🔍 DEBUG - Token disponible:', !!store.auth.token);
            console.log('🔍 DEBUG - URL backend:', import.meta.env.VITE_BACKEND_URL);
            
            if (!store.auth.token) {
                throw new Error('No hay token de autenticación disponible');
            }

            const formData = new FormData();
            formData.append('image', file);

            const url = `${import.meta.env.VITE_BACKEND_URL}/api/upload-image`;
            console.log('🔍 DEBUG - URL completa:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${store.auth.token}`
                },
                body: formData
            });

            console.log('🔍 DEBUG - Status response:', response.status);
            console.log('🔍 DEBUG - Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 DEBUG - Error response:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('🔍 DEBUG - Response data:', data);
            onImageUpload(data.url);
        } catch (error) {
            console.error('🔍 DEBUG - Error completo:', error);
            setError('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        onImageRemove();
    };

    return (
        <div className="image-upload-container">
            <div className="mb-3">
                <label className="form-label">
                    <i className="fas fa-image me-2"></i>
                    Imagen del Ticket
                </label>
                
                {currentImageUrl ? (
                    <div className="current-image-container">
                        <div className="d-flex align-items-center mb-2">
                            <img 
                                src={currentImageUrl} 
                                alt="Imagen actual" 
                                className="img-thumbnail me-3"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />
                            <div>
                                <p className="mb-1 text-success">
                                    <i className="fas fa-check-circle me-1"></i>
                                    Imagen cargada
                                </p>
                                <button 
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={handleRemoveImage}
                                    disabled={disabled}
                                >
                                    <i className="fas fa-trash me-1"></i>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="upload-area">
                        <div className="border border-dashed border-secondary rounded p-4 text-center">
                            <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                            <p className="text-muted mb-3">
                                Arrastra una imagen aquí o haz clic para seleccionar
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={disabled || uploading}
                                className="form-control"
                                id="imageUpload"
                            />
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="mt-2">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Subiendo...</span>
                        </div>
                        <span className="text-muted">Subiendo imagen...</span>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger mt-2" role="alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}

                <div className="form-text">
                    <i className="fas fa-info-circle me-1"></i>
                    Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
