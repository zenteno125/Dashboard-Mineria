"use client";
import "./styles/pages.css";
import { useState, useEffect } from "react";
import { FaPlus, FaSlidersH } from "react-icons/fa";
import PlusIcon from "./components/tooltips/PlusIcon";
import { FiAlertTriangle } from "react-icons/fi";
import TriangleIcon from "./components/tooltips/TriangleIcon";
import ResElectricalIcon from "./components/tooltips/ResElectricalIcon";
import ResIrradianceIcon from "./components/tooltips/ResIrradianceIcon";
import WindSpeedButton from "./components/WindSpeed";
import ResEnviromentIcon from "./components/tooltips/ResEnviromentIcon";
import EnvironmentSummary from "./components/EnviromentSummary";
import HorizontalBarChart from "./components/graphs/MinMaxEnviromentGraph";
import EnvironmentSummarySection from "./components/EnviromentSummary";
import WindDirectionChart from "./components/graphs/WindDirection";


const Dashboard = () => {
  const [data, setData] = useState(null);

  const summaryData = {
    minTemperature: 25.3,
    maxTemperature: 45.1,
    avgTemperature: 35.2,
    minWindSpeed: 0.8,
    maxWindSpeed: 3.2,
    avgWindSpeed: 2.1,
    minWindDirection: 300,
    maxWindDirection: 180,
    avgWindDirection: 150,
    anomaliesFound: 3, // Número de anomalías detectadas
  };



  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8765");
    socket.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };
    return () => socket.close();
  }, []);

  return (
    <>
      

      <div className="h-screen pt-5">
        

        <div className="div-color rounded-lg shadow-xl h-1/2 mx-5">
          <TriangleIcon />
          
        </div>



        <div className="grid grid-cols-4 gap-4 mx-5 mt-8">


          <div className="col-span-1 div-color rounded-lg shadow-xl">
          <TriangleIcon />
          <ResIrradianceIcon />
          </div>


          <div className="col-span-1 div-color rounded-lg shadow-xl">
          <TriangleIcon />
          <ResElectricalIcon />
          </div>


          <div className="col-span-2 div-color rounded-lg shadow-xl ">
          <TriangleIcon />
          <ResEnviromentIcon /> 
          <PlusIcon /> 
          <EnvironmentSummarySection summaryData={summaryData} />
          </div>

        </div>
      </div>






    </>
  );
};

export default Dashboard;
