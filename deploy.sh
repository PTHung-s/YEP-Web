#!/bin/bash
set -e

echo "🔨 Building..."
rm -rf dist
npm run build

echo ""
echo "📦 Packing..."
tar -czf deploy.tar.gz --exclude='server/data' dist/ server/

echo ""
echo "🚀 Deploying..."
scp deploy.tar.gz YEP:/root/yep-web/deploy.tar.gz
ssh YEP "cd /root/yep-web && tar -xzf deploy.tar.gz && pm2 restart yep-web"

echo ""
echo "✅ Deploy complete!"
