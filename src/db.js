const { Client } = require("pg");
const fs = require("fs");

console.log(process.env.db_database);

const client = new Client({
  user: process.env.db_username,
  database: process.env.db_database,
  password: process.env.db_password,
  port: 25060,
  host: process.env.db_host,
  ssl: {
    ca: fs.readFileSync("./dbssl/ca-certificate.crt"),
  },
});

client.connect(function (err) {
  if (err) throw err;
  console.log(`Connected to database at ${process.env.db_host}`);
});

module.exports = { client };
