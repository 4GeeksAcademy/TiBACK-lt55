import React, { useState } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';

const ImageUpload = ({ onImageUpload, onImageRemove, currentImageUrl, disabled = false }) => {
    const { store } = useGlobalReducer();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showDesktopCapture, setShowDesktopCapture] = useState(false);

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

            if (!store.auth.token) {
                throw new Error('No hay token de autenticación disponible');
            }

            const formData = new FormData();
            formData.append('image', file);

            const url = `${import.meta.env.VITE_BACKEND_URL}/api/upload-image`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${store.auth.token}`
                },
                body: formData
            });


            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Verificar si es una imagen placeholder
            if (data.url && data.url.includes('data:image/svg+xml')) {
                // Mostrar mensaje informativo pero permitir continuar
                setError('⚠️ Cloudinary no está configurado. Se usará una imagen placeholder temporal.');
                // No continuar con la subida si es placeholder
                return;
            }

            onImageUpload(data.url);
        } catch (error) {
            setError('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        onImageRemove();
    };

    const handleScreenCapture = async () => {
        try {
            setCapturing(true);
            setError(null);

            // Verificar si la API de captura de pantalla está disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('La captura de pantalla no está disponible en este navegador');
            }

            // Solicitar acceso a la pantalla (ventana/pestaña específica)
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            // Crear un video temporal para capturar el frame
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            // Crear un canvas para capturar la imagen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Dibujar el frame actual en el canvas
            ctx.drawImage(video, 0, 0);

            // Detener el stream
            stream.getTracks().forEach(track => track.stop());

            // Convertir canvas a blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.8);
            });

            // Convertir blob a File
            const file = new File([blob], `captura-pantalla-${Date.now()}.png`, {
                type: 'image/png'
            });

            // Subir la imagen capturada
            await uploadImage(file);

        } catch (err) {
            console.error('Error capturando pantalla:', err);
            setError('Error al capturar pantalla: ' + err.message);
        } finally {
            setCapturing(false);
        }
    };

    const handleDesktopCapture = async () => {
        try {
            setCapturing(true);
            setError(null);

            // Verificar si la API de captura de pantalla está disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('La captura de pantalla no está disponible en este navegador');
            }

            // PRIMERO: Solicitar permisos y que el usuario seleccione la pantalla
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920, max: 3840 },
                    height: { ideal: 1080, max: 2160 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: false,
                preferCurrentTab: false
            });

            // SEGUNDO: Después de que el usuario haya seleccionado, mostrar ventana flotante con cuenta regresiva
            const floatingWindow = window.open('', '_blank', 'width=350,height=250,left=50,top=50,alwaysOnTop=yes,resizable=no,scrollbars=no,status=no,toolbar=no,menubar=no,location=no');

            if (floatingWindow) {
                floatingWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Captura de Escritorio</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 0;
                                padding: 15px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                text-align: center;
                                user-select: none;
                                -webkit-user-select: none;
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                z-index: 999999;
                                overflow: hidden;
                            }
                            .countdown {
                                font-size: 42px;
                                font-weight: bold;
                                margin: 15px 0;
                                color: #ff6b6b;
                                animation: pulse 1s infinite;
                                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                            }
                            @keyframes pulse {
                                0% { transform: scale(1); }
                                50% { transform: scale(1.1); }
                                100% { transform: scale(1); }
                            }
                            .instructions {
                                font-size: 14px;
                                margin: 8px 0;
                                opacity: 0.9;
                                line-height: 1.4;
                            }
                            .warning {
                                background: rgba(255, 107, 107, 0.3);
                                border: 2px solid #ff6b6b;
                                border-radius: 8px;
                                padding: 8px;
                                margin: 8px 0;
                                font-size: 12px;
                                font-weight: bold;
                            }
                            .success {
                                background: rgba(76, 175, 80, 0.3);
                                border: 2px solid #4CAF50;
                                border-radius: 8px;
                                padding: 8px;
                                margin: 8px 0;
                                font-size: 12px;
                                font-weight: bold;
                            }
                        </style>
                    </head>
                    <body>
                        <h3>📸 Captura de Escritorio</h3>
                        <div class="countdown" id="countdown">10</div>
                        <div class="instructions" id="instructions">Preparando captura...</div>
                        <div class="success" id="success">
                            <strong>✅ Pantalla Seleccionada:</strong><br>
                            Permisos otorgados correctamente.<br>
                            <strong>¡Ve a la pantalla que quieres capturar!</strong>
                        </div>
                        <div class="warning" id="warning" style="display: none;">
                            <strong>⚠️ Importante:</strong> La captura se realizará automáticamente.
                        </div>
                        
                        <script>
                            let countdown = 10;
                            const countdownEl = document.getElementById('countdown');
                            const instructions = document.getElementById('instructions');
                            const success = document.getElementById('success');
                            const warning = document.getElementById('warning');
                            
                            // Función para actualizar la cuenta regresiva
                            const updateCountdown = () => {
                                countdownEl.textContent = countdown;
                                
                                if (countdown <= 3) {
                                    instructions.textContent = '¡Captura en ' + countdown + ' segundos!';
                                    instructions.style.color = '#ff6b6b';
                                    instructions.style.fontWeight = 'bold';
                                    warning.style.display = 'block';
                                    success.style.display = 'none';
                                } else if (countdown <= 7) {
                                    instructions.textContent = 'Preparando captura en ' + countdown + ' segundos...';
                                    warning.style.display = 'block';
                                    success.style.display = 'none';
                                } else {
                                    instructions.textContent = 'Preparando captura...';
                                    success.style.display = 'block';
                                }
                                
                                if (countdown <= 0) {
                                    instructions.textContent = '¡Capturando ahora!';
                                    // NO cerrar la ventana aquí, dejar que el proceso principal la cierre
                                } else {
                                    countdown--;
                                    setTimeout(updateCountdown, 1000);
                                }
                            };
                            
                            // Iniciar la cuenta regresiva
                            updateCountdown();
                            
                            // Hacer la ventana siempre visible y en primer plano
                            window.focus();
                            
                            // Función para mantener la ventana siempre visible
                            const keepVisible = () => {
                                try {
                                    // Intentar mantener la ventana en primer plano
                                    window.focus();
                                    window.blur();
                                    window.focus();
                                    
                                    // Intentar mover la ventana a una posición visible
                                    window.moveTo(50, 50);
                                    
                                    // Intentar mantener la ventana siempre encima
                                    if (window.top) {
                                        window.top.focus();
                                    }
                                } catch (e) {
                                    // Ignorar errores de seguridad del navegador
                                }
                            };
                            
                            // Mantener la ventana visible cada 100ms
                            const keepAlive = setInterval(keepVisible, 100);
                            
                            // Intentar mantener la ventana en primer plano cada 500ms
                            const keepOnTop = setInterval(() => {
                                try {
                                    window.focus();
                                    // Intentar traer la ventana al frente
                                    if (window.opener) {
                                        window.opener.focus();
                                        window.focus();
                                    }
                                } catch (e) {
                                    // Ignorar errores de seguridad
                                }
                            }, 500);
                            
                            // Limpiar los intervalos cuando la ventana se cierre
                            window.addEventListener('beforeunload', () => {
                                clearInterval(keepAlive);
                                clearInterval(keepOnTop);
                            });
                            
                            // Intentar mantener la ventana visible cuando se pierde el foco
                            window.addEventListener('blur', () => {
                                setTimeout(() => {
                                    try {
                                        window.focus();
                                    } catch (e) {
                                        // Ignorar errores
                                    }
                                }, 100);
                            });
                            
                            // Intentar mantener la ventana siempre visible usando múltiples técnicas
                            const forceVisible = () => {
                                try {
                                    // Técnica 1: Focus y blur
                                    window.focus();
                                    window.blur();
                                    window.focus();
                                    
                                    // Técnica 2: Mover la ventana
                                    window.moveTo(50, 50);
                                    
                                    // Técnica 3: Intentar traer al frente
                                    if (window.opener) {
                                        window.opener.focus();
                                        window.focus();
                                    }
                                    
                                    // Técnica 4: Intentar mantener en primer plano
                                    window.scrollTo(0, 0);
                                    
                                } catch (e) {
                                    // Ignorar errores de seguridad
                                }
                            };
                            
                            // Ejecutar forceVisible cada 200ms
                            const forceVisibleInterval = setInterval(forceVisible, 200);
                            
                            // Limpiar forceVisible cuando la ventana se cierre
                            window.addEventListener('beforeunload', () => {
                                clearInterval(forceVisibleInterval);
                            });
                        </script>
                    </body>
                    </html>
                `);
                floatingWindow.document.close();
            }

            // TERCERO: Esperar 10 segundos con la ventana flotante visible
            // Usar un Promise que se resuelva después de 10 segundos
            await new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, 10000); // 10 segundos exactos
            });

            // CUARTO: Capturar la pantalla
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            // Crear un canvas para capturar la imagen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Dibujar el frame actual en el canvas
            ctx.drawImage(video, 0, 0);

            // Detener el stream
            stream.getTracks().forEach(track => track.stop());

            // Convertir canvas a blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.8);
            });

            // Convertir blob a File
            const file = new File([blob], `captura-escritorio-${Date.now()}.png`, {
                type: 'image/png'
            });

            // Subir la imagen capturada
            await uploadImage(file);

            // Esperar un momento antes de cerrar la ventana flotante
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Cerrar ventana flotante si está abierta
            if (floatingWindow && !floatingWindow.closed) {
                floatingWindow.close();
            }

        } catch (err) {
            console.error('Error capturando escritorio:', err);
            setError('Error al capturar escritorio: ' + err.message);
        } finally {
            setCapturing(false);
            setShowDesktopCapture(false);
            setCountdown(0);
        }
    };

    // Escuchar mensaje de la ventana flotante
    React.useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'capture-now') {
                // La captura ya se está ejecutando automáticamente
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const uploadImage = async (file) => {
        setUploading(true);
        setError(null);

        try {
            if (!store.auth.token) {
                throw new Error('No hay token de autenticación disponible');
            }

            const formData = new FormData();
            formData.append('image', file);

            const url = `${import.meta.env.VITE_BACKEND_URL}/api/upload-image`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${store.auth.token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error subiendo imagen');
            }

            const data = await response.json();

            // Verificar si es una imagen placeholder
            if (data.url && data.url.includes('data:image/svg+xml')) {
                setError('⚠️ Cloudinary no está configurado. Se usará una imagen placeholder temporal.');
                return;
            }

            onImageUpload(data.url);
        } catch (error) {
            setError('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const testCloudinaryConfig = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cloudinary-status`);
            const data = await response.json();

            if (data.cloudinary_configured) {
                setError('✅ Cloudinary está configurado correctamente');
            } else {
                setError('❌ Cloudinary no está configurado. Verifica las variables de entorno.');
            }
        } catch (error) {
            console.error('Error verificando Cloudinary:', error);
            setError('Error verificando configuración de Cloudinary');
        }
    };

    return (
        <div className="image-upload-container">
            <div className="mb-3">
                <label className="form-label">
                    <i className="fas fa-image me-2"></i>
                    Imagen
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
                    <div className={`alert ${error.includes('placeholder') ? 'alert-warning' : 'alert-danger'} mt-2`} role="alert">
                        <i className={`fas ${error.includes('placeholder') ? 'fa-info-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                        {error}
                    </div>
                )}

                <div className="form-text">
                    <i className="fas fa-info-circle me-1"></i>
                    Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB. También puedes capturar tu pantalla o escritorio completo.
                </div>

                <div className="form-text small text-muted">
                    <i className="fas fa-camera me-1"></i>
                    <strong>Capturar Pantalla:</strong> Ventana o pestaña específica del navegador
                    <br />
                    <i className="fas fa-desktop me-1"></i>
                    <strong>Capturar Escritorio:</strong> Permisos amplios del sistema + ventana flotante que te acompaña
                </div>

                <div className="mt-2 d-flex gap-2 flex-wrap">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={testCloudinaryConfig}
                        disabled={disabled}
                    >
                        <i className="fas fa-cog me-1"></i>
                        Verificar Cloudinary
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={handleScreenCapture}
                        disabled={disabled || capturing}
                    >
                        {capturing ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-1" role="status">
                                    <span className="visually-hidden">Capturando...</span>
                                </div>
                                Capturando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-camera me-1"></i>
                                Capturar Pantalla
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleDesktopCapture}
                        disabled={disabled || capturing || showDesktopCapture}
                    >
                        {showDesktopCapture ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-1" role="status">
                                    <span className="visually-hidden">Preparando...</span>
                                </div>
                                Preparando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-desktop me-1"></i>
                                Capturar Escritorio
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
