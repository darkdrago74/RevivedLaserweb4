"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const materialRoutes = async (fastify, options) => {
    const { materialService } = options;
    fastify.get('/materials', async (request, reply) => {
        return materialService.getAll();
    });
    fastify.post('/materials', async (request, reply) => {
        const material = request.body;
        if (material.id) {
            await materialService.update(material.id, material);
        }
        else {
            await materialService.add(material);
        }
        return { status: 'success' };
    });
    fastify.delete('/materials/:id', async (request, reply) => {
        const { id } = request.params;
        await materialService.delete(id);
        return { status: 'success' };
    });
};
exports.default = materialRoutes;
