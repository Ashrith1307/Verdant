// ------------------- Imports -------------------
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");

// ------------------- App & Server Setup -------------------
const app = express();
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: [
          
      "https://verdaunt.netlify.app" // for Netlify deployment
    ],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

// ------------------- Middleware -------------------
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists (important for Render)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads directory");
}

// Serve static files (images)
app.use("/uploads", express.static(uploadDir));

// ------------------- MongoDB -------------------
const MONGO_URI = "mongodb+srv://devarapallyashrithreddy_db_user:13-01-2007@cluster0.ob19tju.mongodb.net/";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ------------------- Schema -------------------
const droneDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: { lat: Number, lon: Number },
  crop_detection: String,
  disease_detection: String,
  pesticide_recommendation: String,
  image_path: String
});

const DroneData = mongoose.model("DroneData", droneDataSchema);

// ------------------- Multer Setup -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});

const upload = multer({ storage });

// ------------------- Routes -------------------

// Upload from Raspberry Pi
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    // Ensure metadata is received and parsed correctly
    const metadata = JSON.parse(req.body.metadata);

    const newRecord = new DroneData({
      timestamp: metadata.timestamp || Date.now(),
      location: metadata.location,
      crop_detection: metadata.crop_detection,
      disease_detection: metadata.disease_detection,
      pesticide_recommendation: metadata.pesticide_recommendation,
      image_path: `/uploads/${req.file.filename}`,
    });

    await newRecord.save();

    // Emit to connected clients in real-time
    io.emit("drone-update", {
      disease: newRecord.disease_detection,
      infection: "Medium",
      pesticide: newRecord.pesticide_recommendation,
      precautions: "Inspect infected area and apply recommended pesticide.",
      yieldLoss: "N/A",
      image: newRecord.image_path,
    });

    console.log("📡 New drone data broadcasted via socket.io");
    res.json({ status: "success", record: newRecord });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(400).json({ status: "error", message: err.message });
  }
});

// Fetch latest drone data
app.get("/api/data/latest", async (req, res) => {
  try {
    const latest = await DroneData.findOne().sort({ timestamp: -1 });
    res.json({ status: "success", data: latest });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("🌱 Verdanaut backend is running!");
});

// ------------------- Start Server -------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});