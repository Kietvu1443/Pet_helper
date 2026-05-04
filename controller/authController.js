const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const authController = {
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

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: "Email này đã được đăng ký",
        });
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

  // Xử lí đăng nhập
  login: async (req, res) => {
    try {
      const { display_name, password } = req.body;

      if (!display_name || !password) {
        return res.status(400).json({
          error: "Vui lòng nhập tên đăng nhập và mật khẩu",
        });
      }

      const user = await User.findByDisplayName(display_name);
      if (!user) {
        return res.status(401).json({
          error: "Tên đăng nhập hoặc mật khẩu bị sai",
        });
      }

      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          error: "Tên đăng nhập hoặc mật khẩu bị sai",
        });
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
    res.clearCookie("token");
    res.status(200).json({ message: "Đăng xuất thành công" });
  },

  // ===== OTP: Gửi mã xác thực email =====
  sendOtp: async (req, res) => {
    try {
      const userId = req.user.id;

      // Lấy thông tin user đầy đủ từ DB
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "Không tìm thấy người dùng" });
      }

      // Nếu đã xác thực rồi thì không cần gửi OTP
      if (user.verify === 1) {
        return res.status(400).json({ error: "Email đã được xác thực" });
      }

      // 1. Check rate limit (max 3 trong 10 phút)
      const recentCount = await EmailVerification.countRecentOtps(userId, 10);
      if (recentCount >= 3) {
        return res.status(429).json({
          error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 10 phút.",
        });
      }

      // 2. Check cooldown (60 giây)
      const cooldown = await EmailVerification.checkCooldown(userId, 60);
      if (!cooldown.canSend) {
        return res.status(429).json({
          error: `Vui lòng chờ ${cooldown.waitSeconds} giây trước khi yêu cầu mã OTP mới.`,
          waitSeconds: cooldown.waitSeconds,
        });
      }

      // 3. Xóa OTP cũ của user
      await EmailVerification.deleteByUserId(userId);

      // 4. Tạo OTP 6 chữ số
      const otp = String(Math.floor(100000 + Math.random() * 900000));

      // Hết hạn sau 5 phút
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Lưu vào database
      await EmailVerification.saveOtp(userId, otp, expiresAt);

      // 5. [DEV MODE] Bỏ qua gửi email, log OTP ra console để test
      console.log("========================================");
      console.log(`📧 [DEV] OTP cho ${user.email}: ${otp}`);
      console.log("========================================");
      res
        .status(200)
        .json({ message: "Mã OTP đã được gửi tới email của bạn." });
    } catch (error) {
      console.error("Send OTP error:", error);
      res
        .status(500)
        .json({ error: "Không thể gửi mã OTP. Vui lòng thử lại." });
    }
  },

  // ===== OTP: Xác thực mã OTP =====
  verifyOtp: async (req, res) => {
    try {
      const userId = req.user.id;
      const { otp } = req.body;

      if (!otp || otp.length !== 6) {
        return res
          .status(400)
          .json({ error: "Vui lòng nhập đúng mã OTP 6 chữ số." });
      }

      // Tìm OTP hợp lệ (chưa hết hạn)
      const record = await EmailVerification.findValidOtp(userId);

      if (!record) {
        return res.status(400).json({
          error:
            "Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.",
        });
      }

      // 1. Kiểm tra brute force (max 5 lần thử)
      if (record.attempts >= 5) {
        await EmailVerification.deleteByUserId(userId);
        return res.status(429).json({
          error: "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã OTP mới.",
        });
      }

      // 2. So sánh OTP
      if (record.otp !== otp) {
        await EmailVerification.incrementAttempts(record.id);
        const remaining = 4 - record.attempts;
        return res.status(400).json({
          error: `Mã OTP không đúng. Bạn còn ${remaining > 0 ? remaining : 0} lần thử.`,
        });
      }

      // 3. OTP đúng → cập nhật verify = 1
      const isUpdated = await User.updateVerifyStatus(userId, 1);
      if (!isUpdated) {
        return res.status(500).json({
          error: "Không thể cập nhật trạng thái xác thực email.",
        });
      }

      // 4. Xóa OTP khỏi database
      await EmailVerification.deleteByUserId(userId);

      // 5. Re-issue JWT cookie với verify = 1
      const updatedUser = await User.findById(userId);
      if (!updatedUser) {
        return res.status(404).json({ error: "Không tìm thấy người dùng" });
      }

      const newToken = jwt.sign(
        {
          id: updatedUser.id,
          display_name: updatedUser.display_name,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          verify: updatedUser.verify,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
      res.cookie("token", newToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Xác thực email thành công! 🎉" });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi. Vui lòng thử lại." });
    }
  },
};

module.exports = authController;
