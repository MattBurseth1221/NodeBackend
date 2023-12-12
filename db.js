const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.db_username,
  database: process.env.db_database,
  password: process.env.db_password,
  port: 25060,
  host: process.env.db_host,
});

module.exports = { pool };
