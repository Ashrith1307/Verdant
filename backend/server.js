const express = require("express");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 8000;

// ------------------- HTTP & Socket.IO -------------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

// ------------------- Middleware -------------------
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ------------------- MongoDB -------------------
const MONGO_URI = "mongodb+srv://devarapallyashrithreddy_db_user:13-01-2007@cluster0.ob19tju.mongodb.net/";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("MongoDB connection error:", err));

// ------------------- Mongoose Schema -------------------
const droneDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  location: { lat: Number, lon: Number },
  crop_detection: String,
  disease_detection: String,
  pesticide_recommendation: String,
  image_path: String
});

const DroneData = mongoose.model("DroneData", droneDataSchema);

// ------------------- Multer -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// ------------------- Routes -------------------

// Upload drone data
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
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

    // Emit real-time update
    io.emit("drone-update", {
      disease: newRecord.disease_detection,
      infection: "Medium", // placeholder
      pesticide: newRecord.pesticide_recommendation,
      precautions: "Check infected area and apply recommended pesticide",
      yieldLoss: "N/A",
      image: newRecord.image_path,
    });

    res.json({ status: "success", record: newRecord });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
});

// Get latest drone data
app.get("/api/data/latest", async (req, res) => {
  try {
    const latest = await DroneData.findOne().sort({ timestamp: -1 });
    res.json({ status: "success", data: latest });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Start server
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));