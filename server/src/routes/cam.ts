import { FastifyInstance } from 'fastify';
import { CamService } from '../cam/CamService.js';
import { RasterOptions, VectorOptions } from '../cam/Tools.js';

export default async function camRoutes(server: FastifyInstance) {
    const camService = new CamService();

    server.post('/cam/generate', async (request: any, reply) => {
        const { type, fileContent, filePath, options } = request.body;

        try {
            let gcode = '';

            if (type === 'vector') {
                if (!fileContent) return reply.code(400).send({ error: 'fileContent required for vector' });
                // Cast options to VectorOptions? For now assume valid structure.
                gcode = await camService.generateVector(fileContent, options as VectorOptions);
            } else if (type === 'raster') {
                if (!filePath) return reply.code(400).send({ error: 'filePath required for raster' });
                gcode = await camService.generateRaster(filePath, options as RasterOptions);
            } else {
                return reply.code(400).send({ error: 'Invalid type. Use "vector" or "raster"' });
            }

            return { status: 'success', gcode };

        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: err.message });
        }
    });

    server.get('/cam/validate', async () => {
        return { status: 'ok', modules: ['vector', 'raster'] };
    });
}
