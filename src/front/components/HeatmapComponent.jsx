import React, { useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import useGlobalReducer from '../hooks/useGlobalReducer';

const HeatmapComponent = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [showMarkers, setShowMarkers] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 19.4326, lng: -99.1332 });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [mapInitialized, setMapInitialized] = useState(false);
    const { isLoaded, error: googleMapsError } = useGoogleMaps();
    const { store } = useGlobalReducer();

    const fetchHeatmapData = async () => {
        try {
            setLoading(true);

            // Obtener token del store
            const token = store.auth.token;
            if (!token) {
                throw new Error('Token de autorización no encontrado');
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/heatmap-data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const responseData = await response.json();

            // El backend devuelve { message, data, total_points }
            const data = responseData.data || [];

            // Validar que data es un array
            if (!Array.isArray(data)) {
                setRawData([]);
                setHeatmapData([]);
                setError('Formato de datos inválido');
                return;
            }

            setRawData(data);

            // Procesar datos para el heatmap con pesos dinámicos de manera suave
            const processedData = data.map((item, index) => ({
                location: new window.google.maps.LatLng(item.lat, item.lng),
                weight: Math.max(1, Math.min(10, (index + 1) * 0.5)) // Peso dinámico basado en el índice
            }));

            // Actualizar datos inmediatamente para mejor rendimiento
            setHeatmapData(processedData);
            setError(null);

        } catch (err) {
            setError(err.message);
        } finally {
            // Transición suave de loading
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded && !googleMapsError) {
            fetchHeatmapData();
        }
    }, [isLoaded, googleMapsError]);

    // Asegurar que el mapRef esté disponible después del montaje
    useEffect(() => {
        const checkMapRef = () => {
            if (mapRef.current && isLoaded && !googleMapsError && !mapInstanceRef.current) {
                initializeMap();
            }
        };

        // Verificar inmediatamente
        checkMapRef();

        // Verificar después de un pequeño delay
        const timeoutId = setTimeout(checkMapRef, 200);

        return () => clearTimeout(timeoutId);
    }, [isLoaded, googleMapsError]);

    // Escuchar nuevos tickets en tiempo real
    useEffect(() => {
        const socket = store.websocket.socket;
        if (socket) {
            const handleNewTicket = (data) => {
                // Recargar datos del mapa cuando se cree un nuevo ticket
                fetchHeatmapData();
            };

            socket.on('nuevo_ticket', handleNewTicket);
            socket.on('nuevo_ticket_disponible', handleNewTicket);

            return () => {
                socket.off('nuevo_ticket', handleNewTicket);
                socket.off('nuevo_ticket_disponible', handleNewTicket);
            };
        }
    }, [store.websocket.socket]);

    const initializeMap = () => {
        if (!window.google || !window.google.maps) {
            return;
        }

        if (!mapRef.current) {
            setTimeout(() => {
                if (mapRef.current && !mapInstanceRef.current) {
                    initializeMap();
                }
            }, 100);
            return;
        }

        // Evitar reinicialización si el mapa ya existe
        if (mapInstanceRef.current) {
            return;
        }

        try {

            const map = new window.google.maps.Map(mapRef.current, {
                center: mapCenter,
                zoom: 10,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,
                // Configuraciones para suavizar la carga
                gestureHandling: 'cooperative',
                zoomControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT
                },
                // Configuraciones adicionales para mejor rendimiento
                disableDefaultUI: false,
                clickableIcons: true,
                keyboardShortcuts: true,
                scrollwheel: true,
                disableDoubleClickZoom: false
            });

            // Guardar referencia del mapa
            mapInstanceRef.current = map;
            setMapInitialized(true);

            // Forzar redibujado del mapa
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
                }
            }, 100);

        } catch (error) {
            console.error('Error al crear el mapa:', error);
        }

        // Los marcadores se crearán en el useEffect de actualización de marcadores
        // para evitar problemas de scope y timing
    };

    // Inicializar mapa cuando Google Maps esté listo Y el mapRef esté disponible
    useEffect(() => {
        if (isLoaded && !googleMapsError && !mapInstanceRef.current && mapRef.current) {
            initializeMap();
        } else if (isLoaded && !googleMapsError && !mapInstanceRef.current && !mapRef.current) {
            // Reintentar después de un delay más largo
            const timeoutId = setTimeout(() => {
                if (mapRef.current && !mapInstanceRef.current) {
                    initializeMap();
                }
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [isLoaded, googleMapsError, mapRef.current]);

    // Actualizar marcadores cuando cambien los datos o el estado de mostrar marcadores
    useEffect(() => {
        if (mapInstanceRef.current && heatmapData.length > 0) {
            // Limpiar marcadores existentes
            markersRef.current.forEach(marker => {
                marker.setMap(null);
            });
            markersRef.current = [];

            // Crear nuevos marcadores si están habilitados
            if (showMarkers && rawData.length > 0) {
                rawData.forEach((item, index) => {
                    const marker = new window.google.maps.Marker({
                        position: { lat: item.lat, lng: item.lng },
                        map: mapInstanceRef.current,
                        title: `Ticket #${item.ticket_id} - ${item.ticket_titulo}`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: '#ff0000',
                            fillOpacity: 0.8,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 8
                        }
                    });

                    // Crear InfoWindow con información completa del ticket
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="padding: 15px; max-width: 400px; font-family: Arial, sans-serif;">
                                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                                    <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #007bff, #0056b3); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                        <i class="fas fa-ticket-alt" style="color: white; font-size: 18px;"></i>
                                    </div>
                                    <div>
                                        <h6 style="margin: 0; color: #333; font-weight: bold; font-size: 16px;">
                                            Ticket #${item.ticket_id}
                                        </h6>
                                        <p style="margin: 3px 0 0 0; color: #666; font-size: 13px;">
                                            <i class="fas fa-tag" style="margin-right: 5px;"></i>
                                            ${item.ticket_titulo}
                                        </p>
                                    </div>
                                </div>
                                
                                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                                    <h6 style="margin: 0 0 8px 0; color: #495057; font-size: 13px; font-weight: bold;">
                                        <i class="fas fa-file-alt" style="margin-right: 6px; color: #007bff;"></i>
                                        Descripción del Ticket
                                    </h6>
                                    <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.4; max-height: 60px; overflow-y: auto;">
                                        ${item.ticket_descripcion}
                                    </p>
                                </div>
                                
                                <div style="border-top: 1px solid #eee; padding-top: 12px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <div style="flex: 1; margin-right: 10px;">
                                            <p style="margin: 0; color: #555; font-size: 12px;">
                                                <i class="fas fa-info-circle" style="color: #007bff; margin-right: 6px;"></i>
                                                <strong>Estado:</strong> ${item.ticket_estado}
                                            </p>
                                        </div>
                                        <div style="flex: 1;">
                                            <p style="margin: 0; color: #555; font-size: 12px;">
                                                <i class="fas fa-exclamation-triangle" style="color: #ffc107; margin-right: 6px;"></i>
                                                <strong>Prioridad:</strong> ${item.ticket_prioridad}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div style="border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
                                        <p style="margin: 4px 0; color: #555; font-size: 12px;">
                                            <i class="fas fa-user" style="color: #28a745; margin-right: 6px;"></i>
                                            <strong>Cliente:</strong> ${item.cliente_nombre} ${item.cliente_apellido || ''}
                                        </p>
                                        <p style="margin: 4px 0; color: #555; font-size: 12px;">
                                            <i class="fas fa-envelope" style="color: #6c757d; margin-right: 6px;"></i>
                                            <strong>Email:</strong> ${item.cliente_email}
                                        </p>
                                        <p style="margin: 4px 0; color: #555; font-size: 12px;">
                                            <i class="fas fa-map-marker-alt" style="color: #dc3545; margin-right: 6px;"></i>
                                            <strong>Dirección:</strong> ${item.cliente_direccion}
                                        </p>
                                        ${item.cliente_telefono ? `
                                            <p style="margin: 4px 0; color: #555; font-size: 12px;">
                                                <i class="fas fa-phone" style="color: #17a2b8; margin-right: 6px;"></i>
                                                <strong>Teléfono:</strong> ${item.cliente_telefono}
                                            </p>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <div style="margin-top: 12px; padding: 8px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #007bff;">
                                    <p style="margin: 0; color: #1976d2; font-size: 11px; font-style: italic;">
                                        <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                                        Haz clic para ver más detalles y opciones de navegación
                                    </p>
                                </div>
                            </div>
                        `,
                        // Configuraciones para evitar movimiento del mapa
                        disableAutoPan: true,
                        pixelOffset: new window.google.maps.Size(0, -10)
                    });

                    // Mostrar InfoWindow al hacer hover solo si los marcadores están habilitados
                    marker.addListener('mouseover', () => {
                        if (showMarkers) {
                            // Cerrar cualquier InfoWindow abierto previamente
                            if (window.currentInfoWindow) {
                                window.currentInfoWindow.close();
                            }
                            // Abrir el nuevo InfoWindow sin centrar el mapa
                            infoWindow.open(mapInstanceRef.current, marker);
                            // Guardar referencia para cerrarlo después
                            window.currentInfoWindow = infoWindow;
                        }
                    });

                    // Ocultar InfoWindow al salir del hover
                    marker.addListener('mouseout', () => {
                        // Pequeño delay para evitar parpadeo
                        setTimeout(() => {
                            if (window.currentInfoWindow === infoWindow) {
                                infoWindow.close();
                                window.currentInfoWindow = null;
                            }
                        }, 100);
                    });

                    marker.addListener('click', () => {
                        setSelectedMarker({
                            id: index,
                            data: item,
                            marker: marker
                        });
                    });

                    // Guardar referencia del marcador
                    markersRef.current.push(marker);
                });
            }
        }
    }, [heatmapData, showMarkers, rawData]);

    const goToLocation = (lat, lng) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(15);
        }
    };

    const centerOnAllPoints = () => {
        if (rawData.length === 0 || !mapInstanceRef.current) return;

        setIsTransitioning(true);

        const bounds = new window.google.maps.LatLngBounds();
        rawData.forEach(item => {
            bounds.extend(new window.google.maps.LatLng(item.lat, item.lng));
        });

        mapInstanceRef.current.fitBounds(bounds);

        // Ajustar el zoom si es necesario
        const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
            if (mapInstanceRef.current.getZoom() > 15) {
                mapInstanceRef.current.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
            setIsTransitioning(false);
        });
    };

    const toggleMarkers = () => {
        setIsTransitioning(true);
        setShowMarkers(!showMarkers);
        // Transición suave
        setTimeout(() => {
            setIsTransitioning(false);
        }, 300);
    };

    if (!isLoaded) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Cargando mapa...</span>
                    </div>
                    <p className="text-muted">Cargando Google Maps...</p>
                </div>
            </div>
        );
    }

    if (googleMapsError) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Error al cargar Google Maps: {googleMapsError.message}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Cargando datos...</span>
                    </div>
                    <p className="text-muted">Cargando datos del mapa de calor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Error al cargar el mapa de calor: {error}
            </div>
        );
    }

    return (
        <div className="heatmap-container">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                    <i className="fas fa-map-marker-alt me-2 text-danger"></i>
                    Mapa de Distribución de Tickets
                </h5>
                <div className="btn-group" role="group">
                    <button
                        type="button"
                        className={`btn btn-outline-primary btn-sm ${isTransitioning ? 'disabled' : ''}`}
                        onClick={toggleMarkers}
                        disabled={isTransitioning}
                    >
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {isTransitioning ? 'Procesando...' : (showMarkers ? 'Ocultar' : 'Mostrar') + ' Marcadores'}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-outline-success btn-sm ${isTransitioning ? 'disabled' : ''}`}
                        onClick={centerOnAllPoints}
                        disabled={isTransitioning}
                    >
                        <i className="fas fa-expand-arrows-alt me-1"></i>
                        {isTransitioning ? 'Centrando...' : 'Ver Todos'}
                    </button>
                </div>
            </div>

            <div className="map-container" style={{ height: '500px', width: '100%', position: 'relative' }}>
                {!mapInitialized && (
                    <div className="d-flex justify-content-center align-items-center" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        zIndex: 1000
                    }}>
                        <div className="text-center">
                            <div className="spinner-border text-primary mb-3" role="status">
                                <span className="visually-hidden">Cargando mapa...</span>
                            </div>
                            <p className="text-muted">Inicializando mapa...</p>
                        </div>
                    </div>
                )}
                <div
                    ref={mapRef}
                    style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: '8px',
                        backgroundColor: '#e9ecef'
                    }}
                />
            </div>

            {/* Tarjeta de información del cliente oculta */}

            {rawData.length > 0 && (
                <div className="mt-3">
                    <h6>
                        <i className="fas fa-list me-2"></i>
                        Sugerencias de Navegación
                    </h6>
                    <div className="row">
                        {rawData.slice(0, 6).map((item, index) => (
                            <div key={index} className="col-md-4 mb-2">
                                <div className="card h-100">
                                    <div className="card-body p-2">
                                        <h6 className="card-title small mb-1">Ticket #${item.ticket_id}</h6>
                                        <p className="card-text small text-muted mb-1">{item.ticket_titulo}</p>
                                        <p className="card-text small text-muted mb-1">
                                            <strong>Cliente:</strong> {item.cliente_nombre} {item.cliente_apellido}
                                        </p>
                                        <button
                                            className="btn btn-outline-primary btn-sm w-100"
                                            onClick={() => goToLocation(item.lat, item.lng)}
                                        >
                                            <i className="fas fa-map-marker-alt me-1"></i>
                                            Ir a ubicación
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeatmapComponent;