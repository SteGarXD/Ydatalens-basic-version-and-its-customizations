/**
 * Extended Connectors
 * Расширенный список коннекторов, превосходящий облачную версию
 */

export const EXTENDED_CONNECTORS = {
  // Облачные хранилища
  AWS_S3: {
    name: 'Amazon S3',
    type: 'cloud-storage',
    enabled: true
  },
  AZURE_BLOB: {
    name: 'Azure Blob Storage',
    type: 'cloud-storage',
    enabled: true
  },
  GOOGLE_CLOUD_STORAGE: {
    name: 'Google Cloud Storage',
    type: 'cloud-storage',
    enabled: true
  },
  
  // Базы данных
  MYSQL: {
    name: 'MySQL',
    type: 'database',
    enabled: true
  },
  MSSQL: {
    name: 'Microsoft SQL Server',
    type: 'database',
    enabled: true
  },
  ORACLE: {
    name: 'Oracle Database',
    type: 'database',
    enabled: true
  },
  MONGODB: {
    name: 'MongoDB',
    type: 'database',
    enabled: true
  },
  REDIS: {
    name: 'Redis',
    type: 'database',
    enabled: true
  },
  ELASTICSEARCH: {
    name: 'Elasticsearch',
    type: 'database',
    enabled: true
  },
  
  // API
  REST_API: {
    name: 'REST API',
    type: 'api',
    enabled: true
  },
  GRAPHQL: {
    name: 'GraphQL',
    type: 'api',
    enabled: true
  },
  SOAP: {
    name: 'SOAP',
    type: 'api',
    enabled: true
  },
  ODATA: {
    name: 'OData',
    type: 'api',
    enabled: true
  },
  
  // Специализированные
  KAFKA: {
    name: 'Apache Kafka',
    type: 'streaming',
    enabled: true
  },
  RABBITMQ: {
    name: 'RabbitMQ',
    type: 'streaming',
    enabled: true
  },
  SNOWFLAKE: {
    name: 'Snowflake',
    type: 'data-warehouse',
    enabled: true
  },
  BIGQUERY: {
    name: 'Google BigQuery',
    type: 'data-warehouse',
    enabled: true
  },
  
  // Российские системы
  POSTGRES_PRO: {
    name: 'PostgreSQL (Pro)',
    type: 'database',
    enabled: true
  },
  CLICKHOUSE_CLUSTER: {
    name: 'ClickHouse Cluster',
    type: 'database',
    enabled: true
  },
  YTSAURUS: {
    name: 'YTsaurus',
    type: 'data-warehouse',
    enabled: true
  }
};

export default EXTENDED_CONNECTORS;

