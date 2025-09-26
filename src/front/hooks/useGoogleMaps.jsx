import { useState, useEffect } from 'react';

// Variable global para rastrear si Google Maps ya está cargando
let googleMapsLoadingPromise = null;
let googleMapsLoaded = false;

export const useGoogleMaps = () => {
    const [isLoaded, setIsLoaded] = useState(googleMapsLoaded);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Si ya está cargado, no hacer nada
        if (googleMapsLoaded) {
            setIsLoaded(true);
            return;
        }

        // Si ya está cargando, esperar a que termine
        if (googleMapsLoadingPromise) {
            googleMapsLoadingPromise
                .then(() => {
                    setIsLoaded(true);
                    setError(null);
                })
                .catch((err) => {
                    setError(err);
                });
            return;
        }

        // Verificar si ya está disponible
        if (window.google && window.google.maps) {
            googleMapsLoaded = true;
            setIsLoaded(true);
            return;
        }

        // Crear promesa de carga
        googleMapsLoadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                // Esperar un poco para asegurar que Google Maps esté completamente inicializado
                setTimeout(() => {
                    if (window.google && window.google.maps) {
                        // Suprimir warnings específicos de Google Maps API
                        const originalConsoleWarn = console.warn;
                        console.warn = (...args) => {
                            const message = args.join(' ');
                            // Suprimir warnings específicos de Google Maps
                            if (
                                message.includes('google.maps.Marker is deprecated') ||
                                message.includes('Please use google.maps.marker.AdvancedMarkerElement') ||
                                message.includes('As of February 21st, 2024, google.maps.Marker is deprecated') ||
                                message.includes('google.maps.places.Autocomplete is not available to new customers') ||
                                message.includes('Please use google.maps.places.PlaceAutocompleteElement instead') ||
                                message.includes('As of March 1st, 2025, google.maps.places.Autocomplete')
                            ) {
                                return; // No mostrar estos warnings
                            }
                            originalConsoleWarn.apply(console, args);
                        };

                        googleMapsLoaded = true;
                        resolve();
                    } else {
                        reject(new Error('Google Maps API no se inicializó correctamente'));
                    }
                }, 100);
            };

            script.onerror = () => {
                reject(new Error('Error al cargar Google Maps API'));
            };

            document.head.appendChild(script);
        });

        googleMapsLoadingPromise
            .then(() => {
                setIsLoaded(true);
                setError(null);
            })
            .catch((err) => {
                setError(err);
            });
    }, []);

    return { isLoaded, error };
};
