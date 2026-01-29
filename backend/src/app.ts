import express from "express";
import cors from "cors";

import studentsRouter from "./routes/students";
import schoolsRouter from "./routes/schools";
import campaignsRouter from "./routes/campaigns";
import toursRouter from "./routes/tours";
import outreaachRouter from "./routes/outreach";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/students", studentsRouter);
app.use("/schools", schoolsRouter);
app.use("/campaigns", campaignsRouter);
app.use("/tours", toursRouter);
app.use("/outreach", outreaachRouter);

// Basic error handler (optional but useful)
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});
