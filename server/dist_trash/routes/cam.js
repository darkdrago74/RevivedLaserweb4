"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = camRoutes;
const CamService_js_1 = require("../cam/CamService.js");
async function camRoutes(server) {
    const camService = new CamService_js_1.CamService();
    server.post('/cam/generate', async (request, reply) => {
        const { type, fileContent, filePath, options } = request.body;
        try {
            let gcode = '';
            if (type === 'vector') {
                if (!fileContent)
                    return reply.code(400).send({ error: 'fileContent required for vector' });
                // Cast options to VectorOptions? For now assume valid structure.
                gcode = await camService.generateVector(fileContent, options);
            }
            else if (type === 'raster') {
                if (!filePath)
                    return reply.code(400).send({ error: 'filePath required for raster' });
                gcode = await camService.generateRaster(filePath, options);
            }
            else {
                return reply.code(400).send({ error: 'Invalid type. Use "vector" or "raster"' });
            }
            return { status: 'success', gcode };
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: err.message });
        }
    });
    server.get('/cam/validate', async () => {
        return { status: 'ok', modules: ['vector', 'raster'] };
    });
}
