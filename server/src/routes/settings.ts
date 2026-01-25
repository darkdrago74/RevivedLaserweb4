import { FastifyInstance } from 'fastify';
import { SettingsService, MachineSettings } from '../services/SettingsService.js';

export default async function settingsRoutes(server: FastifyInstance, options: { settingsService: SettingsService }) {
    const { settingsService } = options;

    server.get('/api/settings/machine', async (request, reply) => {
        try {
            const settings = await settingsService.getSettings();
            return settings;
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to retrieve settings' });
        }
    });

    server.post<{ Body: Partial<MachineSettings> }>('/api/settings/machine', async (request, reply) => {
        try {
            const updatedSettings = await settingsService.saveSettings(request.body);
            return updatedSettings;
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to save settings' });
        }
    });

    // TODO: Add Import endpoints
}
