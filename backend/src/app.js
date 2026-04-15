import express from "express";
import cors from "cors";
import { config } from "./config.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import jovensRoutes from "./routes/jovens.routes.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/jovens", jovensRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));

export default app;