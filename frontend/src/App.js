import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, AlertTriangle, Sprout, Activity, CloudSun } from "lucide-react";
import { io } from "socket.io-client";
import './App.css';

// Connect to backend socket
const socket = io("https://verdant-1-rg7g.onrender.com");

export default function App() {
  const [droneData, setDroneData] = useState({
    image: "",
    pesticide: "",
    crop: "",
    disease: "",
    temperature: "",
    humidity: "",
    status: "Connecting..."
  });

  useEffect(() => {
    // Listen for drone updates from backend
    socket.on("droneData", (data) => {
      setDroneData(data);
    });

    socket.on("connect", () => {
      setDroneData(prev => ({ ...prev, status: "Connected" }));
    });

    socket.on("disconnect", () => {
      setDroneData(prev => ({ ...prev, status: "Disconnected" }));
    });

    return () => {
      socket.off("droneData");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>Drone Crop Monitoring Dashboard</h1>
        <p>Status: <strong>{droneData.status}</strong></p>
      </header>

      <motion.div 
        className="drone-dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="image-section">
          {droneData.image ? (
            <img src={droneData.image} alt="Drone View" />
          ) : (
            <div className="placeholder">No Image Available</div>
          )}
        </div>

        <div className="info-section">
          <div className="info-card">
            <Leaf size={24} />
            <span style={{ color: 'yellow' }}>Crop: {droneData.crop || "Cotton"}</span>
          </div>
          <div className="info-card">
            <Sprout size={24} />
            <span style={{ color: 'green' }}>Pesticide: {droneData.pesticide || "esv"}</span>
          </div>
          <div className="info-card">
            <AlertTriangle size={24} />
            <span style={{ color: 'red' }}>Disease: {droneData.disease || "wegu"}</span>
          </div>
          <div className="info-card">
            <CloudSun size={24} />
            <span>Temperature: {droneData.temperature || "31 C"} °C</span>
          </div>
          <div className="info-card">
            <Activity size={24} />
            <span>Humidity: {droneData.humidity || "64"} %</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}