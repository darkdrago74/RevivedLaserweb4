# Implementation Plan - Phase 3: Klipper Integration REFINEMENT

## Goal
Deepen Klipper integration by implementing `printer.cfg` parsing for machine limits and implementing generic G-code command injection.

## User Review Required
> [!NOTE]
> Klipper uses `printer.cfg`. We will fetch this via Moonraker API (`/server/files/config/printer.cfg` or JSON-RPC `server.files.get_file`).

## Proposed Changes

### 1. KlipperController.ts
- **Implement `command(gcode)`**:
    - Use JSON-RPC `printer.gcode.script` to send commands.
- **Implement Config Parsing**:
    - Fetch config on connect.
    - Extract `stepper_x`, `stepper_y` limits (`position_max`, `position_min`).
    - Extract `[gcode_macro]` names.
- **Status Update**:
    - Map Klipper state to `MachineStatus`.
    - Catch `notify_gcode_response` for logs.

### 2. Frontend
- **Config Display**: Show detected machine limits in System Log or a generic "Machine Info" modal.
- **Macro List**: Dynamically populate macros from Klipper? (Maybe later, focus on core first).

## Verification
- **Mock**: Use `MockController` for generic tests.
- **Manual**: User must verify against real Klipper instance if available, or we trust the API implementation logic.
