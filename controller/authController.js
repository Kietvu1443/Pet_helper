const User = require("../models/User");

const authController = {
  // Show login/register page
  showLoginPage: (req, res) => {
    // If already logged in, redirect to home
    if (req.session && req.session.user) {
      return res.redirect("/");
    }

    res.render("auth/login", {
      title: "Đăng nhập - Pet Helper",
      error: null,
      success: null,
    });
  },

  // Handle registration
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

      // Validation
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

      if (password.length < 6) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Mật khẩu phải có ít nhất 6 ký tự",
          success: null,
          activeTab: "register",
        });
      }

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Email này đã được đăng ký",
          success: null,
          activeTab: "register",
        });
      }

      // Create user
      const newUser = await User.create({
        display_name,
        name,
        email,
        password,
        birthday: birthday || null,
        address: address || null,
      });

      // Auto login after registration
      req.session.user = {
        id: newUser.id,
        display_name: newUser.display_name,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      };

      // Redirect to return URL or home
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

  // Handle login
  login: async (req, res) => {
    try {
      const { display_name, password } = req.body;

      // Validation
      if (!display_name || !password) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Vui lòng nhập tên đăng nhập và mật khẩu",
          success: null,
          activeTab: "login",
        });
      }

      // Find user by display name
      const user = await User.findByDisplayName(display_name);
      if (!user) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Tên đăng nhập hoặc mật khẩu không đúng",
          success: null,
          activeTab: "login",
        });
      }

      // Check password
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.render("auth/login", {
          title: "Đăng nhập - Pet Helper",
          error: "Tên đăng nhập hoặc mật khẩu không đúng",
          success: null,
          activeTab: "login",
        });
      }

      // Set session
      req.session.user = {
        id: user.id,
        display_name: user.display_name,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      // Redirect to return URL or home
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

  // Handle logout
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
