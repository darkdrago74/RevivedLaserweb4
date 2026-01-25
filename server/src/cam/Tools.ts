export type Unit = 'mm' | 'inch';

export interface BaseTool {
    id: string;
    name: string;
    units: Unit;
}

export interface LaserTool extends BaseTool {
    type: 'laser';
    spotSize: number; // Diameter of the laser beam
    powerMax?: number; // S-value for 100% power (e.g. 1000 or 255)
}

export interface CNCTool extends BaseTool {
    type: 'cnc';
    diameter: number; // Bit diameter
    cutDepth: number; // Max cut depth per pass
    stepOver?: number; // % of diameter
}

export type MachineTool = LaserTool | CNCTool;

export interface VectorOptions {
    tool: MachineTool;
    format: 'svg' | 'dxf';
    feedrate: number;
    cutHeight?: number; // For CNC
    passes?: number; // Multi-pass
}

export interface RasterOptions {
    tool: LaserTool; // Raster is laser only for now
    width: number; // Target width in mm
    height: number; // Target height in mm
    dpi: number; // Resolution
    feedrate: number;
    powerMin: number; // 0-100 or 0-255 or 0-1
    powerMax: number;
    invert: boolean;
    overscan?: number; // Overscan in mm to allow accel/decel
    scanlineDirection?: 'horizontal' | 'vertical' | 'diagonal';
    mode: 'grayscale' | 'bw' | 'dither';
}
