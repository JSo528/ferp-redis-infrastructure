const { Stack } = require('aws-cdk-lib');
const elasticache = require('aws-cdk-lib/aws-elasticache');

class FerpRedisInfrastructureStack extends Stack {
  /**
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Sports verticals that each require their own isolated Redis replication group.
    // Adding a new sport here is the only change needed to provision another cluster.
    const sports = ['football', 'soccer', 'rugby', 'baseball'];

    // Shared configuration derived from the existing ferp-production-redis cluster.
    // All new clusters mirror production to keep behaviour consistent across verticals.
    const redisConfig = {
      // r7g.large matches the existing production node type
      cacheNodeType: 'cache.r7g.large',

      engine: 'redis',

      // Pinned to the same minor version running in production (7.0.7)
      engineVersion: '7.0.7',

      // Uses the AWS-managed default parameter group for Redis 7
      cacheParameterGroupName: 'default.redis7',

      // Subnet group that places nodes in the correct private subnets
      cacheSubnetGroupName: 'ferp-production-redis',

      // Security group controlling inbound access to port 6379
      securityGroupIds: ['sg-c68169a3'],

      // 1 primary + 2 replicas, matching the production 3-node layout
      numCacheClusters: 3,

      // Automatic failover requires Multi-AZ and at least one replica
      automaticFailoverEnabled: true,
      multiAzEnabled: true,

      // Retain one daily snapshot so we can restore to the previous day if needed
      snapshotRetentionLimit: 1,
      snapshotWindow: '05:00-06:00',

      // Low-traffic maintenance window (Thursday early morning UTC)
      preferredMaintenanceWindow: 'thu:08:00-thu:09:00',

      // Encryption disabled to match the production cluster — enable before
      // storing any sensitive data in these clusters
      atRestEncryptionEnabled: false,
      transitEncryptionEnabled: false,
    };

    // Provision one replication group per sport, using the shared config above.
    sports.forEach((sport) => {
      new elasticache.CfnReplicationGroup(this, `Ferp${capitalize(sport)}Redis`, {
        // Human-readable description shown in the AWS console
        replicationGroupDescription: `Redis replication group for ferp ${sport} production`,

        // Explicit ID keeps the AWS resource name predictable and grep-friendly
        replicationGroupId: `ferp-${sport}-prod`,

        ...redisConfig,
      });
    });
  }
}

// Capitalises the first letter of a string for use in CDK logical IDs
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { FerpRedisInfrastructureStack }
