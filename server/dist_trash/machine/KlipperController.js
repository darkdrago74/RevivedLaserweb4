"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KlipperController = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
class KlipperController extends events_1.EventEmitter {
    ws = null;
    reqId = 0;
    status = {
        state: 'Disconnected',
        pos: { x: 0, y: 0, z: 0 },
        feedrate: 0,
        spindle: 0,
        logs: []
    };
    async connect(host) {
        // connection string support either ip or ip:port
        const url = `ws://${host}/websocket`;
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(url);
            this.ws.on('open', () => {
                this.status.state = 'Idle'; // Klipper ready
                this.emitStatus();
                this.subscribeObjects();
                this.fetchConfig();
                resolve();
            });
            this.ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                this.handleMessage(msg);
            });
            this.ws.on('close', () => {
                this.status.state = 'Disconnected';
                this.emitStatus();
                this.ws = null;
            });
            this.ws.on('error', (err) => {
                this.emit('error', err);
                reject(err);
            });
        });
    }
    async disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
    async homing() {
        await this.sendGcode('G28');
    }
    async jog(axis, dist, feedrate) {
        // Klipper jog: G91 then G1 ...
        await this.sendGcode('G91');
        await this.sendGcode(`G1 ${axis.toUpperCase()}${dist} F${feedrate}`);
        await this.sendGcode('G90');
    }
    async uploadFile(gcode, filename) {
        // For Klipper, usually you upload to API then print. 
        // But for stream-like behavior or small commands, we can send script.
        // Ideally we use the 'upload_and_print' endpoint via HTTP, but here we'll stream logic for now or just alert.
        // The prompt says "Klipper is great for 3D printing... but historically weaker than GRBL at Raster... Your app must generate 'Klipper-friendly' raster G-code"
        // We will simulate streaming gcode via G-Code macros or M106/M107
        const lines = gcode.split('\n');
        for (const line of lines) {
            if (line.trim().length > 0) {
                await this.sendGcode(line.trim());
            }
        }
    }
    getStatus() {
        return this.status;
    }
    async sendGcode(cmd) {
        return this.rpcCall('printer.gcode.script', { script: cmd });
    }
    pendingRequests = new Map();
    rpcCall(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.ws)
                return reject(new Error('Not connected'));
            const id = ++this.reqId;
            const req = {
                jsonrpc: '2.0',
                method,
                params,
                id
            };
            this.pendingRequests.set(id, resolve);
            this.ws.send(JSON.stringify(req));
        });
    }
    subscribeObjects() {
        this.rpcCall('printer.objects.subscribe', {
            objects: {
                toolhead: ['position', 'status', 'max_velocity'],
                print_stats: ['state']
            }
        });
    }
    async command(gcode) {
        await this.rpcCall('printer.gcode.script', { script: gcode });
    }
    async probe(options) {
        // Klipper specific probe macro or command
        // We can try PROBE or PROBE_CALIBRATE logic, or just generic G38.2 if Klipper supports it (it usually doesn't standard G38.2)
        // Klipper usually uses 'PROBE' command.
        // For now, fail or map to PROBE command if user insists.
        throw new Error('Klipper native probe not yet mapped. Use generic macros.');
    }
    emitStatus() {
        this.emit('status', this.status);
    }
    async fetchConfig() {
        try {
            // Fetch config object
            const response = await this.rpcCall('printer.objects.query', {
                objects: { configfile: null }
            });
            const config = response.status.configfile.config;
            // 1. Parse Limits
            const limits = { x: {}, y: {}, z: {} };
            ['x', 'y', 'z'].forEach(axis => {
                const stepper = config[`stepper_${axis}`];
                if (stepper) {
                    limits[axis] = {
                        min: parseFloat(stepper.position_min) || 0,
                        max: parseFloat(stepper.position_max) || 200
                    };
                }
            });
            this.status.limits = limits;
            // 2. Parse Macros
            const macros = [];
            Object.keys(config).forEach(key => {
                if (key.startsWith('gcode_macro ')) {
                    macros.push(key.replace('gcode_macro ', ''));
                }
            });
            this.status.macros = macros;
            this.emitStatus();
        }
        catch (e) {
            console.error('Failed to fetch Klipper config', e);
        }
    }
    // Log handling from gcode_response
    handleMessage(msg) {
        if (msg.method === 'notify_status_update') {
            const params = msg.params[0];
            if (params.toolhead && params.toolhead.position) {
                const [x, y, z] = params.toolhead.position;
                this.status.pos = { x, y, z };
                this.emitStatus();
            }
        }
        else if (msg.method === 'notify_gcode_response') {
            // Logs from Klipper
            const log = msg.params[0];
            this.status.logs.push(log);
            if (this.status.logs.length > 50)
                this.status.logs.shift();
            this.emitStatus();
        }
    }
}
exports.KlipperController = KlipperController;
