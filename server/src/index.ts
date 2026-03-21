import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import habitRoutes from "./routes/habits.js";
import xpRouter from "./routes/xp.js";
import { authenticate } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Security headers
app.use(helmet());

// CORS — restrict to frontend origin (default localhost:5173 for Vite dev)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body size limit to prevent large-payload DoS
app.use(express.json({ limit: "100kb" }));

// Health check (public)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (signup and login are public, /me is protected internally)
app.use("/api/auth", authRoutes);

// Auth middleware for all other /api/ routes
app.use("/api", authenticate);

// Protected routes go below this line
app.use("/api/tasks", taskRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/xp", xpRouter);

async function main() {
  await prisma.$connect();
  console.log("Connected to database");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
