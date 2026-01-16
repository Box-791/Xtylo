import express from "express";
import cors from "cors";
import schoolsRouter from "./routes/schools";
import campaignsRouter from "./routes/campaigns";
import studentsRouter from "./routes/students";


export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/schools", schoolsRouter);
app.use("/campaigns", campaignsRouter);
app.use("/students", studentsRouter);
