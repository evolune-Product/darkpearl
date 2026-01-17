# Deploying darkpearl to Contabo Server

Deploy darkpearl to `darkpearl.evolune.in` on your Contabo server.

---

## Prerequisites

- SSH access to your Contabo server
- Root or sudo privileges
- Domain DNS access (to add subdomain)

---

## Step 1: DNS Configuration

Add an A record for your subdomain in your DNS provider (where evolune.in is managed):

```
Type: A
Host: darkpearl
Value: <your-contabo-server-ip>
TTL: 3600 (or Auto)
```

Wait for DNS propagation (can take up to 24 hours, usually 5-30 minutes).

Verify with:
```bash
dig darkpearl.evolune.in
# or
nslookup darkpearl.evolune.in
```

---

## Step 2: Create a Dedicated User

SSH into your server as root:

```bash
ssh root@<your-contabo-ip>
```

Create a new user for darkpearl:

```bash
# Create user with home directory
sudo adduser darkpearl

# Follow prompts to set password
# You can skip the optional info (press Enter)

# Add user to sudo group (optional, for maintenance)
sudo usermod -aG sudo darkpearl
```

---

## Step 3: Install Node.js (if not already installed globally)

Check if Node.js is installed:
```bash
node --version
```

If not installed, install Node.js 20.x (LTS):

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

---

## Step 4: Set Up Application Directory

Switch to darkpearl user:
```bash
sudo su - darkpearl
```

Create app directory:
```bash
mkdir -p ~/app
cd ~/app
```

---

## Step 5: Clone or Upload the Repository

**Option A: Clone from Git (if hosted on GitHub/GitLab)**
```bash
git clone https://github.com/your-username/darkpearl.git .
```

**Option B: Upload via SCP (from your local machine)**

From your local Windows machine (run in PowerShell/CMD):
```powershell
# Compress the project first (exclude node_modules)
# Then upload
scp -r E:\Evolune_Products\Dark-main darkpearl@<your-contabo-ip>:~/app/
```

Or use rsync for better performance:
```bash
rsync -avz --exclude 'node_modules' --exclude '.svelte-kit' --exclude 'pocketbase/pb_data' -e ssh . darkpearl@<your-contabo-ip>:~/app/
```

---

## Step 6: Install Dependencies

```bash
cd ~/app

# Install npm dependencies
npm install

# Download Pocketbase binary for Linux
npm run pocketbase:download
# Or manually download:
# wget https://github.com/pocketbase/pocketbase/releases/download/v0.23.8/pocketbase_0.23.8_linux_amd64.zip
# unzip pocketbase_0.23.8_linux_amd64.zip -d pocketbase/
# chmod +x pocketbase/pocketbase
```

---

## Step 7: Configure Environment Variables

**Important:** Never commit `.env` to git. It contains secrets.

| File | Purpose | Commit? |
|------|---------|---------|
| `.env.example` | Template with empty values | Yes |
| `.env` | Actual secrets | **Never** |

Create your production `.env`:
```bash
cp .env.example .env
nano .env
```

Fill in **all** the following:
```env
# ===========================================
# LLM Configuration
# ===========================================
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-production-api-key
LLM_MODEL=gpt-4o

# ===========================================
# Server Configuration
# ===========================================
PORT=5173
HOST=0.0.0.0
POCKETBASE_URL=http://127.0.0.1:8091

# ===========================================
# GitHub OAuth (Optional but recommended)
# ===========================================
# See Step 8 for how to create these
GITHUB_CLIENT_ID=your-production-client-id
GITHUB_CLIENT_SECRET=your-production-client-secret
GITHUB_REDIRECT_URI=https://darkpearl.evolune.in/api/auth/github/callback
```

---

## Step 8: Set Up GitHub OAuth (Optional)

GitHub OAuth allows users to log in with their GitHub account. You need a **separate OAuth App for production** (different from your local dev one).

### Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in the details:

| Field | Value |
|-------|-------|
| Application name | `darkpearl (Production)` |
| Homepage URL | `https://darkpearl.evolune.in` |
| Authorization callback URL | `https://darkpearl.evolune.in/api/auth/github/callback` |

4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it immediately (shown only once)

### Add to .env

```bash
nano ~/app/.env
```

Update these lines with your new credentials:
```env
GITHUB_CLIENT_ID=Ov23li...your-production-id
GITHUB_CLIENT_SECRET=abc123...your-production-secret
GITHUB_REDIRECT_URI=https://darkpearl.evolune.in/api/auth/github/callback
```

**Note:** Keep your local development OAuth App separate. Use different Client ID/Secret for localhost vs production.

---

## Step 9: Build the Application

```bash
npm run build
```

This creates the production build in the `build/` directory.

---

## Step 10: Set Up Systemd Services

Create two systemd services: one for Pocketbase, one for the SvelteKit app.

Exit to root user:
```bash
exit
```

### Pocketbase Service

```bash
sudo nano /etc/systemd/system/darkpearl-pocketbase.service
```

Paste:
```ini
[Unit]
Description=darkpearl Pocketbase
After=network.target

[Service]
Type=simple
User=darkpearl
Group=darkpearl
WorkingDirectory=/home/darkpearl/app/pocketbase
ExecStart=/home/darkpearl/app/pocketbase/pocketbase serve --http=127.0.0.1:8091
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### SvelteKit App Service

```bash
sudo nano /etc/systemd/system/darkpearl-app.service
```

Paste:
```ini
[Unit]
Description=darkpearl SvelteKit App
After=network.target darkpearl-pocketbase.service
Requires=darkpearl-pocketbase.service

[Service]
Type=simple
User=darkpearl
Group=darkpearl
WorkingDirectory=/home/darkpearl/app
ExecStart=/usr/bin/node build
Restart=always
RestartSec=5

# Load environment from .env file
EnvironmentFile=/home/darkpearl/app/.env

# Override/ensure these are set
Environment=NODE_ENV=production
Environment=PORT=5173
Environment=HOST=0.0.0.0
Environment=POCKETBASE_URL=http://127.0.0.1:8091

[Install]
WantedBy=multi-user.target
```

**Note:** The `EnvironmentFile` directive loads all variables from `.env`, including `LLM_*` and `GITHUB_*` settings. The `Environment` lines below it can override specific values if needed.

### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable darkpearl-pocketbase
sudo systemctl enable darkpearl-app

# Start services
sudo systemctl start darkpearl-pocketbase
sudo systemctl start darkpearl-app

# Check status
sudo systemctl status darkpearl-pocketbase
sudo systemctl status darkpearl-app
```

---

## Step 11: Configure Nginx Reverse Proxy

Install Nginx if not already installed:
```bash
sudo apt update
sudo apt install nginx -y
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/darkpearl.evolune.in
```

Paste:
```nginx
server {
    listen 80;
    server_name darkpearl.evolune.in;

    # Increase max body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE support for realtime
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/darkpearl.evolune.in /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 12: Set Up SSL with Let's Encrypt

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d darkpearl.evolune.in
```

Follow the prompts:
1. Enter email for renewal notices
2. Agree to terms of service
3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)

Certbot will automatically modify your Nginx config and set up auto-renewal.

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 13: Configure Firewall (if enabled)

If you have UFW enabled:
```bash
sudo ufw allow 'Nginx Full'
sudo ufw status
```

---

## Step 14: First-Time Setup

1. Visit `https://darkpearl.evolune.in/setup`
2. Create your admin account
3. Complete the setup wizard
4. Configure LLM settings at `https://darkpearl.evolune.in/darkpearl/settings`

---

## Useful Commands

### Check Logs

```bash
# Pocketbase logs
sudo journalctl -u darkpearl-pocketbase -f

# App logs
sudo journalctl -u darkpearl-app -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
sudo systemctl restart darkpearl-pocketbase
sudo systemctl restart darkpearl-app
```

### Update Application

```bash
# Switch to darkpearl user
sudo su - darkpearl
cd ~/app

# Pull latest changes (if using git)
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Exit and restart services
exit
sudo systemctl restart darkpearl-pocketbase
sudo systemctl restart darkpearl-app
```

### Check if Services are Running

```bash
sudo systemctl status darkpearl-pocketbase
sudo systemctl status darkpearl-app

# Or check ports
sudo ss -tlnp | grep -E '5173|8091'
```

---

## Troubleshooting

### App not starting

Check logs:
```bash
sudo journalctl -u darkpearl-app -n 50
```

Common issues:
- Node.js not found: Ensure `/usr/bin/node` exists
- Port already in use: Check with `sudo ss -tlnp | grep 5173`
- Missing dependencies: Run `npm install` again

### Pocketbase not starting

Check logs:
```bash
sudo journalctl -u darkpearl-pocketbase -n 50
```

Common issues:
- Binary not executable: `chmod +x /home/darkpearl/app/pocketbase/pocketbase`
- Wrong architecture: Download correct binary for your server (amd64 for most)

### 502 Bad Gateway

- App not running: `sudo systemctl status darkpearl-app`
- Wrong port in Nginx config
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### SSL Certificate Issues

Renew manually:
```bash
sudo certbot renew
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R darkpearl:darkpearl /home/darkpearl/app
```

---

## Backup Strategy

### Backup Pocketbase Data

The database and uploaded files are in `pocketbase/pb_data/`:

```bash
# Create backup
sudo su - darkpearl
cd ~/app
tar -czvf backup-$(date +%Y%m%d).tar.gz pocketbase/pb_data/
```

### Automated Backups (Optional)

Create a cron job:
```bash
crontab -e
```

Add:
```cron
# Daily backup at 3 AM
0 3 * * * tar -czvf /home/darkpearl/backups/darkpearl-$(date +\%Y\%m\%d).tar.gz /home/darkpearl/app/pocketbase/pb_data/
```

---

## Summary

After completing all steps, your darkpearl instance will be available at:

- **App**: https://darkpearl.evolune.in
- **Admin**: https://darkpearl.evolune.in/darkpearl
- **Setup**: https://darkpearl.evolune.in/setup (first time only)
- **Settings**: https://darkpearl.evolune.in/darkpearl/settings

---

**Last Updated**: 2025-01-17
