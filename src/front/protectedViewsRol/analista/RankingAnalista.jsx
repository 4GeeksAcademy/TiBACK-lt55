
import React, { useEffect, useState } from "react";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { tokenUtils } from "../../store";

const RankingAnalista = () => {
    const { store } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/analistas/ranking`, {
            headers: {
                'Authorization': `Bearer ${store.auth.token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                setRanking(data);
                setLoading(false);
            })
            .catch(err => {
                setError("Error al cargar ranking");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center py-4">Cargando ranking...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!Array.isArray(ranking) || ranking.length === 0) return <div className="text-center py-4">No hay datos de ranking.</div>;

    // Datos para la gráfica
    const labels = ranking.map(a => a.nombre);
    const dataTotales = ranking.map(a => a.tickets_totales);
    const dataResueltos = ranking.map(a => a.tickets_resueltos);
    const dataEscalados = ranking.map(a => a.tickets_escalados);
    const dataNegativos = ranking.map(a => a.tickets_escalados); // Negativos para la gráfica


    // Obtener email del analista actual desde el token
    const emailAnalista = tokenUtils.getEmail(store.auth.token);
    const analistaActual = ranking.find(a => a.email === emailAnalista);

    // Resumen para cápsulas
    const totalTickets = analistaActual?.tickets_totales || 0;
    const totalResueltos = analistaActual?.tickets_resueltos || 0;
    const totalEscalados = analistaActual?.tickets_escalados || 0;
    const resumen = `Resueltos: ${totalResueltos}, Escalados: ${totalEscalados}, Totales: ${totalTickets}`;

    return (
        <div className="container py-4">
            <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
                Volver
            </button>
            <h2 className="mb-4">Ranking de Analistas</h2>
            <div className="row mb-4">
                <div className="col-md-3 mb-2">
                    <div className="card text-center bg-primary text-white">
                        <div className="card-body">
                            <h5 className="card-title">Tickets Totales</h5>
                            <h2>{totalTickets}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card text-center bg-success text-white">
                        <div className="card-body">
                            <h5 className="card-title">Tickets Resueltos</h5>
                            <h2>{totalResueltos}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card text-center bg-danger text-white">
                        <div className="card-body">
                            <h5 className="card-title">Tickets Escalados</h5>
                            <h2>{totalEscalados}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-2">
                    <div className="card text-center bg-dark text-white">
                        <div className="card-body">
                            <h5 className="card-title">Resumen</h5>
                            <h6>{resumen}</h6>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white p-4 rounded shadow mb-4">
                <Bar
                    data={{
                        labels,
                        datasets: [
                            {
                                label: 'Tickets Resueltos',
                                data: dataResueltos,
                                backgroundColor: 'rgba(40, 167, 69, 0.7)'
                            },
                            {
                                label: 'Tickets Totales',
                                data: dataTotales,
                                backgroundColor: 'rgba(0, 123, 255, 0.7)'
                            },
                            {
                                label: 'Tickets Escalados',
                                data: dataEscalados,
                                backgroundColor: 'rgba(220, 53, 69, 0.7)'
                            }
                        ]
                    }}
                    options={{
                        responsive: true,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Comparativa de desempeño entre analistas' }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                suggestedMax: Math.max(...dataTotales, ...dataResueltos, ...dataEscalados) < 5 ? 5 : undefined,
                                ticks: {
                                    stepSize: 1,
                                    callback: function (value) {
                                        if (Number.isInteger(value)) return value;
                                        return '';
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default RankingAnalista;
