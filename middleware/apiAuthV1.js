const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");
const { JWT_SECRET } = require("./authMiddleware");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

const getUserFromToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const requireApiAuth = (req, res, next) => {
  const token = getTokenFromRequest(req);
  const user = getUserFromToken(token);

  if (!user) {
    return sendError(res, 401, "Vui lòng đăng nhập tài khoản");
  }

  req.user = user;
  return next();
};

const requireApiRole = (allowedRoles) => {
  return (req, res, next) => {
    const token = getTokenFromRequest(req);
    const user = req.user || getUserFromToken(token);

    if (!user) {
      return sendError(res, 401, "Vui lòng đăng nhập tài khoản");
    }

    if (!allowedRoles.includes(user.role)) {
      return sendError(res, 403, "Bạn không có quyền truy cập tài nguyên này");
    }

    req.user = user;
    return next();
  };
};

const requireApiVerified = (req, res, next) => {
  const token = getTokenFromRequest(req);
  const user = req.user || getUserFromToken(token);

  if (!user) {
    return sendError(res, 401, "Vui lòng đăng nhập tài khoản");
  }

  if (Number(user.verify) !== 1) {
    return sendError(
      res,
      403,
      "Please verify your account before creating adoption request",
    );
  }

  req.user = user;
  return next();
};

module.exports = {
  requireApiAuth,
  requireApiRole,
  requireApiVerified,
};
