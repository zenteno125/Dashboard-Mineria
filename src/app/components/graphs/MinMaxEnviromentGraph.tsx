"use client";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const HorizontalBarChart = ({ summaryData }: { summaryData: any }) => {
  const labels = ["Temp", "Viento"];
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Mínimo",
        data: [
          summaryData.minTemperature,
          summaryData.minWindSpeed,
         
        ],
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Máximo",
        data: [
          summaryData.maxTemperature,
          summaryData.maxWindSpeed,
          
        ],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      title: { display: true, text: "Valores Ambientales" },
    },
  };

  return <Bar data={data} options={options} />;
};

export default HorizontalBarChart;