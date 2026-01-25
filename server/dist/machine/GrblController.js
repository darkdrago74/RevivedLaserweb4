"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrblController = void 0;
const events_1 = require("events");
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
class GrblController extends events_1.EventEmitter {
    port = null;
    parser = null;
    status = {
        state: 'Disconnected',
        pos: { x: 0, y: 0, z: 0 },
        feedrate: 0,
        spindle: 0,
        logs: []
    };
    async connect(path, baudRate = 115200) {
        return new Promise((resolve, reject) => {
            this.port = new serialport_1.SerialPort({ path, baudRate, autoOpen: false });
            this.parser = this.port.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\r\n' }));
            this.port.open((err) => {
                if (err)
                    return reject(err);
                this.status.state = 'Idle'; // Assume idle on connect
                this.emitStatus();
                // Fetch Settings
                setTimeout(() => {
                    this.send('$$');
                }, 500); // Small delay to let bootloader settle
                resolve();
            });
            this.parser.on('data', (line) => {
                this.parseResponse(line);
            });
            this.port.on('close', () => {
                this.status.state = 'Disconnected';
                this.emitStatus();
                this.port = null;
            });
            this.port.on('error', (err) => {
                this.emit('error', err);
            });
        });
    }
    async disconnect() {
        if (this.port && this.port.isOpen) {
            return new Promise((resolve) => {
                this.port?.close(() => resolve());
            });
        }
    }
    async homing() {
        this.send('$H');
    }
    async jog(axis, dist, feedrate) {
        // GRBL Jog command: $J=G91 X10 F1000
        const cmd = `$J=G91 ${axis.toUpperCase()}${dist} F${feedrate}`;
        this.send(cmd);
    }
    async uploadFile(gcode, filename) {
        const lines = gcode.split('\n');
        for (const line of lines) {
            if (line.trim().length > 0) {
                this.send(line.trim());
                // Simple flow control would be needed here (wait for 'ok')
                // For prototype, we just send. In real implementation, manage buffer.
            }
        }
    }
    getStatus() {
        return this.status;
    }
    send(cmd) {
        if (this.port && this.port.isOpen) {
            this.port.write(cmd + '\n');
        }
    }
    logBuffer = [];
    MAX_LOGS = 50;
    async command(gcode) {
        this.send(gcode);
    }
    async probe(options) {
        // Z-Probe Workflow
        // 1. G91 (Relative)
        // 2. G38.2 Z-dist Ffeed (Probe down)
        // 3. G10 L20 P1 Z<thickness> (Set Work Zero with offset, assuming P1/G54 commands)
        //    OR simpler: G92 Z<thickness>
        // 4. G0 Z<retract> (Pull off)
        // 5. G90 (Absolute)
        // Using simple G92 for work offset setting
        const cmds = [
            'G91',
            `G38.2 Z${options.dist} F${options.feedrate}`,
            `G92 Z${options.plateThickness}`,
            `G0 Z${options.retract}`,
            'G90'
        ];
        for (const cmd of cmds) {
            this.send(cmd);
            // In real app, we need to wait for 'ok' or probe success triggered by 'PRB:' message
            // For prototype, we drift commands but G38.2 blocks until trigger or alarm.
        }
    }
    emitStatus() {
        this.status.logs = this.logBuffer;
        this.emit('status', this.status);
    }
    addLog(msg) {
        this.logBuffer.push(msg);
        if (this.logBuffer.length > this.MAX_LOGS) {
            this.logBuffer.shift();
        }
    }
    parseResponse(line) {
        const cleanLine = line.trim();
        if (cleanLine) {
            this.addLog(cleanLine);
            this.emit('log', cleanLine);
        }
        // Example: <Idle|MPos:0.000,0.000,0.000|FS:0,0>
        if (line.startsWith('<')) {
            const content = line.replace(/[<>]/g, '');
            const parts = content.split('|');
            const stateStr = parts[0];
            this.status.state = stateStr;
            for (let i = 1; i < parts.length; i++) {
                if (parts[i].startsWith('MPos:')) {
                    const coords = parts[i].substring(5).split(',');
                    this.status.pos = {
                        x: parseFloat(coords[0]),
                        y: parseFloat(coords[1]),
                        z: parseFloat(coords[2])
                    };
                }
                else if (parts[i].startsWith('WPos:')) {
                    const coords = parts[i].substring(5).split(',');
                    this.status.pos = {
                        x: parseFloat(coords[0]),
                        y: parseFloat(coords[1]),
                        z: parseFloat(coords[2])
                    };
                }
                else if (parts[i].startsWith('Pn:')) {
                    this.status.ports = parts[i].substring(3);
                }
            }
            this.emitStatus();
        }
        else if (cleanLine.startsWith('$')) {
            // Settings response: $130=200.000
            const match = /^\$([0-9]+)=([0-9\.]+)/.exec(cleanLine);
            if (match) {
                const id = parseInt(match[1]);
                const val = parseFloat(match[2]);
                if (!this.status.limits) {
                    this.status.limits = {
                        x: { min: 0, max: 200 },
                        y: { min: 0, max: 200 },
                        z: { min: 0, max: 200 }
                    };
                }
                if (id === 130)
                    this.status.limits.x.max = val;
                if (id === 131)
                    this.status.limits.y.max = val;
                if (id === 132)
                    this.status.limits.z.max = val;
                // Debounce emit if multiple settings come in? 
                // For now, emit is cheap enough or we can wait.
                this.emitStatus();
            }
        }
    }
}
exports.GrblController = GrblController;
