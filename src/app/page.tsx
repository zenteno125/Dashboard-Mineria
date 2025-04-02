"use client";
import "./styles/pages.css";
import { useState, useEffect } from "react";
import PlusIcon from "./components/tooltips/PlusIcon";
import TriangleIcon from "./components/tooltips/TriangleIcon";
import ResElectricalIcon from "./components/tooltips/ResElectricalIcon";
import ResIrradianceIcon from "./components/tooltips/ResIrradianceIcon";
import ResEnviromentIcon from "./components/tooltips/ResEnviromentIcon";
import EnvironmentSummary from "./components/EnviromentSummary";
import HorizontalBarChart from "./components/graphs/MinMaxEnviromentGraph";
import EnvironmentSummarySection from "./components/EnviromentSummary";
import SensorsList from "./components/sensorCount";
import ReportModal from "./components/ModalResumen";


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
    anomaliesFound: 3,
  };

  const sensorsData = {
    "Sensor 1": {
      ac: { valor: 10, power: 50 },
      dc: { valor: 5, power: 25 }
    },
    "Sensor 2": {
      ac: { valor: 12, power: 55 },
      dc: { valor: 6, power: 30 }
    },
    "Sensor 3": {
      ac: { valor: 12, power: 55 },
      dc: { valor: 6, power: 43 }
    },
    "Sensor 4": {
      ac: { valor: 12, power: 55 },
      dc: { valor: 6, power: 27 }
    },
    "Sensor 5": {
      ac: { valor: 12, power: 55 },
      dc: { valor: 6, power: 32 }
    },
    // Agrega más sensores aquí
  };



  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8765");
    socket.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };
    return () => socket.close();
  }, []);

  const [openModal, setOpenModal] = useState(false);

  return (
    <>

      <div className="h-screen pt-5">
        
        <div className="div-color rounded-lg shadow-xl h-1/2 mx-5">
          <TriangleIcon />

                    {/*aqui van graficas importantes*/}

        </div>

        <div className="grid grid-cols-4 gap-4 mx-5 mt-8">

          <div className="col-span-1 div-color rounded-lg shadow-xl">
            <div className="flex justify-start items-center space-x-4 p-4">
              <ResIrradianceIcon />
              <TriangleIcon />
            </div>

                      {/*aqui van graficas de irradiancia*/}

          </div>

          <div className="col-span-1 div-color rounded-lg shadow-xl ">
            <div className="flex justify-start items-center space-x-4 p-4 ">
              <ResElectricalIcon />
              <TriangleIcon />
            </div>
              
            <div className="p-4 text-black max-h-80 overflow-y-auto custom-scroll">
              <SensorsList sensors={sensorsData} />
            </div>

          </div>

          <div className="col-span-2 div-color rounded-lg shadow-xl ">
            <div className="flex justify-start items-center space-x-4 p-4">
              <ResEnviromentIcon />
              <div onClick={() => setOpenModal(true)} style={{ cursor: "pointer" }}>
                <PlusIcon />
              </div>
              <TriangleIcon />
            </div> 

          <EnvironmentSummarySection summaryData={summaryData} />
          </div>

        </div>
      </div>
      <ReportModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
};

export default Dashboard;
