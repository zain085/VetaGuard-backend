const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_NAME, NODE_ENV } = require("../config/env.config");

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function setAuthCookie(res, token) {
  const isProd = NODE_ENV === "production";
  res.cookie(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd, // requires HTTPS in production (Vercel provides this)
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

function clearAuthCookie(res) {
  const isProd = NODE_ENV === "production";
  res.clearCookie(JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

module.exports = { generateToken, setAuthCookie, clearAuthCookie };
