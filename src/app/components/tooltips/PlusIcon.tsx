"use client";
import React from "react";
import { FiAlignJustify } from "react-icons/fi";

const PlusIcon = () => {
  return (
    <button className="relative  group z-50 bg-white rounded-md flex items-center justify-center p-2">
      <FiAlignJustify className="w-6 h-6 text-black" />
      <span className="absolute right-full transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap pointer-events-none">
        Generar Resumen (24h)
      </span>
    </button>
  );
};

export default PlusIcon;


