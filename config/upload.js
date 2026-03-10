const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Base upload directory
const baseUploadDir = path.join(__dirname, "../public/images/pets");
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Configure storage (legacy - saves to flat /images/pets/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, baseUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `pet_${uniqueSuffix}${ext}`);
  },
});

// Per-pet folder storage - saves to /images/pets/{petId}/
const petStorage = multer.diskStorage({
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

// Legacy upload instance (flat folder)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB
  },
});

// Per-pet upload instance (per-pet folder)
const petUpload = multer({
  storage: petStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB
  },
});

// Helper function to get the URL path from uploaded file (legacy)
const getImageUrl = (filename) => {
  return `/images/pets/${filename}`;
};

// Helper function to get the URL path for per-pet folder
const getImageUrlForPet = (petId, filename) => {
  return `/images/pets/${petId}/${filename}`;
};

// Helper function to ensure pet folder exists
const ensurePetFolder = (petId) => {
  const petDir = path.join(baseUploadDir, String(petId));
  if (!fs.existsSync(petDir)) {
    fs.mkdirSync(petDir, { recursive: true });
  }
  return petDir;
};

// Helper function to save uploaded file to pet folder
const saveFileToPetFolder = (file, petId) => {
  const petDir = ensurePetFolder(petId);
  const filename = file.filename || file.originalname;
  const sourcePath = file.path;
  const destPath = path.join(petDir, filename);

  // If file is already in the right place, just return
  if (sourcePath === destPath) {
    return getImageUrlForPet(petId, filename);
  }

  // Move file from temp location to pet folder
  fs.renameSync(sourcePath, destPath);
  return getImageUrlForPet(petId, filename);
};

// Helper function to delete old image
const deleteImage = (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith("http")) return; // Skip external URLs

  const imagePath = path.join(__dirname, "../public", imageUrl);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

module.exports = {
  upload,
  petUpload,
  getImageUrl,
  getImageUrlForPet,
  ensurePetFolder,
  saveFileToPetFolder,
  deleteImage,
};
