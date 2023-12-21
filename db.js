const { Client } = require("pg");
const sessionPool = require("pg").Pool;
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const fs = require("fs");
const tools = require("./tools/tool-functions.js");

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

const sessionDBAccess = new sessionPool({
  user: process.env.db_username,
  database: process.env.db_database,
  password: process.env.db_password,
  port: 25060,
  host: process.env.db_host,
  ssl: {
    ca: fs.readFileSync("./dbssl/ca-certificate.crt"),
  },
});

const sessionConfig = {
  Store: new pgSession({
    pool: sessionDBAccess,
    tableName: "session",
  }),
  name: "SID",
  secret: tools.generateRandomString(14),
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: true,
    secure: false, // ENABLE ONLY ON HTTPS
  },
};

module.exports = { client, sessionConfig };
