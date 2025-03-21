"use client";
import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import '../../styles/pages.css';

const TriangleIcon = () => {
  return (
    <button className="relative  group z-50 bg-white rounded-md flex items-center justify-center p-2">
      <ReportProblemIcon className="w-6 h-6 red-icon" />
      <span className="absolute left-full transform -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-400 text-white text-xs rounded py-1 px-2 whitespace-nowrap mr-2 pointer-events-none">
        Anomalía detectada
      </span>
    </button>
  );
};

export default TriangleIcon;