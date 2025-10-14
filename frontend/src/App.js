import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, AlertTriangle, Sprout, Activity, CloudSun } from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
import './App.css';

const socket = io("https://verdant-1-rg7g.onrender.com");

export default function App() {
  const [droneData, setDroneData] = useState({});
  const [weather, setWeather] = useState({ temp: "Loading...", condition: "Loading..." });

  // Fetch latest drone data on load
  useEffect(() => {
    const fetchDroneData = async () => {
      try {
        const response = await axios.get("https://verdant-1-rg7g.onrender.com/api/data/latest");
        const data = response.data.data;
        if (data) setDroneData({ ...data, image: data.image_path });
      } catch (err) {
        console.error(err);
      }
    };
    fetchDroneData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    socket.on("drone-update", (data) => setDroneData(data));
    return () => socket.off("drone-update");
  }, []);

  // Weather fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = "YOUR_OPENWEATHERMAP_API_KEY";
        const city = "YourCity";
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );
        setWeather({
          temp: response.data.main.temp,
          condition: response.data.weather[0].description,
        });
      } catch (err) {
        setWeather({ temp: "N/A", condition: "Unable to fetch" });
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        🌾 Smart Drone Crop Health Dashboard
      </h1>

      <motion.div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-2xl">
        <div className="text-center mb-6">
          <p className="text-green-600 font-medium">Live Drone Feed</p>
        </div>

        <motion.div className="grid gap-4">
          <Card icon={<Leaf />} title="Disease" value={droneData.disease || "Loading..."} color={droneData.disease === "Healthy" ? "green" : "red"} />
          <Card icon={<Activity />} title="Infection Level" value={droneData.infection || "Medium"} color="orange" />
          <Card icon={<Sprout />} title="Pesticide" value={droneData.pesticide || "Loading..."} color="green" />
          <Card icon={<AlertTriangle />} title="Precautions" value={droneData.precautions || "Loading..."} color="green" />
          <Card icon={<Leaf />} title="Yield Loss" value={droneData.yieldLoss || "N/A"} color="orange" />
          <Card icon={<CloudSun />} title="Weather" value={`${weather.temp}°C, ${weather.condition}`} color="green" />
        </motion.div>

        {droneData.image && (
          <div className="mt-4 text-center">
            <img src={`https://verdant-1-rg7g.onrender.com${droneData.image}`} alt="Drone" className="mx-auto max-w-full rounded-lg shadow-md" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Card({ icon, title, value, color }) {
  const colorMap = {
    green: "text-green-700 border-green-300 bg-green-100",
    red: "text-red-700 border-red-300 bg-red-100",
    orange: "text-yellow-700 border-yellow-300 bg-yellow-100",
  };
  return (
    <motion.div whileHover={{ scale: 1.02 }} className={`rounded-xl p-4 shadow-sm border ${colorMap[color]} transition`}>
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="text-base font-medium">{value}</p>
    </motion.div>
  );
}