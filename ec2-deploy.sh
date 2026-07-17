#!/bin/bash

# EC2 Deployment Script for Vaultify Backend

EC2_USER="ec2-user"
EC2_HOST="your-ec2-ip"
KEY_PATH="~/.ssh/your-key.pem"
APP_DIR="/home/ec2-user/vaultify-backend"

echo "=== EC2 Deployment ==="

# 1. Create deployment package (exclude node_modules, will install on server)
echo "Creating deployment package..."
zip -r deploy-ec2.zip src/ package.json package-lock.json .env.example -x "*.md"

# 2. SCP to EC2
echo "Uploading to EC2..."
scp -i $KEY_PATH deploy-ec2.zip $EC2_USER@$EC2_HOST:~/

# 3. SSH and deploy
echo "Deploying on EC2..."
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
  # Install Node.js if not present
  if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
  fi

  # Setup app directory
  mkdir -p vaultify-backend
  cd vaultify-backend

  # Backup old
  if [ -d "src" ]; then
    mv src src.backup.$(date +%s)
  fi

  # Extract new
  unzip -o ~/deploy-ec2.zip

  # Install dependencies
  npm ci --production

  # Create .env if not exists
  if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "WARNING: Update .env with real values!"
  fi

  # PM2 setup
  if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
  fi

  # Start/Restart app
  pm2 delete vaultify-backend 2>/dev/null || true
  pm2 start src/server.js --name vaultify-backend
  pm2 save
  pm2 startup

  echo "Deploy complete!"
  echo "Health check: http://$EC2_HOST:5000/health"
EOF

echo "=== Done ==="
