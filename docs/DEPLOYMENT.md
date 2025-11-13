# Deployment Guide

This guide covers different ways to deploy SplitMoney to production.

## Prerequisites

- Node.js 16+ installed locally
- Git repository (GitHub, GitLab, etc.)
- Account on chosen hosting platform

## Build Process

SplitMoney uses Nuxt 3's build system. Choose between:

### Static Site Generation (Recommended)

Generates a fully static site that can be hosted anywhere:

```bash
yarn generate
```

Output: `.output/public/` directory containing static files

### Standard Build

Builds an optimized client-side application:

```bash
yarn build
```

Output: `.output/` directory

## Deployment Options

### 1. Vercel (Recommended) ⭐

**Best for:** Zero-config deployment with automatic builds

#### Setup

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

#### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "yarn generate",
  "outputDirectory": ".output/public"
}
```

#### Automatic Deployment

1. Import repository in [Vercel Dashboard](https://vercel.com)
2. Connect GitHub repository
3. Vercel auto-detects Nuxt 3
4. Deploy automatically on every push

**Environment:**

- Framework Preset: Nuxt.js
- Build Command: `yarn generate`
- Output Directory: `.output/public`

### 2. Netlify

**Best for:** Easy deployment with excellent documentation

#### Manual Deploy

1. Build locally:

```bash
yarn generate
```

2. Drag `.output/public` folder to [Netlify Drop](https://app.netlify.com/drop)

#### Automatic Deployment

1. Connect repository in [Netlify Dashboard](https://app.netlify.com)
2. Configure build settings:
   - Build command: `yarn generate`
   - Publish directory: `.output/public`
3. Deploy

#### Configuration

Create `netlify.toml`:

```toml
[build]
  command = "yarn generate"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. GitHub Pages

**Best for:** Free hosting for open source projects

#### Setup

1. Install `gh-pages` package:

```bash
yarn add -D gh-pages
```

2. Add deploy script to `package.json`:

```json
{
  "scripts": {
    "deploy": "yarn generate && gh-pages -d .output/public"
  }
}
```

3. Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  app: {
    baseURL: "/splitmoney/", // Replace with your repo name
    buildAssetsDir: "/assets/",
  },
});
```

4. Deploy:

```bash
yarn deploy
```

#### GitHub Actions (Automatic)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: yarn install

      - name: Generate static site
        run: yarn generate

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .output/public
```

### 4. Cloudflare Pages

**Best for:** Global CDN with excellent performance

#### Setup

1. Connect repository in [Cloudflare Pages](https://pages.cloudflare.com)
2. Configure build:
   - Build command: `yarn generate`
   - Build output directory: `.output/public`
3. Deploy

#### Configuration

No additional configuration needed - Cloudflare auto-detects Nuxt 3.

### 5. AWS S3 + CloudFront

**Best for:** Enterprise deployments with AWS infrastructure

#### Steps

1. Build static site:

```bash
yarn generate
```

2. Create S3 bucket:

```bash
aws s3 mb s3://splitmoney-app
```

3. Configure bucket for static hosting:

```bash
aws s3 website s3://splitmoney-app \
  --index-document index.html \
  --error-document index.html
```

4. Upload files:

```bash
aws s3 sync .output/public s3://splitmoney-app --delete
```

5. Create CloudFront distribution:

   - Origin: S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Default Root Object: index.html

6. Configure error pages:
   - 403: /index.html (200 response)
   - 404: /index.html (200 response)

### 6. Docker

**Best for:** Containerized deployments

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn generate

# Production stage
FROM nginx:alpine

COPY --from=builder /app/.output/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Build and Run

```bash
# Build image
docker build -t splitmoney .

# Run container
docker run -p 8080:80 splitmoney
```

### 7. Traditional Server (VPS)

**Best for:** Full control over hosting environment

#### Using Nginx

1. Build static site:

```bash
yarn generate
```

2. Copy files to server:

```bash
scp -r .output/public/* user@server:/var/www/splitmoney/
```

3. Configure Nginx:

```nginx
server {
    listen 80;
    server_name splitmoney.example.com;
    root /var/www/splitmoney;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;
}
```

4. Enable HTTPS with Let's Encrypt:

```bash
certbot --nginx -d splitmoney.example.com
```

## Environment Variables

SplitMoney currently doesn't require environment variables, but if you add backend integration:

### Example `.env`

```bash
# API Configuration
NUXT_PUBLIC_API_BASE_URL=https://api.example.com

# Feature Flags
NUXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Setting in Platforms

**Vercel/Netlify:**

- Add in dashboard under Environment Variables

**GitHub Actions:**

```yaml
env:
  NUXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

**Docker:**

```bash
docker run -e NUXT_PUBLIC_API_BASE_URL=https://api.example.com splitmoney
```

## Performance Optimization

### 1. Enable Compression

Ensure gzip/brotli compression is enabled on your server.

### 2. CDN Configuration

**Recommended Cache Headers:**

```
# HTML files
Cache-Control: public, max-age=0, must-revalidate

# Static assets (JS, CSS, images)
Cache-Control: public, max-age=31536000, immutable
```

### 3. Asset Optimization

Nuxt automatically optimizes assets during build:

- Minifies JS and CSS
- Optimizes images
- Generates modern/legacy bundles

## Monitoring & Analytics

### Add Google Analytics

Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID",
          async: true,
        },
        {
          children: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `,
        },
      ],
    },
  },
});
```

### Error Tracking

Consider integrating:

- [Sentry](https://sentry.io)
- [Bugsnag](https://www.bugsnag.com)
- [LogRocket](https://logrocket.com)

## Troubleshooting

### Build Fails

**Issue:** Build fails with memory error

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" yarn generate
```

### 404 on Refresh

**Issue:** Page not found when refreshing on client-side route

**Solution:** Configure server to serve `index.html` for all routes (see platform-specific configs above)

### Assets Not Loading

**Issue:** CSS/JS files return 404

**Solution:** Check `baseURL` in `nuxt.config.ts` matches deployment path

### LocalStorage Not Working

**Issue:** Participants not persisting

**Solution:** Ensure HTTPS is enabled (some browsers restrict localStorage on HTTP)

## Rollback Strategy

### Quick Rollback

**Vercel/Netlify:**

- Dashboard → Deployments → Select previous deployment → "Publish"

**GitHub Pages:**

```bash
git revert HEAD
git push
```

**Docker:**

```bash
docker run previous-image-tag
```

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] All features work as expected
- [ ] LocalStorage persists participants
- [ ] Calculations are accurate
- [ ] Mobile responsive design works
- [ ] HTTPS is enabled
- [ ] 404 handling works (refresh on routes)
- [ ] Performance is acceptable (Lighthouse score)
- [ ] Analytics tracking (if enabled)

## Support

For deployment issues:

- Check [Nuxt 3 Deployment Docs](https://nuxt.com/docs/getting-started/deployment)
- Open issue on [GitHub](https://github.com/simone98dm/splitmoney)
- Contact maintainer: [@simone98dm](https://github.com/simone98dm)

---

Happy deploying! 🚀
