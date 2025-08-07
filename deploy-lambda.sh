#!/bin/bash

# Load environment variables from .env.production
export $(cat .env.production | grep -v '^#' | xargs)

# Deploy using serverless
serverless deploy --region us-west-1 --verbose