# File Management and Sharing App

A modern, Dockerized file management and sharing application built with React, TailwindCSS, Express, and Multer.

## 🚀 Quick Deployment (VPS)

1. Clone the repository to your VPS.
2. Edit `.env.example` and save it as `.env`.
   - Ensure you update `JWT_SECRET` and `APP_URL`.
3. Run the application:
   ```bash
   docker compose up -d --build
   ```
4. Access the app at `http://YOUR_VPS_IP:3000`.

## 🌐 Nginx + Let's Encrypt Setup (Optional)

If you are setting up a reverse proxy with Nginx and Let's Encrypt for HTTPS:
1. Ensure your domain is pointing to your VPS IP.
2. An example `nginx.conf` is provided. You can include it in your system's Nginx `/etc/nginx/sites-available` or run Nginx as a reversed proxy container alongside the app.
3. Install `certbot` and run `sudo certbot --nginx -d yourdomain.com`.

## 📁 Architecture

- **Unified Full-Stack Architecture**: To ensure optimal containerization (a single, lightweight Docker image) and a seamless developer experience, this project uses a unified Vite + Express stack. 
- **Frontend** (`src/`): React SPA using Vite, TailwindCSS, and Framer Motion.
- **Backend** (`server/`): Express serving API routes, Multer for file uploads, and a simple JSON-based database for persistence.
- **Storage**: Real files are kept in `./uploads` and metadata in `./data`, both mounted as Docker volumes for persistence.
