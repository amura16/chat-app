const cassandra = require('cassandra-driver');
require('dotenv').config();

const contactPoints = process.env.CASSANDRA_CONTACT_POINTS
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

const client = new cassandra.Client({
    contactPoints: contactPoints,

    localDataCenter: process.env.CASSANDRA_DATACENTER,

    credentials: {
        username: process.env.CASSANDRA_USERNAME,
        password: process.env.CASSANDRA_PASSWORD,
    },

    // Pas de SSL car Instaclustr indique :
    // Cassandra Client Encryption: Disabled
});

module.exports = client;