const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
// require env
require("dotenv").config();
const port = process.env.PORT;
const base_url = process.env.BASE_URL;
// import middlewares
const jwtMiddelwear = require("./app/middlewares/jwt.middleware");
// config uploads folder
app.use(express.static(path.join(__dirname, "uploads")));

// config sv non SSL
var http = require("http");
const server = http.createServer(app);

// config sv SSL
// var https = require('https');
// var fs = require('fs');
// const options = {
//     key: fs.readFileSync(`/www/server/panel/vhost/cert/app.agrios.optechdemo2.com/privkey.pem`),
//     cert: fs.readFileSync(`/www/server/panel/vhost/cert/app.agrios.optechdemo2.com/fullchain.pem`),
//     requestCert: false,
//     rejectUnauthorized: false,
// };
// const server = https.createServer(options, app);

// const io = new Server(server, {
//     cors: {
//         origin: true,
//         methods: ['GET', 'POST'],
//     },
// });

var allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); //Cấp quyền cho client được truy cập để sử dụng tài nguyên, "*" là tất cả client.
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE, OPTIONS, PATCH"
  ); // Các phương thức của client khi gọi api
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  ); //Content-Type: application/json định dạng kiểu dữ liệu json
  res.header("Access-Control-Allow-Credentials", true);
  next();
};
app.use(allowCrossDomain); // nhận biến allowCrossDomain ở trên
app.use(cors({ origin: true, credentials: true })); // origin: true cho phép client truy cập.
// body-parser config
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// cookie-parser config
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// import routes
require("./app/routes/admin.route")(app);
// app.use(jwtMiddelwear.isAuth);
require("./app/routes/role.route")(app);

server.listen(port, () => {
  console.log(`app run at ${base_url}:${port}`);
});
