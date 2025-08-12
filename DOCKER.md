# Docker Setup & Configuration Guide

This document provides comprehensive instructions for running the Investment Portfolio application using Docker.

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- At least 4GB RAM available for Docker
- 2GB free disk space

## 🏗️ Architecture

### Development Environment
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Data Volume   │
│   React Dev     │◄──►│   Node.js Dev    │◄──►│   JSON Files    │
│   Port: 3002    │    │   Port: 5001     │    │   Persistent    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Production Environment
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Data Volume   │
│   Nginx         │◄──►│   Node.js Prod   │◄──►│   JSON Files    │
│   Port: 80      │    │   Port: 5001     │    │   Persistent    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Development Mode
```bash
# Clone the repository
git clone <repository-url>
cd investing-portfolio

# Start all services
docker compose up --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Production Mode
```bash
# Start production environment
docker compose -f docker-compose.prod.yml up --build

# Run in background
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down
```

## 📁 File Structure

```
/
├── docker-compose.yml           # Development configuration
├── docker-compose.prod.yml      # Production configuration
├── backend/
│   ├── Dockerfile              # Development backend image
│   ├── Dockerfile.prod         # Production backend image
│   ├── .dockerignore           # Files to exclude from build
│   └── data/                   # JSON data files (mounted volume)
└── frontend/
    ├── Dockerfile              # Development frontend image
    ├── Dockerfile.prod         # Production frontend image
    ├── .dockerignore           # Files to exclude from build
    └── nginx.conf              # Production nginx configuration
```

## 🔧 Configuration Details

### Development Features
- **Hot Reload**: Frontend and backend auto-restart on code changes
- **Volume Mounts**: Source code mounted for live editing
- **Debug Mode**: Full error messages and detailed logging
- **Development Dependencies**: Includes nodemon, dev tools

### Production Features
- **Optimized Builds**: Multi-stage builds for smaller images
- **Security**: Non-root user, minimal dependencies
- **Performance**: Nginx serving static files, Node.js optimizations
- **Health Checks**: Automated container health monitoring

## 📊 Service Details

### Backend Service
- **Development**: Node.js with nodemon (auto-restart)
- **Production**: Node.js production mode
- **Health Check**: `/health` endpoint monitoring
- **Data**: JSON files in persistent volume
- **Port**: 5001 (both environments)

### Frontend Service
- **Development**: React dev server with hot reload
- **Production**: Nginx serving optimized React build
- **Proxy**: API requests forwarded to backend
- **Ports**: 3002 (dev), 80 (prod)

### Data Volume
- **Name**: `investing_data`
- **Mount Point**: `/app/data` in backend container
- **Contents**: All JSON data files (accounts, stocks, portfolios)
- **Persistence**: Survives container restarts and rebuilds

## 📦 Data Management

### Backup Data
```bash
# Create backup of all JSON data
docker run --rm \
  -v investing_investing_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/portfolio-data-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore Data
```bash
# Restore from backup
docker run --rm \
  -v investing_investing_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/portfolio-data-YYYYMMDD.tar.gz -C /data
```

### Reset Data
```bash
# WARNING: This removes all data permanently
docker compose down -v
docker volume rm investing_investing_data
```

### Inspect Data
```bash
# List all volumes
docker volume ls

# Inspect volume details
docker volume inspect investing_investing_data

# Access volume contents
docker run --rm -it \
  -v investing_investing_data:/data \
  alpine sh -c "cd /data && ls -la"
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :3002  # Frontend
lsof -i :5001  # Backend
lsof -i :80    # Production frontend

# Kill processes using ports
kill -9 $(lsof -ti:5001)
```

#### Container Health Issues
```bash
# Check container health
docker compose ps

# View detailed health status
docker inspect <container_name> --format='{{.State.Health}}'

# Check container logs
docker compose logs backend
docker compose logs frontend
```

#### Volume Issues
```bash
# Check volume mounts
docker compose config

# Recreate volumes
docker compose down -v
docker compose up --build
```

#### Memory Issues
```bash
# Check Docker resource usage
docker stats

# Increase Docker Desktop memory allocation
# Docker Desktop > Settings > Resources > Advanced
```

### Build Issues

#### Clean Build
```bash
# Remove all containers and images
docker compose down
docker system prune -a

# Rebuild from scratch
docker compose up --build --force-recreate
```

#### Cache Issues
```bash
# Build without cache
docker compose build --no-cache
```

## 🔍 Monitoring & Logs

### Real-time Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Last N lines
docker compose logs --tail=50 backend
```

### Container Status
```bash
# List running containers
docker compose ps

# Detailed container info
docker compose top

# Resource usage
docker stats
```

### Health Monitoring
```bash
# Check health status
docker compose ps

# Manual health check
curl http://localhost:5001/health
```

## 🚀 Deployment Tips

### Development Best Practices
1. Use volume mounts for live code editing
2. Monitor logs for errors and warnings  
3. Regularly backup data volume
4. Keep Docker Desktop updated

### Production Best Practices
1. Use production docker-compose file
2. Set up automated backups
3. Monitor health checks
4. Use reverse proxy for SSL/TLS
5. Implement log rotation
6. Set resource limits

### Environment Variables
Create `.env` files for environment-specific settings:

```bash
# backend/.env
NODE_ENV=development
PORT=5001
LOG_LEVEL=debug

# frontend/.env
REACT_APP_API_URL=http://localhost:5001
PORT=3002
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [React Docker Deployment](https://create-react-app.dev/docs/deployment/#docker)
- [Nginx Configuration](https://nginx.org/en/docs/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker Desktop logs
3. Verify system requirements
4. Check the project's GitHub issues
5. Create a new issue with:
   - Operating system
   - Docker version
   - Error messages
   - Steps to reproduce
