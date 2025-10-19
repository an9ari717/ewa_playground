require("dotenv").config();
const mod = require("./app");

// Defensive extraction in case the export was wrong before
const app = mod.app || mod.default?.app || mod;
const logger = mod.logger || console;

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => logger.info({ port: PORT }, "server started"));
