import fs from 'fs/promises';
import path from 'path';

export interface AxisSettings {
    visible: boolean;
    min: number;
    max: number;
    direction: number; // 1 or -1
    reversed: boolean;
}

export interface WorkbenchSettings {
    width: number;
    height: number;
    depth: number;
    origin: 'bottom-left' | 'top-left' | 'center'; // Simplified origin options
    showWorkbench: boolean;
}

export interface MachineSettings {
    workbench: WorkbenchSettings;
    axes: {
        x: AxisSettings;
        y: AxisSettings;
        z: AxisSettings;
    };
    macros: any[];
}

const DEFAULT_SETTINGS: MachineSettings = {
    workbench: {
        width: 300,
        height: 200,
        depth: 50,
        origin: 'bottom-left',
        showWorkbench: true
    },
    axes: {
        x: { visible: true, min: 0, max: 300, direction: 1, reversed: false },
        y: { visible: true, min: 0, max: 200, direction: 1, reversed: false },
        z: { visible: true, min: 0, max: 50, direction: 1, reversed: false }
    },
    macros: []
};

export class SettingsService {
    private settingsPath: string;
    private settings: MachineSettings | null = null;

    constructor(dataDir: string) {
        this.settingsPath = path.join(dataDir, 'machine_settings.json');
    }

    async getSettings(): Promise<MachineSettings> {
        if (this.settings) return this.settings;

        try {
            const data = await fs.readFile(this.settingsPath, 'utf-8');
            this.settings = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create it with defaults
            console.log('Settings file not found, creating default.');
            this.settings = DEFAULT_SETTINGS;
            await this.saveSettings(this.settings);
        }
        return this.settings!;
    }

    async saveSettings(newSettings: Partial<MachineSettings>): Promise<MachineSettings> {
        const current = await this.getSettings();
        this.settings = { ...current, ...newSettings };

        // Deep merge for nested objects if needed, but simple top-level merge for now
        // For 'axes' we might want to be careful not to overwrite the whole object if only one axis is passed
        // But for this implementation, we assume the client sends the relevant sections fully or we merge carefully.
        // Let's improve the merge logic slightly for Axes and Workbench.

        if (newSettings.workbench) {
            this.settings.workbench = { ...current.workbench, ...newSettings.workbench };
        }
        if (newSettings.axes) {
            this.settings.axes = {
                x: { ...current.axes.x, ...(newSettings.axes.x || {}) },
                y: { ...current.axes.y, ...(newSettings.axes.y || {}) },
                z: { ...current.axes.z, ...(newSettings.axes.z || {}) }
            };
        }

        await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
        return this.settings!;
    }

    // Placeholder for Import functions
    async importFromKlipper(host: string): Promise<MachineSettings> {
        // TODO: Implement Klipper API fetch
        // GET http://<host>/printer/objects/query?configfile
        // Parse [stepper_x] position_max, position_endstop etc.
        throw new Error("Not implemented");
    }

    async importFromGrbl(port: string): Promise<MachineSettings> {
        // TODO: Implement GRBL $$ parsing
        throw new Error("Not implemented");
    }
}
