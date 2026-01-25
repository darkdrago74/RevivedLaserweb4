# RevivedLaserweb4 -> LzrCnc

**LzrCnc** is a modern, web-based CNC/Laser control server designed for Raspberry Pi (Debian Bookworm/Trixie) and Linux systems. It supports GRBL (Serial) and Klipper (Moonraker) controllers.

## Features
-   **Web-Based Control**: Responsive UI accessible from any browser.
-   **Visualizer**: 3D G-Code preview with real-time status.
-   **CAM Backend**: Basic vector processing (SVG/DXF).
-   **Hardware**: GRBL and Klipper support.

## Installation

### Prerequisites
-   Linux OS (Debian/Ubuntu/Raspberry Pi OS recommended).
-   `Node.js` v20+ (Automatic check included in installer).

### Interactive Install (Recommended)
Calculates dependencies, installs them, and sets up the server.

```bash
git clone https://github.com/your-repo/LzrCnc.git
cd LzrCnc
sudo ./install.sh
```

During installation, you will be asked if you want to enable the **Systemd Service** for auto-boot.

### Manual Launch
If you didn't enable the service or want to run it manually:

**Global Command**:
```bash
lzrcnc
```

**From Source**:
```bash
npm start
```

## Uninstallation
To remove the application and clean up:

```bash
# Standard Remove (Keeps User Data)
sudo ./uninstall.sh

# Full Clean (Removes Dependencies & Configs)
sudo ./uninstall.sh --all
```

## Troubleshooting

### Persistence & Permissions
-   **Do not** run `npm run build` with `sudo` during development. This creates root-owned files that block normal user builds.
-   If you encounter `EACCES` errors, run:
    ```bash
    sudo chown -R $USER:$USER .
    ```

### Networking
-   The server runs on port `3000` by default.
-   Access via `http://localhost:3000` or `http://<LAN_IP>:3000`.
