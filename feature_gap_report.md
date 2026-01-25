# LzrCnc Feature Gap Analysis

**Generated:** 1/22/2026, 12:17:26 PM

| Category | Feature | Status | Evidence (Files) |
|----------|---------|--------|------------------|
| CAM | **Raster Image Support** | ✅ Implemented | CamService.ts, Tools.ts, KlipperController.ts... |
| CAM | **Vector Support** | ⚠️ Partial | CamPanel.tsx, App.tsx |
| CAM | **Materials Library** | ❌ Missing |  |
| Control | **Machine Connection** | ✅ Implemented | GrblController.ts, KlipperController.ts, index.ts... |
| Control | **Jogging** | ✅ Implemented | index.ts, GrblController.ts, KlipperController.ts... |
| Control | **Homing** | ⚠️ Partial | GrblController.ts, KlipperController.ts, MachineInterface.ts |
| Control | **Z-Probe** | ❌ Missing |  |
| Control | **Macros** | ⚠️ Partial | KlipperController.ts, index.ts |
| Control | **Terminal** | ✅ Implemented | App.tsx, Terminal.tsx, index.ts... |
| UI | **Drag & Drop** | ⚠️ Partial | App.tsx, GrblController.ts, KlipperController.ts... |
| UI | **Visualizer** | ⚠️ Partial | App.tsx, main.tsx |

## Summary
- **Implemented**: 4
- **Partial**: 5
- **Missing**: 2
