const mysql = require("mysql2");
const dbconfig = require("../config/db.config");

const connection = mysql.createPool({
  host: dbconfig.HOST,
  user: dbconfig.USER,
  password: dbconfig.PASSWORD,
  database: dbconfig.DATABASE,
});
module.exports = connection;
