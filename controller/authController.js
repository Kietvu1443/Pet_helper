const User = require("../models/User");

const authController = {
  // Hiện trang đăng nhập
  showLoginPage: (req, res) => {
    // Điều kiện nếu đăng nhập vào thì về home
    if (req.session && req.session.user) {
      return res.redirect("/");
    }

    res.render("auth/login", {
      title: "Đăng nhập - Pet Helper",
      error: null,
      success: null,
    });
  },

  // Xử lí đăng kí
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
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Vui lòng điền đầy đủ thông tin",
          success: null,
          activeTab: "register",
        });
      }

      if (password !== confirmPassword) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Mật khẩu xác nhận không khớp",
          success: null,
          activeTab: "register",
        });
      }

      if (password.length < 8) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Mật khẩu phải có ít nhất 8 ký tự",
          success: null,
          activeTab: "register",
        });
      }

      // Kiểm tra xem đã có email tồn tại trong csdl chưa
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Email này đã được đăng ký",
          success: null,
          activeTab: "register",
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

      // Tự đăng nhập sau khi đăng kí
      req.session.user = {
        id: newUser.id,
        display_name: newUser.display_name,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      };

      // Chuyển tiếp về url hoặc trang chủ
      const returnTo = req.session.returnTo || "/";
      delete req.session.returnTo;
      res.redirect(returnTo);
    } catch (error) {
      console.error("Registration error:", error);
      res.render("auth/login", {
        title: "Đăng nhập - Pet Helper",
        error: "Đã xảy ra lỗi, vui lòng thử lại",
        success: null,
        activeTab: "register",
      });
    }
  },

  // Xử lí đăng nhập
  login: async (req, res) => {
    try {
      const { display_name, password } = req.body;

      // Chuẩn hoá
      if (!display_name || !password) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Vui lòng nhập tên đăng nhập và mật khẩu",
          success: null,
          activeTab: "login",
        });
      }

      // Tìm user bằng displayname
      const user = await User.findByDisplayName(display_name);
      if (!user) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Tên đăng nhập hoặc mật khẩu không đúng",
          success: null,
          activeTab: "login",
        });
      }

      // kiểm tra mật khẩu
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Tên đăng nhập hoặc mật khẩu không đúng",
          success: null,
          activeTab: "login",
        });
      }

      // Điểu khiển session
      req.session.user = {
        id: user.id,
        display_name: user.display_name,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      // Chuyển về url hoặc home
      const returnTo = req.session.returnTo || "/";
      delete req.session.returnTo;
      res.redirect(returnTo);
    } catch (error) {
      console.error("Login error:", error);
      res.render("auth/login", {
        title: "Đăng nhập - Pet Helper",
        error: "Đã xảy ra lỗi, vui lòng thử lại",
        success: null,
        activeTab: "login",
      });
    }
  },

  // Xử lí đăng xuất
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  },
};

module.exports = authController;
