const app = require("./app");
const connectDB = require("./config/db.config");
const { NODE_ENV, PORT } = require("./config/env.config");

let isConnected = false;

async function initializeDatabase() {
  if (isConnected) {
    return;
  }

  await connectDB();
  isConnected = true;
}

if (NODE_ENV === "production") {
  module.exports = async (req, res) => {
    try {
      await initializeDatabase();

      return app(req, res);
    } catch (error) {
      console.error("[server] Startup error:", error);

      return res.status(500).json({
        success: false,
        message: "Server initialization failed",
      });
    }
  };
} else {
  async function start() {
    try {
      await initializeDatabase();

      app.listen(PORT, () => {
        console.log(
          `[server] VetaGuard API listening on port ${PORT}`
        );
      });
    } catch (error) {
      console.error("[server] Failed to start server:", error);
      process.exit(1);
    }
  }

  start();
}