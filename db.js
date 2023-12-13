const { Pool } = require("pg");

console.log(process.env.db_database);

const pool = new Pool({
  user: process.env.db_username,
  database: process.env.db_database,
  password: process.env.db_password,
  port: 25060,
  host: process.env.db_host,
});

const result = pool.query("SELECT * FROM users;");

console.log(result);

module.exports = { pool };
