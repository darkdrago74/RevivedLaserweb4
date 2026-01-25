"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class MaterialService {
    dbPath;
    materials = [];
    constructor(dataDir) {
        this.dbPath = path_1.default.join(dataDir, 'materials.json');
        this.load();
    }
    async load() {
        try {
            const data = await promises_1.default.readFile(this.dbPath, 'utf-8');
            this.materials = JSON.parse(data);
        }
        catch (e) {
            // If file doesn't exist, start empty
            this.materials = [];
        }
    }
    async save() {
        await promises_1.default.writeFile(this.dbPath, JSON.stringify(this.materials, null, 2));
    }
    getAll() {
        return this.materials;
    }
    async add(material) {
        const newMat = { ...material, id: Date.now().toString() };
        this.materials.push(newMat);
        await this.save();
        return newMat;
    }
    async update(id, updates) {
        const idx = this.materials.findIndex(m => m.id === id);
        if (idx === -1)
            return null;
        this.materials[idx] = { ...this.materials[idx], ...updates };
        await this.save();
        return this.materials[idx];
    }
    async delete(id) {
        const initialLen = this.materials.length;
        this.materials = this.materials.filter(m => m.id !== id);
        if (this.materials.length !== initialLen) {
            await this.save();
            return true;
        }
        return false;
    }
}
exports.MaterialService = MaterialService;
