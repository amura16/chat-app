const cassandra = require('cassandra-driver');
require('dotenv').config();

const client = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_HOST || '127.0.0.1'],
  localDataCenter: process.env.CASSANDRA_DATACENTER || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'chat_app'
});

client.connect()
  .then(() => console.log('✅ Connecté avec succès à Apache Cassandra'))
  .catch(err => console.error('❌ Erreur de connexion Cassandra:', err));

module.exports = client;