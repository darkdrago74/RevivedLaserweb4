# Implementation Plan - Phase 2: Frontend CAM Interface

## Goal
Implement a modern, reactive interface for the generic CAM workflow: File Upload -> Settings Configuration -> G-code Generation -> Preview.

## User Review Required
> [!NOTE]
> I will use **Drag & Drop** for file uploads. The interface will be split into a **Control Panel** (Left) and **Visualizer/Workspace** (Right/Center).

## Proposed Changes

### 1. Client Structure
- **New Components**:
    - `client/src/components/CamPanel.tsx`: Main container for CAM operations.
    - `client/src/components/FileUpload.tsx`: Drag & drop zone for SVG/Images.
    - `client/src/components/CamSettings.tsx`: Form to configure Tool (Laser/CNC), Feedrate, Power.
    - `client/src/components/GcodePreview.tsx`: Simple text or 2D canvas visualization of generated G-code.

### 2. State Management
- Using React `useState` for rapid prototyping.
- State: `file` (Raw content or path), `camOptions` (Vector/Raster options), `gcode` (Generated output).

### 3. API Integration
- Connect `CamPanel` to `POST /cam/generate`.

## Verification Plan
1.  **Manual Test**:
    - Open Web UI.
    - Drag & Drop an SVG.
    - Adjust Settings (e.g., Feedrate 1000).
    - Click "Generate".
    - Verify G-code appears in Preview/Terminal.
