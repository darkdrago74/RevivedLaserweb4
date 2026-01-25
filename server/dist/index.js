"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const GrblController_js_1 = require("./machine/GrblController.js");
const KlipperController_js_1 = require("./machine/KlipperController.js");
const MockController_js_1 = require("./machine/MockController.js");
const cam_js_1 = __importDefault(require("./routes/cam.js"));
const material_js_1 = __importDefault(require("./routes/material.js")); // Assuming new material routes
const MaterialService_js_1 = require("./services/MaterialService.js"); // Added import for MaterialService
const CamService_js_1 = require("./cam/CamService.js"); // Corrected import path
const path_1 = __importDefault(require("path")); // Added import for path module
const static_1 = __importDefault(require("@fastify/static"));
// ... existing imports ...
const server = (0, fastify_1.default)({ logger: true });
server.register(cors_1.default, {
    origin: '*'
});
// Serve frontend static files
const distPath = path_1.default.join(process.cwd(), '../client/dist');
server.register(static_1.default, {
    root: distPath,
    prefix: '/', // Start serving from root
});
// Services
const camService = new CamService_js_1.CamService();
const materialService = new MaterialService_js_1.MaterialService(path_1.default.join(process.cwd(), 'data'));
server.register(cam_js_1.default, { camService });
server.register(material_js_1.default, { materialService });
// SPA Fallback: serve index.html for unknown routes (React Router support)
server.setNotFoundHandler((req, reply) => {
    reply.sendFile('index.html');
});
let machine = null;
const isSim = process.env.MOCK_HARDWARE === 'true' || process.argv.includes('--sim');
if (isSim) {
    console.log('[SIMULATION] Mode Active. Using MockController.');
    machine = new MockController_js_1.MockController();
    machine.connect('mock-device'); // Auto-connect in sim mode
}
server.get('/ping', async (request, reply) => {
    return { status: 'ok', message: 'RevivedLaserweb4 Server Online', sim: isSim };
});
server.post('/connect', async (request, reply) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { type, port, baud, host } = request.body;
    if (machine) {
        try {
            await machine.disconnect();
        }
        catch (e) { }
    }
    if (type === 'grbl') {
        machine = new GrblController_js_1.GrblController();
        await machine.connect(port, baud);
    }
    else if (type === 'klipper') {
        machine = new KlipperController_js_1.KlipperController();
        await machine.connect(host);
    }
    else if (type === 'mock') {
        machine = new MockController_js_1.MockController();
        await machine.connect('mock-device');
    }
    else {
        return reply.code(400).send({ error: 'Invalid machine type' });
    }
    return { status: 'connected', type };
});
server.post('/command', async (request, reply) => {
    const { gcode } = request.body;
    if (machine) {
        await machine.command(gcode);
    }
    return { status: 'sent' };
});
server.post('/probe', async (request, reply) => {
    const options = request.body; // Validation skipped for prototype
    if (machine) {
        try {
            await machine.probe(options);
            return { status: 'ok' };
        }
        catch (e) {
            return { status: 'error', message: e.message };
        }
    }
    return { status: 'disconnected' };
});
server.post('/jog', async (request, reply) => {
    if (!machine)
        return reply.code(400).send({ error: 'Not connected' });
    const { axis, dist, feedrate } = request.body;
    await machine.jog(axis, dist, feedrate);
    return { status: 'ok' };
});
server.get('/status', async (request, reply) => {
    if (!machine)
        return { state: 'Disconnected' };
    return machine.getStatus();
});
const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server listening on http://0.0.0.0:3000');
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
