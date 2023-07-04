const { constants } = require("fs/promises");
const jwt = require("jsonwebtoken");
const constantNotify = require("../config/constants");

const {
  TOKEN_TIME_LIFE,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  REFRESH_TOKEN_TIME_LIFE,
} = constantNotify;
// console.log(ACCESS_TOKEN);

//make
let make = function (data) {
  return new Promise(function (resolve, reject) {
    jwt.sign(
      { data },
      ACCESS_TOKEN,
      { algorithm: "HS256", expiresIn: TOKEN_TIME_LIFE },
      function (err, _token) {
        if (err) {
          return reject(err);
        }
        return resolve(_token);
      }
    );
  });
};
//refreshToken
let refreshToken = function (data) {
  return new Promise(function (resolve, reject) {
    jwt.sign(
      { data },
      REFRESH_TOKEN,
      { algorithm: "HS256", expiresIn: REFRESH_TOKEN_TIME_LIFE },
      function (err, _refreshToken) {
        if (err) {
          return reject(err);
        }
        return resolve(_refreshToken);
      }
    );
  });
};

// check token
let checkToken = function (token) {
  return new Promise(function (resolve, reject) {
    jwt.verify(token, ACCESS_TOKEN, function (err, data) {
      if (err) {
        // console.log(err);
        return reject(err);
      }
      return resolve({ data: data });
    });
  });
};

module.exports = {
  make: make,
  refreshToken: refreshToken,
  checkToken: checkToken,
};
