# Implementation Plan - Phase 1: CAM & Core Logic

## Goal
Implement missing Vector CAM capabilities (SVG/DXF to G-code) and verify/improve the existing Raster CAM. Expose functionality via a robust API.

## User Review Required
> [!IMPORTANT]
> I am choosing **MakerJS** for vector manipulation as it supports both SVG and DXF import/export and G-code generation pathing.

## Proposed Changes

### 1. Dependencies
- Install `makerjs` (Core vector logic).
- Install `opentype.js` (If text support is needed, though MakerJS handles paths).
- Install `xml2js` (For raw SVG parsing if needed).

### 2. `server/src/cam/CamService.ts`
- **Refactor**: Split into `VectorEngine` and `RasterEngine` for cleaner code? Or just add methods.
- **New Method**: `generateVector(fileContent: string, format: 'svg'|'dxf', options: VectorOptions)`
    - Parse using MakerJS.
    - Apply offsets (Tool Diameter).
    - Generate G-code profiles (Cut Inside, Cut Outside, On Path).
- **Optimization**: Ensure existing `generateRaster` doesn't block the main thread (consider Worker Threads for high-res images later).

### 3. `server/src/cam/Tools.ts`
- Update `ProbeTool` and `LaserTool` definitions to ensure strictly typed "Diameter" and "Spot Size" are enforced.

### 4. API Expsoure (`server/src/routes/cam.ts`)
- `POST /cam/preview`: Returns path data (points) for the frontend Visualizer.
- `POST /cam/generate`: Returns the generated G-code file path or content.

## Verification Plan
1.  **Unit Test**: Create `CamService.test.ts` (backend test).
    - Test SVG string -> G-code output.
    - Test DXF string -> G-code output.
2.  **Manual Check**: Use the QA Agent (`qa.sh`) to hit the new endpoints.
