const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const authController = {
  // Hiện trang đăng nhập
  showLoginPage: (req, res) => {
    // Nếu đã đăng nhập (có token hợp lệ) thì về home
    if (req.user) {
      return res.redirect("/");
    }

    res.render("auth/login", {
      title: "Đăng nhập - Pet Helper",
      error: null,
      success: null,
    });
  },

  // Xử lí đăng kí (RESTful API - trả về JSON + token)
  register: async (req, res) => {
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

      // Chuẩn hoá
      if (!display_name || !name || !email || !password) {
        return res.status(400).json({
          error: "Vui lòng điền đầy đủ thông tin",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          error: "Mật khẩu xác nhận không khớp",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Mật khẩu phải có ít nhất 8 ký tự",
        });
      }

      // Kiểm tra xem đã có email tồn tại trong csdl chưa
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: "Email này đã được đăng ký",
        });
      }

      // Tạo ng dùng
      const newUser = await User.create({
        display_name,
        name,
        email,
        password,
        birthday: birthday || null,
        address: address || null,
      });

      // Tạo JWT token
      const token = jwt.sign(
        {
          id: newUser.id,
          display_name: newUser.display_name,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      // Lưu token vào cookie (httpOnly để JS không truy cập trực tiếp, bảo mật hơn)
      res.cookie("token", token, {
        httpOnly: false, // cho phép JS đọc (cần cho frontend)
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 giờ
      });

      res.status(201).json({
        message: "Đăng ký thành công",
        token: token,
        user: {
          id: newUser.id,
          display_name: newUser.display_name,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Đã xảy ra lỗi, vui lòng thử lại",
      });
    }
  },

  // Xử lí đăng nhập (RESTful API - trả về JSON + token)
  login: async (req, res) => {
    try {
      const { display_name, password } = req.body;

      // Chuẩn hoá
      if (!display_name || !password) {
        return res.status(400).json({
          error: "Vui lòng nhập tên đăng nhập và mật khẩu",
        });
      }

      // Tìm user bằng displayname
      const user = await User.findByDisplayName(display_name);
      if (!user) {
        return res.status(401).json({
          error: "Tên đăng nhập hoặc mật khẩu không đúng",
        });
      }

      // kiểm tra mật khẩu
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          error: "Tên đăng nhập hoặc mật khẩu không đúng",
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        {
          id: user.id,
          display_name: user.display_name,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      // Lưu token vào cookie
      res.cookie("token", token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Đăng nhập thành công",
        token: token,
        user: {
          id: user.id,
          display_name: user.display_name,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Đã xảy ra lỗi, vui lòng thử lại",
      });
    }
  },

  // Xử lí đăng xuất
  logout: (req, res) => {
    // Xoá cookie token
    res.clearCookie("token");
    res.status(200).json({ message: "Đăng xuất thành công" });
  },
};

module.exports = authController;
