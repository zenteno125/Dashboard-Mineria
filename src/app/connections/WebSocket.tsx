import React, { useEffect, useState } from "react";

const WebSocketComponent: React.FC = () => {
    const [data, setData] = useState<unknown>(null);


  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8765");

    socket.onopen = () => {
      console.log("Conectado al WebSocket ✅");
    };

    socket.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        setData(receivedData);
        console.log("Datos recibidos:", receivedData);
      } catch (error) {
        console.error("Error al procesar los datos del WebSocket:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Error en el WebSocket ❌", error);
    };

    socket.onclose = () => {
      console.log("WebSocket desconectado 🔌");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h2>📡 Datos en Tiempo Real</h2>
      {data ? (
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Esperando datos del servidor...</p>
      )}
    </div>
  );
};

export default WebSocketComponent;
