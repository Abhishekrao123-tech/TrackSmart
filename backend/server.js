const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const verifyToken = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/", (req, res) => {
  res.send("TrackSmart Backend Running 🚀");
});

app.get("/api/profile", verifyToken, (req, res) => {
  res.json({
    user: req.user,
  });
});

/* START SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
