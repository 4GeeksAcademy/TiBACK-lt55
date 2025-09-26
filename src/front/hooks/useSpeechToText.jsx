import React, { useState, useRef, useCallback } from 'react';

export const useSpeechToText = () => {
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const finalTranscriptRef = useRef('');
    const debounceTimeoutRef = useRef(null);

    // Verificar si el navegador soporta Speech Recognition
    const checkSupport = useCallback(() => {
        try {
            // Verificar si estamos en un contexto seguro (HTTPS o localhost)
            const isSecureContext = window.isSecureContext ||
                location.protocol === 'https:' ||
                location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1';

            if (!isSecureContext) {
                setError('El reconocimiento de voz requiere HTTPS o localhost');
                setIsSupported(false);
                return false;
            }

            // Verificar si existe la API de Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                // Intentar crear una instancia para verificar que realmente funciona
                try {
                    const testRecognition = new SpeechRecognition();
                    setIsSupported(true);
                    setError(null);
                    return true;
                } catch (testError) {
                    console.warn('Speech Recognition disponible pero no funcional:', testError);
                    setError('Reconocimiento de voz no disponible en este contexto');
                    setIsSupported(false);
                    return false;
                }
            } else {
                setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.');
                setIsSupported(false);
                return false;
            }
        } catch (err) {
            console.error('Error verificando soporte de Speech Recognition:', err);
            setError('Error verificando compatibilidad de reconocimiento de voz');
            setIsSupported(false);
            return false;
        }
    }, []);

    // Verificar compatibilidad al inicializar el hook
    React.useEffect(() => {
        checkSupport();
    }, [checkSupport]);

    // Inicializar reconocimiento de voz
    const initializeRecognition = useCallback(() => {
        if (!checkSupport()) return null;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES'; // Español
        recognition.maxAlternatives = 1; // Solo la mejor alternativa

        // Optimizaciones para mayor velocidad y precisión
        if (recognition.serviceURI) {
            recognition.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
        }

        // Configuraciones adicionales para mejor rendimiento
        if (recognition.grammars) {
            recognition.grammars = new SpeechGrammarList();
        }

        recognition.onstart = () => {
            setIsListening(true);
            setIsPaused(false);
            setError(null);
            setInterimTranscript('');
            finalTranscriptRef.current = '';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            // Procesar todos los resultados desde el último índice procesado
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript.trim();

                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript + ' ';
                }
            }

            // Limpiar espacios extra
            finalTranscript = finalTranscript.trim();
            interimTranscript = interimTranscript.trim();

            // Actualizar el transcript final acumulado
            if (finalTranscript) {
                // Solo agregar si no está duplicado
                const currentFinal = finalTranscriptRef.current.trim();
                if (!currentFinal.includes(finalTranscript)) {
                    finalTranscriptRef.current += finalTranscript + ' ';
                    setTranscript(prev => {
                        const newText = prev + finalTranscript + ' ';
                        return newText.trim();
                    });
                }
                setInterimTranscript(''); // Limpiar interim cuando hay resultado final
            }

            // Mostrar resultado intermedio en tiempo real (sin corchetes) con debounce
            if (interimTranscript) {
                // Limpiar timeout anterior
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                }

                // Actualizar inmediatamente para respuesta rápida
                setInterimTranscript(interimTranscript);

                // Debounce para evitar actualizaciones excesivas
                debounceTimeoutRef.current = setTimeout(() => {
                    setInterimTranscript(prev => prev);
                }, 100);
            }
        };

        recognition.onerror = (event) => {
            console.error('Error de Speech Recognition:', event.error);
            setError(`Error de reconocimiento: ${event.error}`);
            setIsListening(false);
            setIsPaused(false);
            setInterimTranscript('');
        };

        recognition.onend = () => {
            setIsListening(false);
            setIsPaused(false);
            setInterimTranscript('');

            // Limpiar timeout de debounce
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
        };

        return recognition;
    }, [checkSupport]);

    // Iniciar transcripción
    const startTranscription = useCallback(() => {
        if (isListening) return;

        setError(null);
        setTranscript('');

        const recognition = initializeRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            setError('Error al iniciar el reconocimiento de voz');
        }
    }, [isListening, initializeRecognition]);

    // Pausar/reanudar transcripción
    const togglePause = useCallback(() => {
        if (!recognitionRef.current) return;

        if (isPaused) {
            try {
                recognitionRef.current.start();
                setIsPaused(false);
            } catch (err) {
                setError('Error al reanudar el reconocimiento');
            }
        } else {
            recognitionRef.current.stop();
            setIsPaused(true);
        }
    }, [isPaused]);

    // Detener transcripción
    const stopTranscription = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
        setIsPaused(false);
    }, []);

    // Limpiar transcripción
    const clearTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        finalTranscriptRef.current = '';
    }, []);

    // Función alternativa usando Google Speech-to-Text API
    const transcribeWithGoogleAPI = useCallback(async (audioBlob) => {
        const apiKey = import.meta.env.VITE_GOOGLE_SPEECH_API_KEY;

        if (!apiKey) {
            setError('API Key de Google Speech no configurada');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');
            formData.append('config', JSON.stringify({
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'es-ES',
                enableAutomaticPunctuation: true
            }));

            const response = await fetch(
                `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Error de API: ${response.status}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const transcription = data.results
                    .map(result => result.alternatives[0].transcript)
                    .join(' ');
                setTranscript(prev => prev + transcription);
            }
        } catch (err) {
            setError(`Error en transcripción: ${err.message}`);
        }
    }, []);

    // Función para grabar audio y transcribir
    const startRecording = useCallback(async () => {
        if (isListening) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await transcribeWithGoogleAPI(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
            setError(null);
        } catch (err) {
            setError('Error al acceder al micrófono');
        }
    }, [isListening, transcribeWithGoogleAPI]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        isPaused,
        transcript,
        interimTranscript,
        error,
        isSupported,
        startTranscription,
        togglePause,
        stopTranscription,
        clearTranscript,
        startRecording,
        stopRecording
    };
};
