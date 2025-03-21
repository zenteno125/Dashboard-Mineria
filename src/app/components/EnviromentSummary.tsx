"use client";
import React from "react";
import StormIcon from '@mui/icons-material/Storm';
import AirIcon from '@mui/icons-material/Air';
import SpeedIcon from '@mui/icons-material/Speed';
import HorizontalBarChart from "./graphs/MinMaxEnviromentGraph";
import WindDirectionChart from "./graphs/WindDirection";
import { FaTemperatureLow } from "react-icons/fa";



interface SummaryData {
  minTemperature: number;
  maxTemperature: number;
  avgTemperature: number;
  minWindSpeed: number;
  maxWindSpeed: number;
  avgWindSpeed: number;
  minWindDirection: number;
  maxWindDirection: number;
  avgWindDirection: number;
  anomaliesFound: number;
}

const EnvironmentSummarySection = ({ summaryData }: { summaryData: SummaryData }) => {
  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 text-black">
      {/* Lista de iconos con valores */}
      <div className="flex flex-col space-y-4 md:w-1/2">
        {/* Bloque Temperatura */}
        <div className="flex items-center space-x-3 p-2 bg-white rounded shadow">
          <FaTemperatureLow style={{ color: "#f56565" }} className="w-8 h-8" />
          <div>
            <p className="font-medium">Temp (°C)</p>
            <p>Mín: {summaryData.minTemperature}°</p>
            <p>Máx: {summaryData.maxTemperature}°</p>
            <p>Prom: {summaryData.avgTemperature}°</p>
          </div>
        </div>
        {/* Bloque Velocidad de Viento */}
        <div className="flex items-center space-x-3 p-2 bg-white rounded shadow">
          <SpeedIcon style={{ color: "#68d391" }} className="w-8 h-8" />
          <div>
            <p className="font-medium">Viento (m/s)</p>
            <p>Mín: {summaryData.minWindSpeed}</p>
            <p>Máx: {summaryData.maxWindSpeed}</p>
            <p>Prom: {summaryData.avgWindSpeed}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="w-full md:w-1/2 h-64">
        <HorizontalBarChart summaryData={summaryData} />
       
      </div>
    </div>
  );
};

export default EnvironmentSummarySection;