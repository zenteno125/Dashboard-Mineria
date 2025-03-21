"use client";
import React from "react";
import { FaWind } from "react-icons/fa";

const WindSpeedButton = () => {
  const windSpeed = 12.5;

  return (
    <div className="fixed top-4 right-5 group z-50 bg-white shadow rounded-md flex items-center justify-center p-2">
      <FaWind  className="w-6 h-6 text-black" />
      <p className="mx-2 text-black">{windSpeed} m/s</p>
      <span className="ml-2 left-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
        Velocidad del Viento
      </span>
    </div>
  );
};

export default WindSpeedButton;