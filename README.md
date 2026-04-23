# ferp-redis-infrastructure

AWS CDK project that provisions ElastiCache Redis replication groups for the Front-End Reporting Platform (FERP). Each sports vertical (football, soccer, rugby) gets its own isolated Redis cluster, all mirroring the configuration of the existing `ferp-production-redis` cluster.

## Infrastructure overview

Each cluster is a `CfnReplicationGroup` with the following configuration:

| Setting | Value |
|---|---|
| Node type | `cache.r7g.large` |
| Engine | Redis 7.0.7 |
| Parameter group | `default.redis7` |
| Subnet group | `ferp-production-redis` |
| Security group | `sg-c68169a3` |
| Nodes | 3 (1 primary + 2 replicas) |
| Multi-AZ | Enabled |
| Automatic failover | Enabled |
| Snapshot retention | 1 day |
| Snapshot window | 05:00–06:00 UTC |
| Maintenance window | Thursday 08:00–09:00 UTC |

Provisioned clusters:
- `ferp-football-redis`
- `ferp-soccer-redis`
- `ferp-rugby-redis`

## Adding a new sport

Open `lib/ferp-redis-infrastructure-stack.js` and append the sport name to the `sports` array:

```js
const sports = ['football', 'soccer', 'rugby', 'baseball'];
```

Running `npx cdk deploy` will provision the new replication group with the same shared configuration.

## Prerequisites

- Node.js 18+
- AWS CLI configured with credentials for the target account (`us-east-1`)
- AWS CDK Toolkit: `npm install -g aws-cdk`

## Commands

```bash
npm install          # install dependencies
npm test             # run Jest tests
npx cdk synth        # synthesize and print the CloudFormation template
npx cdk diff         # compare local stack with what is deployed in AWS
npx cdk deploy       # deploy the stack to AWS
```

## Reference

`redis-config.json` in the repo root captures the settings of the source `ferp-production-redis` cluster that all new clusters are modelled after.
