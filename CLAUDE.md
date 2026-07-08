# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                # run Jest tests
npx cdk synth           # synthesize and print the CloudFormation template
npx cdk diff            # compare local stack with what is deployed in AWS
npx cdk deploy          # deploy the stack to AWS
npx jest -t "<name>"    # run a single test by name
```

No build step is required — the CDK app runs directly as plain JavaScript.

## Architecture

This is an AWS CDK v2 project (JavaScript) that provisions ElastiCache Redis replication groups for the FERP (Front-End Reporting Platform) application.

**Entry point:** `bin/ferp-redis-infrastructure.js` instantiates a single CDK app and stack.

**Stack:** `lib/ferp-redis-infrastructure-stack.js` contains all infrastructure. The core pattern is a `sports` array (`['football', 'soccer', 'rugby', 'baseball']`) that is looped over to create one production `CfnReplicationGroup` per sport. Adding a new sport requires only appending to that array. A single `ferp-staging` replication group, shared by all sports, is defined after the loop.

**Shared config:** All clusters spread a common `redisConfig` object defined at the top of the constructor, mirroring the existing `ferp-production-redis` cluster (node type `cache.r7g.large`, Redis 7.0.7, 3-node Multi-AZ with automatic failover, subnet group `ferp-production-redis`, security group `sg-c68169a3`). The staging group overrides parts of it: 1 node (no replicas, failover, or Multi-AZ), subnet group `ferp-staging-redis`, and staging-specific snapshot/maintenance windows. The source cluster settings are captured in `redis-config.json` for reference.

**Staging was imported, not created:** the pre-existing `ferp-staging` group was adopted into the stack with `cdk import` and resized in place. Removing it from the stack would delete the live resource like any other.

**L1 constructs:** `CfnReplicationGroup` (not L2) is used throughout because ElastiCache does not have stable L2 constructs in CDK. Properties map 1-to-1 to CloudFormation resource properties.

**Tests:** `test/ferp-redis-infrastructure.test.js` uses Jest with `aws-cdk-lib/assertions` (`Template.fromStack`) to assert on the synthesized `AWS::ElastiCache::ReplicationGroup` resources.
