"use client";
import React from "react";
import { FiBarChart } from "react-icons/fi";

const TriangleIcon = () => {
  return (
    <button className="relative group z-50 bg-white rounded-md flex items-center justify-center p-2">
      <FiBarChart className="w-6 h-6 text-black" />
      <span className="absolute right-full top-1/2 transform -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap pointer-events-none">
        Ver Historial
      </span>
    </button>
  );
};

export default TriangleIcon;