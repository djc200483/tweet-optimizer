const url = require('url');

// Parse DATABASE_URL for knex configuration
const getDbConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  const params = url.parse(process.env.DATABASE_URL);
  const auth = params.auth.split(':');

  return {
    client: 'postgresql',
    connection: {
      host: params.hostname,
      port: params.port,
      user: auth[0],
      password: auth[1],
      database: params.pathname.split('/')[1],
      ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
      }
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  };
};

module.exports = getDbConfig(); 