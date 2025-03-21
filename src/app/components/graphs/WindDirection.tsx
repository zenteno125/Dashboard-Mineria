"use client";
import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface WindDirectionChartProps {
  windDirection: number; // dirección en grados (0-360)
}

const WindDirectionChart = ({ windDirection }: WindDirectionChartProps) => {
  /*  
    En este ejemplo usamos un dataset de dos segmentos:
    - El primero representa la dirección del viento (en grados)
    - El segundo es el complemento hasta 360°
    La idea es mostrar una porción coloreada que, al ajustar la rotación del gráfico, apunte hacia la dirección deseada.
  */
  const data = {
    labels: ["Dirección", ""],
    datasets: [
      {
        data: [windDirection, 360 - windDirection],
        backgroundColor: ["#42a5f5", "rgba(0,0,0,0)"],
        borderWidth: 0,
      },
    ],
  };

  // La opción "rotation" gira el gráfico. Como el valor cero va hacia las 3 en punto, se puede ajustar para que 0° esté hacia arriba.
  const options = {
    rotation: (-90 * Math.PI) / 180, // Coloca 0° en la parte superior
    circumference: 2 * Math.PI,
    cutout: "80%", // Ajusta el grosor (la parte interna se descuenta)
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="w-40 h-40">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm font-bold">{windDirection}°</span>
      </div>
    </div>
  );
};

export default WindDirectionChart;