var express = require("express");
var router = express.Router();

const fs = require('fs');
const path = require('path');
const User = require("../models/User");
const petController = require("../controller/petController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// GET home page
router.get("/", function (req, res) {
  res.render("index", { title: "Hỗ Trợ & Bảo Vệ Vật Nuôi" });
});

// GET favorites page
router.get("/favorites", isAuthenticated, petController.getFavoritePets);

// GET quick favorites data for overlay
router.get("/api/favorites", isAuthenticated, petController.getFavoritePetsApi);

// GET profile/settings page
router.get("/profile", isAuthenticated, async function (req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.redirect("/auth/login");
    }
    res.render("setting", {
      title: "Cài đặt tài khoản - Pet Helper",
      user: user,
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).render("error", {
      message: "Đã xảy ra lỗi",
      error: { status: 500 },
    });
  }
});

// API: Lấy ảnh local đầu tiên của Pet (dùng cho Fallback khi rớt mạng)
router.get("/api/pets/:id/local-avatar", function (req, res) {
  const petId = req.params.id;
  const petDir = path.join(__dirname, "../public/images/pets", petId);
  const defaultImage = path.join(__dirname, "../public/images/logo.svg"); // hoặc default_pet.webp nếu bạn có

  try {
    if (fs.existsSync(petDir)) {
      const files = fs.readdirSync(petDir);
      // Lọc ra các file ảnh
      const imageFiles = files.filter(file => 
        file.match(/\.(jpg|jpeg|png|webp|gif)$/i)
      );

      if (imageFiles.length > 0) {
        // Trả về file ảnh đầu tiên tìm thấy
        return res.sendFile(path.join(petDir, imageFiles[0]));
      }
    }
    // Nếu thư mục không tồn tại, hoặc thư mục trống -> trả về ảnh mặc định
    return res.sendFile(defaultImage);
  } catch (error) {
    console.error("Lỗi khi đọc ảnh local fallback:", error);
    return res.sendFile(defaultImage);
  }
});

module.exports = router;
