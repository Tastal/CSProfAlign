# Port Configuration Guide / 端口配置指南

## Quick Fix for Port Conflicts / 快速解决端口冲突

If port 8000 is already in use, you can change it easily:

### Windows

**Temporary (current session only):**
```bat
set BACKEND_PORT=8001
start-backend.bat
```

**Permanent:**
1. Right-click "This PC" → Properties → Advanced system settings
2. Environment Variables → User variables → New
3. Variable name: `BACKEND_PORT`
4. Variable value: `8001` (or any free port)
5. Click OK
6. Restart terminal and run `start-backend.bat`

### macOS/Linux

**Temporary:**
```bash
BACKEND_PORT=8001 ./start-backend.sh
```

**Permanent (add to ~/.bashrc or ~/.zshrc):**
```bash
export BACKEND_PORT=8001
```

## Frontend Configuration / 前端配置

If you changed backend port, update frontend too:

### Development Mode

Create `.env.local` file in project root:
```
VITE_BACKEND_PORT=8001
```

Then restart frontend:
```bat
npm run dev
```

## Check Port Availability / 检查端口可用性

### Windows
```bat
netstat -ano | findstr :8000
```

### macOS/Linux
```bash
lsof -i :8000
```

## Default Ports / 默认端口

- Backend API: 8000
- Frontend Dev: 5173

## Troubleshooting / 故障排除

### Old container still running
```bat
docker ps -a
docker stop <container_name>
docker rm <container_name>
```

### Port in use by another process
```bat
# Find process ID
netstat -ano | findstr :8000

# Kill process (Windows, replace PID)
taskkill /F /PID <process_id>
```

## Architecture / 架构

Port configuration flows through:
1. `start-backend.bat` → Sets `%BACKEND_PORT%` env var
2. `docker-compose.yml` → Maps `${BACKEND_PORT:-8000}:8000`
3. `src/config/backend.js` → Reads `VITE_BACKEND_PORT`
4. `src/services/backendLLM.js` → Uses config

All components automatically use the configured port!

