const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  return res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  return res.json({ message: "E-commerce RBAC backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/customer", customerRoutes);

app.use((error, _req, res, _next) => {
  return res.status(500).json({ message: "Unexpected server error.", error: error.message });
});

const basePort = Number(process.env.PORT || 5000);
const maxPortAttempts = 10;

function startServer(port, attempt = 0) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < maxPortAttempts) {
      const nextPort = port + 1;
      console.log(`Port ${port} busy, retrying on ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
}

startServer(basePort);
