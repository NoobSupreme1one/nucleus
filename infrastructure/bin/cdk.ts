#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NucleusInfrastructureStack } from '../cdk-stack';

const app = new cdk.App();

new NucleusInfrastructureStack(app, 'NucleusInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Infrastructure for Nucleus - Co-founder matching and idea validation platform',
  tags: {
    Project: 'Nucleus',
    Environment: 'Production',
    ManagedBy: 'CDK',
  },
});