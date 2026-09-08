const app = require("./app");
const connectDB = require("./config/db.config");
const { PORT } = require("./config/env.config");

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] VetaGuard API listening on port ${PORT}`);
  });
}

start();
