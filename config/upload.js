const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ========== Cấu hình Cloudinary ==========
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ========== Cấu hình chung ==========
const isProduction = process.env.NODE_ENV === "production";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"), false);
  }
};

// ========== LOCAL STORAGE (Development) ==========
const baseUploadDir = path.join(__dirname, "../public/images/pets");
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Legacy storage (flat folder)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, baseUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `pet_${uniqueSuffix}${ext}`);
  },
});

// Per-pet folder storage
const localPetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const petId = req.params.id || req.petId;
    const petDir = path.join(baseUploadDir, String(petId));
    if (!fs.existsSync(petDir)) {
      fs.mkdirSync(petDir, { recursive: true });
    }
    cb(null, petDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// ========== CLOUDINARY STORAGE (Production) ==========
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "pets",
    allowed_formats: ["jpg", "png", "webp", "jpeg"],
    transformation: [{ quality: "auto" }],
  },
});

const cloudPetStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const petId = req.params.id || req.petId;
    return {
      folder: `pets/${petId}`,
      allowed_formats: ["jpg", "png", "webp", "jpeg"],
      transformation: [{ quality: "auto" }],
    };
  },
});

// ========== Tạo Multer Instances dựa theo NODE_ENV ==========
let upload, petUpload;

if (isProduction) {
  // PRODUCTION: Upload lên Cloudinary
  console.log("📷 Upload mode: CLOUDINARY (Production)");
  upload = multer({
    storage: cloudStorage,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
  petUpload = multer({
    storage: cloudPetStorage,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
} else {
  // DEVELOPMENT: Lưu xuống ổ cứng
  console.log("📷 Upload mode: LOCAL DISK (Development)");
  upload = multer({
    storage: localStorage,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
  petUpload = multer({
    storage: localPetStorage,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

// ========== Helper Functions ==========

// Lấy URL ảnh từ file đã upload (legacy flat folder)
const getImageUrl = (file) => {
  if (isProduction) {
    return file.path; // Cloudinary trả về URL đầy đủ
  }
  return `/images/pets/${file.filename}`; // Local path
};

// Lấy URL ảnh cho thư mục theo pet
const getImageUrlForPet = (file, petId) => {
  if (isProduction) {
    return file.path; // Cloudinary trả về URL đầy đủ
  }
  return `/images/pets/${petId}/${file.filename}`; // Local path
};

// Lấy cloudinary_id từ file (chỉ có khi Production)
const getCloudinaryId = (file) => {
  if (!isProduction) return null;

  // multer-storage-cloudinary thường trả public_id trong file.filename
  // Log ra để xác nhận chính xác (theo khuyến cáo)
  console.log("☁️ Cloudinary upload result - req.file:", {
    filename: file.filename,
    path: file.path,
    public_id: file.public_id,
  });

  // Ưu tiên public_id nếu có, fallback sang filename
  return file.public_id || file.filename || null;
};

// Đảm bảo thư mục pet tồn tại (chỉ dùng cho Local)
const ensurePetFolder = (petId) => {
  const petDir = path.join(baseUploadDir, String(petId));
  if (!fs.existsSync(petDir)) {
    fs.mkdirSync(petDir, { recursive: true });
  }
  return petDir;
};

// Lưu file vào thư mục pet (chỉ dùng cho Local)
const saveFileToPetFolder = (file, petId) => {
  if (isProduction) {
    // Cloudinary đã lưu sẵn, chỉ cần trả URL
    return file.path;
  }

  const petDir = ensurePetFolder(petId);
  const filename = file.filename || file.originalname;
  const sourcePath = file.path;
  const destPath = path.join(petDir, filename);

  if (sourcePath === destPath) {
    return `/images/pets/${petId}/${filename}`;
  }

  fs.renameSync(sourcePath, destPath);
  return `/images/pets/${petId}/${filename}`;
};

// Xóa ảnh (hỗ trợ cả Local và Cloudinary)
const deleteImage = async (imageUrl, cloudinaryId) => {
  // Nếu có cloudinary_id thì xóa trên Cloudinary
  if (cloudinaryId) {
    try {
      const result = await cloudinary.uploader.destroy(cloudinaryId);
      console.log("☁️ Cloudinary delete result:", result);
      return;
    } catch (error) {
      console.error("❌ Cloudinary delete error:", error);
    }
  }

  // Xóa file local (nếu là đường dẫn nội bộ)
  if (!imageUrl || imageUrl.startsWith("http")) return;

  const imagePath = path.join(__dirname, "../public", imageUrl);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

module.exports = {
  upload,
  petUpload,
  cloudinary,
  isProduction,
  getImageUrl,
  getImageUrlForPet,
  getCloudinaryId,
  ensurePetFolder,
  saveFileToPetFolder,
  deleteImage,
};
