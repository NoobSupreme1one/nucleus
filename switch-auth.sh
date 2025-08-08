#!/bin/bash

# Script to switch between Cognito and Local authentication

echo "Current authentication configuration:"
grep -E "(AWS_COGNITO_USER_POOL_ID|AWS_COGNITO_CLIENT_ID)" .env

echo ""
echo "Choose authentication mode:"
echo "1) Local Development Auth (recommended for development)"
echo "2) AWS Cognito Auth (production mode)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo "Switching to LOCAL authentication..."
    # Comment out Cognito variables
    sed -i 's/^AWS_COGNITO_USER_POOL_ID=/# AWS_COGNITO_USER_POOL_ID=/' .env
    sed -i 's/^AWS_COGNITO_CLIENT_ID=/# AWS_COGNITO_CLIENT_ID=/' .env
    echo "✅ Switched to LOCAL auth. Restart your server."
    echo "   You can now login with:"
    echo "   Email: test@example.com, Password: password123"
    echo "   Email: admin@example.com, Password: admin123"
elif [ "$choice" = "2" ]; then
    echo "Switching to COGNITO authentication..."
    # Uncomment Cognito variables
    sed -i 's/^# AWS_COGNITO_USER_POOL_ID=/AWS_COGNITO_USER_POOL_ID=/' .env
    sed -i 's/^# AWS_COGNITO_CLIENT_ID=/AWS_COGNITO_CLIENT_ID=/' .env
    echo "✅ Switched to COGNITO auth. Restart your server."
    echo "   Remember: Cognito accounts need email confirmation!"
else
    echo "Invalid choice. Exiting."
fi
