const mongoose = require("mongoose");
const { MONGO_URI } = require("./env.config");

async function connectDB() {
  if (!MONGO_URI) {
    console.error("[db] MONGO_URI is not set. Backend cannot start without a database.");
    process.exit(1);
  }
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
