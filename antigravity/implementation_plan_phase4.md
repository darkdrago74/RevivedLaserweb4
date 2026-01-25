# Implementation Plan - Phase 4: Visualizer & CAM Preview

## Goal
Implement a rich 3D Visualizer to replicate LaserWeb4's workspace view. This includes:
1.  **Machine Bed**: Visualizing the working area limits.
2.  **G-Code Preview**: Rendering generated paths (Cut/Move) in 3D.
3.  **Real-time Status**: Showing the machine head position.
4.  **Perspective**: 3D Orbit controls.

## User Review Required
> [!NOTE]
> We will use **Three.js** (`@react-three/fiber`) for high-performance 3D rendering. This requires installing new dependencies in the client.

## Proposed Changes

### 1. Dependencies (`client`)
-   Install: `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`.

### 2. Components (`client/src/components`)
-   **`Visualizer/VisualizerScene.tsx`**: Main Canvas component.
-   **`Visualizer/MachineBed.tsx`**: Renders grid and bounds based on `status.limits`.
-   **`Visualizer/GCodeViewer.tsx`**: Parses G-code text into `THREE.LineSegments`.
    -   Blue lines for `G0` (Moves).
    -   Red lines for `G1/G2/G3` (Cuts).
-   **`Visualizer/MachineHead.tsx`**: A simple cone/mesh following `status.pos`.

### 3. Integration (`App.tsx`)
-   Replace the "Machine Visualizer" placeholder in `App.tsx` with `<VisualizerScene />`.
-   Pass `machineStatus` (Pos, Limits) and `generatedGcode` (from CAM) to the Visualizer.

### 4. Logic Updates
-   **`CamPanel`**: Need to lift `generatedGcode` state up to `App` so it can be shared with the Visualizer?
    -   *Decision*: For now, the Visualizer is primarily for the "Machine" view (Machine Control). But the user mentioned "Pre-visualiser ... to preview the work". 
    -   *Architecture*: We should view the Visualizer in the CAM tab too, or have a "Preview Mode".
    -   *Plan*: We will keep the `CamPanel` focused on generating. When generated, we can send the G-code to a global store or pass it up. For simplicity, we'll verify the "Machine View" visualizer first (loading existing files), or allow `CamPanel` to "Send to Visualizer".

## Verification
-   **Manual**:
    1.  Check if Grid shows up.
    2.  Jog machine, see Cone move.
    3.  Generate simple G-code (Cube), see lines render.
