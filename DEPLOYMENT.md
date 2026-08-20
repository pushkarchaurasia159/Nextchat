# NextChat Deployment Guide 🚀

NextChat is structured as a unified full-stack application. The Node.js Express server handles both REST API endpoints and Socket.IO real-time WebSocket connections, while also serving the compiled React frontend static files from `client/dist`.

---

## 1. Deploy on Render (Recommended & Free)

Render provides free hosting for Node.js web services with full WebSocket support.

### Steps:
1. Initialize git in the NextChat folder if you haven't already:
   ```bash
   cd C:\Users\Harsh\.gemini\antigravity\scratch\nextchat
   git init
   git add .
   git commit -m "Initial NextChat release"
   ```
2. Push your project to a GitHub repository:
   ```bash
   git remote add origin https://github.com/your-username/nextchat.git
   git branch -M main
   git push -u origin main
   ```
3. Visit [render.com](https://render.com/) and click **New +** -> **Web Service**.
4. Select your GitHub repository.
5. Fill in the fields:
   - **Name**: `nextchat-app`
   - **Region**: Select your nearest region
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `nextchat_secure_cloud_secret_2026`
   - `DATABASE_URL` = `file:./dev.db`
7. Click **Create Web Service**. Your live chat URL will be ready in a few minutes!

---

## 2. Deploy on Railway

1. Install Railway CLI or connect via GitHub on [railway.app](https://railway.app/).
2. Create a new project -> **Deploy from GitHub repo**.
3. Railway will automatically detect the `Dockerfile` in the root directory.
4. Set the environment variable `JWT_SECRET` in the Railway variables tab.
5. Railway provides you with a public HTTPS/WSS URL automatically.

---

## 3. Deploy on Fly.io

1. Install the flyctl CLI (`powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`).
2. Run in the project directory:
   ```bash
   fly launch
   ```
3. Fly will build the Docker container and deploy it globally.
4. Run:
   ```bash
   fly secrets set JWT_SECRET="your_secret_key"
   fly deploy
   ```

---

## 4. Deploy on Any VPS (Ubuntu, Debian, EC2, DigitalOcean)

1. SSH into your VPS:
   ```bash
   ssh root@your_server_ip
   ```
2. Clone repository & install dependencies:
   ```bash
   git clone https://github.com/your-username/nextchat.git
   cd nextchat
   npm install
   npm --prefix client install
   npm run build
   ```
3. Run with PM2 for background persistence:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "nextchat"
   pm2 save
   pm2 startup
   ```
4. (Optional) Configure Nginx reverse proxy with SSL (Let's Encrypt / Certbot) for `https://yourdomain.com` with WebSocket proxying:
   ```nginx
   location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
   }
   ```
