const jwt = require('jsonwebtoken');
const {
  accessSecret,
  refreshSecret,
  accessExpiresIn,
  refreshExpiresIn,
} = require('../config/jwt');

const signAccessToken = (payload) =>
  jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn });

const signRefreshToken = (payload) =>
  jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
