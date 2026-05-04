var express = require("express");
var router = express.Router();

const fs = require('fs');
const path = require('path');

const staticPagesRoot = path.join(__dirname, "..", "public", "pages");

// GET home page
router.get("/", function (req, res) {
  res.sendFile(path.join(staticPagesRoot, "index.html"));
});

// Favorites page shell (API-first static page)
router.get("/favorites", (_req, res) => {
  res.redirect(302, "/my-favorites");
});

router.get("/my-favorites", (_req, res) => {
  res.sendFile(path.join(staticPagesRoot, "my-favorites.html"));
});

router.get("/snap", (_req, res) => {
  res.sendFile(path.join(staticPagesRoot, "snap.html"));
});

router.get("/profile", (_req, res) => {
  res.sendFile(path.join(staticPagesRoot, "profile.html"));
});

router.get("/admin", (_req, res) => {
  res.sendFile(path.join(staticPagesRoot, "admin.html"));
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
