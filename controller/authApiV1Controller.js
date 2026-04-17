const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const authApiV1Controller = {
  async register(req, res) {
    try {
      const {
        display_name,
        name,
        email,
        password,
        confirmPassword,
        birthday,
        address,
      } = req.body;

      if (!display_name || !name || !email || !password) {
        return sendError(res, 400, "Vui lòng điền đầy đủ thông tin");
      }

      if (password !== confirmPassword) {
        return sendError(res, 400, "Mật khẩu xác nhận không khớp");
      }

      if (password.length < 8) {
        return sendError(res, 400, "Mật khẩu phải có ít nhất 8 ký tự");
      }

      const [existingEmail, existingDisplayName] = await Promise.all([
        User.findByEmail(email),
        User.findByDisplayName(display_name),
      ]);

      if (existingEmail) {
        return sendError(res, 409, "Email này đã được đăng ký");
      }

      if (existingDisplayName) {
        return sendError(res, 409, "Tên đăng nhập này đã được sử dụng");
      }

      const newUser = await User.create({
        display_name,
        name,
        email,
        password,
        birthday: birthday || null,
        address: address || null,
      });

      const token = jwt.sign(
        {
          id: newUser.id,
          display_name: newUser.display_name,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          verify: 0,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.cookie("token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, 201, "Đăng ký thành công", {
        token,
        user: {
          id: newUser.id,
          display_name: newUser.display_name,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          verify: 0,
        },
      });
    } catch (error) {
      if (error && error.code === "ER_DUP_ENTRY") {
        return sendError(res, 409, "Thông tin tài khoản đã tồn tại");
      }

      console.error("[Auth API v1] register error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi, vui lòng thử lại");
    }
  },

  async login(req, res) {
    try {
      const { display_name, password } = req.body;

      if (!display_name || !password) {
        return sendError(res, 400, "Vui lòng nhập tên đăng nhập và mật khẩu");
      }

      const user = await User.findByDisplayName(display_name);
      if (!user) {
        return sendError(res, 401, "Tên đăng nhập hoặc mật khẩu bị sai");
      }

      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return sendError(res, 401, "Tên đăng nhập hoặc mật khẩu bị sai");
      }

      const token = jwt.sign(
        {
          id: user.id,
          display_name: user.display_name,
          name: user.name,
          email: user.email,
          role: user.role,
          verify: user.verify || 0,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.cookie("token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return sendSuccess(res, 200, "Đăng nhập thành công", {
        token,
        user: {
          id: user.id,
          display_name: user.display_name,
          name: user.name,
          email: user.email,
          role: user.role,
          verify: user.verify || 0,
        },
      });
    } catch (error) {
      console.error("[Auth API v1] login error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi, vui lòng thử lại");
    }
  },

  async me(req, res) {
    try {
      if (!req.user) {
        return sendError(res, 401, "Vui lòng đăng nhập tài khoản");
      }

      return sendSuccess(res, 200, "Lấy thông tin người dùng thành công", {
        user: {
          id: req.user.id,
          display_name: req.user.display_name,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          verify: req.user.verify || 0,
        },
      });
    } catch (error) {
      console.error("[Auth API v1] me error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi, vui lòng thử lại");
    }
  },

  async logout(req, res) {
    try {
      res.clearCookie("token");
      return sendSuccess(res, 200, "Đăng xuất thành công");
    } catch (error) {
      console.error("[Auth API v1] logout error:", error);
      return sendError(res, 500, "Đã xảy ra lỗi, vui lòng thử lại");
    }
  },
};

module.exports = authApiV1Controller;
