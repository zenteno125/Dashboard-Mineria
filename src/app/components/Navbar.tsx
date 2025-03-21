"use client";
import React from "react";
import { FaWind } from "react-icons/fa";
import { FiAlignJustify } from "react-icons/fi";

const Navbar = () => {
  const windSpeed = 12.5; // Valor de velocidad del viento

  return (
    <div className="fixed top-0 left-0 w-full bg-white shadow-md flex items-center justify-between px-4 py-2 z-50">
      {/* Icono de Velocidad del Viento */}
      

      <button className="group bg-white shadow rounded-md flex items-center justify-center p-2">
        <FiAlignJustify className="w-6 h-6 text-black" />
        <span className="absolute right-full transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          Generar Resumen (24h)
        </span>
      </button>
    </div>
  );
};

export default Navbar;