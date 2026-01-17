# Deployment Options

darkpearl can be deployed to any Node.js host. Choose the option that fits your needs:

## 🚀 Quick Deploy (Recommended for Alpha)

### Railway - Easiest
**Best for:** Beginners, fast deployment, managed infrastructure

- ✅ One-click deploy
- ✅ Automatic HTTPS
- ✅ Built-in volumes
- ✅ $5/mo base cost

**[→ Railway Deployment Guide](./railway/README.md)**

## 🐳 Self-Hosted

### Docker - Universal
**Best for:** Any VPS, DigitalOcean, AWS, Azure, GCP

- ✅ Works anywhere Docker runs
- ✅ Full control
- ✅ Portable
- 💰 $6-15/mo (VPS cost)

**[→ Docker Deployment Guide](./docker/README.md)**

## 🔜 Coming Soon

### Vercel
- Serverless deployment
- Edge functions
- Free tier available

### Render
- Similar to Railway
- Auto-deploy from GitHub
- Free tier (with sleep)

### Fly.io
- Global edge deployment
- Multi-region support
- ~$5/mo

## Comparison

| Platform | Difficulty | Cost/mo | Pros | Cons |
|----------|-----------|---------|------|------|
| **Railway** | ⭐ Easy | $5-10 | Managed, simple, volumes | Slightly pricier |
| **Docker (VPS)** | ⭐⭐ Medium | $6-15 | Full control, portable | Manual setup, maintenance |
| **Fly.io** | ⭐⭐ Medium | $5-10 | Global, fast | CLI required |
| **Vercel** | ⭐⭐⭐ Hard | $0-20 | Free tier, fast | Serverless limits |

## Which Should I Choose?

**Just want it working fast?** → Railway

**Want full control / already have a VPS?** → Docker

**Need global performance?** → Fly.io (coming soon)

**Free tier for testing?** → Vercel (coming soon)

## Local Development

See [../README.md](../README.md#2-local-development) for local setup instructions.
