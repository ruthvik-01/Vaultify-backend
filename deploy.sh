#!/bin/bash

# Vaultify Backend Lambda Deployment Script

echo "Building deployment package..."

# Create zip excluding dev dependencies and unnecessary files
zip -r deploy.zip index.js src/ package.json package-lock.json node_modules/ \
  -x "node_modules/.cache/*" \
  -x "node_modules/aws-sdk/*" \
  -x "node_modules/@aws-sdk/*" \
  -x "*.md" \
  -x ".git/*" \
  -x ".env*"

echo "Deploying to AWS Lambda..."

# Update Lambda function code
aws lambda update-function-code \
  --function-name vaultify-backend \
  --zip-file fileb://deploy.zip \
  --region us-east-1

echo "Deployment complete!"
echo ""
echo "Test endpoints:"
echo "  Health:   https://oguzzn13dj.execute-api.us-east-1.amazonaws.com/default/health"
echo "  API:      https://oguzzn13dj.execute-api.us-east-1.amazonaws.com/default/api/auth/register"
