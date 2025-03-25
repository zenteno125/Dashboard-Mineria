"use client";
import React from "react";

interface SensorData {
  ac: {
    valor: number;
    power: number;
  };
  dc: {
    valor: number;
    power: number;
  };
}

interface SensorsListProps {
  sensors: { [sensorName: string]: SensorData };
}

const SensorsList: React.FC<SensorsListProps> = ({ sensors }) => {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(sensors).map(([sensorName, sensorData]) => (
        <div key={sensorName} className="rounded p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-bold">{sensorName}</h2>
          </div>
          <div className="mt-2">
            <div>
              <span className="font-semibold">AC:</span> Valor: {sensorData.ac.valor}, Power: {sensorData.ac.power}
            </div>
            <div>
              <span className="font-semibold">DC:</span> Valor: {sensorData.dc.valor}, Power: {sensorData.dc.power}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SensorsList;