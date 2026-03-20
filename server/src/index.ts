import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Health check (public)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (signup and login are public, /me is protected internally)
app.use("/api/auth", authRoutes);

// Auth middleware for all other /api/ routes
app.use("/api", authenticate);

// Protected routes go below this line

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
