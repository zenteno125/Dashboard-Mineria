"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

// Registrar los componentes de Chart.js necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  ScatterController,
  Title,
  Tooltip,
  Legend
);

// Interfaz para los datos de irradiancia vs potencia
interface IrradianceVsPowerData {
  graph_type: string;
  description: string;
  data: {
    timestamp: string;
    irradiance: number;
    total_power: number;
  }[];
  expected_time: string;
  alert: string | null;
}

const IrradianceVsPowerGraph = () => {
  const [graphData, setGraphData] = useState<IrradianceVsPowerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener datos del endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<IrradianceVsPowerData>('http://localhost:8000/irradiance-vs-power');
        setGraphData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al obtener datos de irradiancia vs potencia:', err);
        setError('No se pudieron cargar los datos. Verifica que el servidor esté en funcionamiento.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Opcional: actualizar cada cierto tiempo
    const intervalId = setInterval(fetchData, 30000); // cada 30 segundos
    
    return () => clearInterval(intervalId);
  }, []);

  // Configurar datos para Chart.js
  const chartData = {
    datasets: [
      {
        label: 'Irradiancia vs Potencia',
        data: graphData?.data.map(item => ({
          x: item.irradiance,
          y: item.total_power
        })) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  // Opciones del gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Irradiancia (W/m²)',
          color: '#666',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Potencia Generada (W)',
          color: '#666',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#666',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            return [
              `Irradiancia: ${context.parsed.x} W/m²`,
              `Potencia: ${context.parsed.y} W`
            ];
          }
        }
      },
      title: {
        display: true,
        text: graphData?.description || 'Relación entre Irradiancia y Potencia',
        color: '#333',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    }
  };

  return (
    <div className="p-2 h-full w-full">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px' }}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box sx={{ height: 'calc(100% - 20px)', minHeight: '200px', position: 'relative' }}>
          <Scatter data={chartData} options={options} />
          
          {graphData?.alert && (
            <Box sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              backgroundColor: 'rgba(255, 193, 7, 0.9)',
              borderRadius: '4px',
              padding: '4px 8px'
            }}>
              <Typography variant="caption" fontWeight="bold">
                {graphData.alert}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
};

export default IrradianceVsPowerGraph; 