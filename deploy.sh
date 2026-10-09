#!/bin/bash
set -e

PORTFOLIO_DIR="/home/ubuntu/portfolio"
WEB_ROOT="/var/www/tonyxtian.com"

echo "🚀 Starting portfolio deployment..."

cd $PORTFOLIO_DIR

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the site..."
npm run build

# Only the build goes live: dist/ holds the pages (one folder per route), the
# hashed assets and the sitemap. --delete clears out anything the build no
# longer makes.
echo "🚢 Deploying to web root..."
sudo rsync -av --delete $PORTFOLIO_DIR/dist/ $WEB_ROOT/

echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data $WEB_ROOT
sudo chmod -R 755 $WEB_ROOT

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Deployment complete! Visit https://tonyxtian.com"
