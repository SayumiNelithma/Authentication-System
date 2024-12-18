import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { UserRouter } from "./routes/userRouter.js";
import 'dotenv/config';

const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());

// CORS configuration for frontend to access the server
app.use(cors({
  origin: "http://localhost:5173",
  methods: ['GET', 'POST'], 
  credentials: true,               // Allow cookies
}));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Use the UserRouter for routes starting with /user
app.use('/user', UserRouter);

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
