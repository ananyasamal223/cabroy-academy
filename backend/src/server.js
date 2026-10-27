import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = Number(process.env.PORT || 5000);
await connectDB();
const server = app.listen(port, () => console.log(`Rathi Academy API running on http://localhost:${port}`));
server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the other backend terminal, then type rs here to restart.`);
  } else {
    console.error("Backend could not start:", error.message);
  }
  mongoose.disconnect().finally(() => process.exit(1));
});
