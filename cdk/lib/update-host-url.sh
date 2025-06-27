#!/bin/bash

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Please install it first."
  exit 1
fi

# Prompt for Lambda function name
read -p "Enter the Lambda function name: " FUNCTION_NAME

if [ -z "$FUNCTION_NAME" ]; then
  echo "❌ Lambda function name cannot be empty."
  exit 1
fi

# Prompt for API Gateway URL
read -p "Enter the API Gateway URL: " API_URL

# Basic validation
if [[ ! "$API_URL" =~ ^https?://.+ ]]; then
  echo "❌ Invalid URL format."
  exit 1
fi

# Update Lambda function configuration
echo "🔄 Updating Lambda function \"$FUNCTION_NAME\" with HOST_URL..."

aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --environment "Variables={HOST_URL=$API_URL}"

if [ $? -eq 0 ]; then
  echo "✅ Lambda function \"$FUNCTION_NAME\" updated with HOST_URL=$API_URL"
else
  echo "❌ Failed to update Lambda function."
fi
