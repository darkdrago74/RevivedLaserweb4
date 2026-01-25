"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockController = void 0;
const events_1 = require("events");
class MockController extends events_1.EventEmitter {
    status = {
        state: 'Disconnected',
        pos: { x: 0, y: 0, z: 0 },
        feedrate: 0,
        spindle: 0,
        logs: [],
        limits: {
            x: { min: 0, max: 200 },
            y: { min: 0, max: 200 },
            z: { min: 0, max: 200 }
        }
    };
    connectionDelay = 500;
    async connect(pathOrHost) {
        return new Promise((resolve) => {
            console.log(`[MOCK] Connecting to ${pathOrHost}...`);
            setTimeout(() => {
                this.status.state = 'Idle';
                console.log('[MOCK] Connected.');
                this.emitStatus();
                resolve();
            }, this.connectionDelay);
        });
    }
    async disconnect() {
        return new Promise((resolve) => {
            console.log('[MOCK] Disconnecting...');
            setTimeout(() => {
                this.status.state = 'Disconnected';
                this.emitStatus();
                resolve();
            }, 200);
        });
    }
    async homing() {
        console.log('[MOCK] Homing...');
        this.status.state = 'Run';
        this.emitStatus();
        await this.delay(1000);
        this.status.pos = { x: 0, y: 0, z: 0 };
        this.status.state = 'Idle';
        this.emitStatus();
    }
    async jog(axis, dist, feedrate) {
        console.log(`[MOCK] Jogging ${axis} by ${dist} at ${feedrate}`);
        this.status.state = 'Run';
        this.status.feedrate = feedrate;
        this.emitStatus();
        // Simulate movement time
        await this.delay(500);
        this.status.pos[axis] += dist;
        this.status.state = 'Idle';
        this.status.feedrate = 0;
        this.emitStatus();
    }
    async uploadFile(gcode, filename) {
        console.log(`[MOCK] Uploading file ${filename} (${gcode.length} bytes)`);
        const lines = gcode.split('\n');
        this.status.state = 'Run';
        this.emitStatus();
        // Simulate processing lines
        for (let i = 0; i < lines.length; i++) {
            if (i % 10 === 0)
                await this.delay(10); // Throttle
        }
        console.log('[MOCK] Job Finished');
        this.status.state = 'Idle';
        this.emitStatus();
    }
    getStatus() {
        return this.status;
    }
    async command(gcode) {
        console.log(`[MOCK] CMD: ${gcode}`);
        this.addLog(`>> ${gcode}`);
        this.addLog(`ok`);
        this.emitStatus();
    }
    async probe(options) {
        console.log('[MOCK] Probing...');
        this.addLog(`[Probe] Searching for surface at F${options.feedrate}...`);
        this.status.state = 'Run';
        this.emitStatus();
        await this.delay(1500); // Simulate probe time
        this.addLog('[Probe] Contact! Setting Z.');
        this.status.pos.z = options.plateThickness;
        await this.delay(500);
        this.status.pos.z = options.retract;
        this.addLog(`[Probe] Retracted to ${options.retract}`);
        this.status.state = 'Idle';
        this.emitStatus();
    }
    emitStatus() {
        this.status.logs = this.logBuffer;
        this.emit('status', this.status);
    }
    // Log helpers
    logBuffer = [];
    MAX_LOGS = 50;
    addLog(msg) {
        this.logBuffer.push(msg);
        if (this.logBuffer.length > this.MAX_LOGS)
            this.logBuffer.shift();
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MockController = MockController;
