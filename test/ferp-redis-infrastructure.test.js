const cdk = require('aws-cdk-lib');
const { Template } = require('aws-cdk-lib/assertions');
const { FerpRedisInfrastructureStack } = require('../lib/ferp-redis-infrastructure-stack');

const app = new cdk.App();
const stack = new FerpRedisInfrastructureStack(app, 'TestStack');
const template = Template.fromStack(stack);

const sports = ['football', 'soccer', 'rugby', 'baseball'];

test('creates one production replication group per sport plus one staging group', () => {
  template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', sports.length + 1);
});

test.each(sports)('%s production cluster is a 3-node Multi-AZ r7g.large group', (sport) => {
  template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
    ReplicationGroupId: `ferp-${sport}-prod`,
    CacheNodeType: 'cache.r7g.large',
    Engine: 'redis',
    EngineVersion: '7.0',
    NumCacheClusters: 3,
    MultiAZEnabled: true,
    AutomaticFailoverEnabled: true,
    CacheSubnetGroupName: 'ferp-production-redis',
    SecurityGroupIds: ['sg-c68169a3'],
    SnapshotRetentionLimit: 1,
  });
});

test('staging cluster is a single production-sized node with staging overrides', () => {
  template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
    ReplicationGroupId: 'ferp-staging',
    CacheNodeType: 'cache.r7g.large',
    NumCacheClusters: 1,
    MultiAZEnabled: false,
    AutomaticFailoverEnabled: false,
    CacheSubnetGroupName: 'ferp-staging-redis',
    SnapshotWindow: '08:30-09:30',
    PreferredMaintenanceWindow: 'sun:05:00-sun:06:00',
  });
});
