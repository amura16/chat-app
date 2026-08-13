const cassandra = require('cassandra-driver');
require('dotenv').config();

const client = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_HOST],
  localDataCenter: process.env.CASSANDRA_DATACENTER,
  protocolOptions: {
    port: Number(process.env.CASSANDRA_PORT)
  },
  credentials: {
    username: process.env.CASSANDRA_USERNAME,
    password: process.env.CASSANDRA_PASSWORD
  },
  sslOptions: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    await client.connect();

    console.log('✅ CONNEXION CASSANDRA RÉUSSIE');

    const result = await client.execute(
      'SELECT release_version FROM system.local'
    );

    console.log('Version Cassandra:', result.rows[0].release_version);

    await client.shutdown();

  } catch (error) {
    console.error('❌ CONNEXION ÉCHOUÉE');
    console.error(error);
  }
}

test();
