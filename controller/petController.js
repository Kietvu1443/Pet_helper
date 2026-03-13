const Pet = require("../models/Pet");
const PetImage = require("../models/PetImage");
const {
  isProduction,
  getCloudinaryId,
  ensurePetFolder,
  deleteImage,
} = require("../config/upload");
const path = require("path");
const fs = require("fs");

const petController = {
  // Hiện ra trang nhận nuôi với tất cả các pet
  getAdoptPage: async (req, res) => {
    try {
      const pets = await Pet.findAll("available");

      res.render("adopt", {
        title: "Nhận Nuôi Thú Cưng - Pet Helper",
        pets: pets,
      });
    } catch (error) {
      console.error("Error loading adopt page:", error);
      res.render("adopt", {
        title: "Nhận Nuôi Thú Cưng - Pet Helper",
        pets: [],
        error: "Không thể tải danh sách thú cưng",
      });
    }
  },

  // Hiện ra thông tin chi tiết cho pet
  getPetDetail: async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).render("error", {
          message: "Thú cưng không tồn tại",
          error: { status: 404 },
        });
      }

      // Gắp tất cả ảnh của pet từ bảng pet_images
      const images = await PetImage.findByPetId(req.params.id);

      res.render("adopt-detail", {
        title: `${pet.name} - Pet Helper`,
        pet: pet,
        images: images,
      });
    } catch (error) {
      console.error("Error loading pet detail:", error);
      res.status(500).render("error", {
        message: "Đã xảy ra lỗi",
        error: { status: 500 },
      });
    }
  },

  // Hiện ra giao diện thêm thú cưng (yêu cầu quyền cao)
  showAddPetForm: (req, res) => {
    res.render("admin/add-pet", {
      title: "Thêm Thú Cưng - Pet Helper",
      pet: null,
      error: null,
    });
  },

  // Create new pet with image upload
  createPet: async (req, res) => {
    try {
      const {
        name,
        pet_type,
        breed,
        age,
        gender,
        color,
        weight,
        pet_code,
        vaccination,
        contact_info,
        source_url,
        description,
      } = req.body;

      const newPet = await Pet.create({
        name,
        pet_type: pet_type || "Chó",
        breed: breed || null,
        age: age || null,
        gender: gender || null,
        color: color || null,
        weight: weight || null,
        pet_code: pet_code || null,
        vaccination: vaccination || null,
        contact_info: contact_info || null,
        source_url: source_url || null,
        description: description || null,
      });

      // Lưu ảnh vào bảng pet_images
      if (req.file) {
        const petId = newPet.id;
        const cloudinaryId = getCloudinaryId(req.file);

        if (isProduction) {
          // PRODUCTION: Ảnh đã nằm trên Cloudinary, chỉ cần lưu URL và public_id vào DB
          const imagePath = req.file.path;
          await PetImage.create(petId, imagePath, 0, cloudinaryId);
        } else {
          // DEVELOPMENT: Sao chép file vào thư mục pets/{petId}/
          const petDir = ensurePetFolder(petId);
          const filename = req.file.filename;
          const sourcePath = req.file.path;
          const destPath = path.join(petDir, filename);

          fs.copyFileSync(sourcePath, destPath);

          const imagePath = `/images/pets/${petId}/${filename}`;
          await PetImage.create(petId, imagePath, 0, null);
        }
      }

      res.redirect("/adopt/" + newPet.id);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.render("admin/add-pet", {
        title: "Thêm Thú Cưng - Pet Helper",
        pet: req.body,
        error: "Không thể thêm thú cưng. Vui lòng thử lại.",
      });
    }
  },

  // Hiện edit thông tin pet(yêu cầu quyền cao)
  showEditPetForm: async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).render("error", {
          message: "Không tìm thấy thú cưng",
          error: { status: 404 },
        });
      }

      // Lấy ảnh đã tồn tại
      const images = await PetImage.findByPetId(req.params.id);

      res.render("admin/add-pet", {
        title: "Sửa Thú Cưng - Pet Helper",
        pet: pet,
        images: images,
        error: null,
      });
    } catch (error) {
      console.error("Error loading edit form:", error);
      res.status(500).render("error", {
        message: "Đã xảy ra lỗi",
        error: { status: 500 },
      });
    }
  },

  // Update pet with optional new image
  updatePet: async (req, res) => {
    try {
      const petId = req.params.id;
      const oldPet = await Pet.findById(petId);

      if (!oldPet) {
        return res.status(404).render("error", {
          message: "Không tìm thấy thú cưng",
          error: { status: 404 },
        });
      }

      const {
        name,
        pet_type,
        breed,
        age,
        gender,
        color,
        weight,
        pet_code,
        vaccination,
        contact_info,
        source_url,
        description,
      } = req.body;

      // Handle avatar replacement in pet_images
      if (req.file) {
        const oldAvatar = await PetImage.findAvatarByPetId(petId);
        if (oldAvatar) {
          await deleteImage(oldAvatar.image_path, oldAvatar.cloudinary_id);
          await PetImage.delete(oldAvatar.id);
        }

        const cloudinaryId = getCloudinaryId(req.file);

        if (isProduction) {
          // PRODUCTION: Lưu URL Cloudinary vào pet_images
          await PetImage.create(petId, req.file.path, 0, cloudinaryId);
        } else {
          // DEVELOPMENT: Copy file vào thư mục pet
          const petDir = ensurePetFolder(petId);
          const filename = req.file.filename;
          const sourcePath = req.file.path;
          const destPath = path.join(petDir, filename);

          fs.copyFileSync(sourcePath, destPath);

          const imagePath = `/images/pets/${petId}/${filename}`;
          await PetImage.create(petId, imagePath, 0, null);
        }
      }

      await Pet.update(petId, {
        name,
        pet_type: pet_type || "Chó",
        breed: breed || null,
        age: age || null,
        gender: gender || null,
        color: color || null,
        weight: weight || null,
        pet_code: pet_code || null,
        vaccination: vaccination || null,
        contact_info: contact_info || null,
        source_url: source_url || null,
        description: description || null,
      });

      res.redirect("/adopt/" + petId);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.render("admin/add-pet", {
        title: "Sửa Thú Cưng - Pet Helper",
        pet: { id: req.params.id, ...req.body },
        error: "Không thể cập nhật thú cưng. Vui lòng thử lại.",
      });
    }
  },

  // Delete pet (Admin only)
  deletePet: async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (pet) {
        // Delete all images (cả Cloudinary và Local)
        const images = await PetImage.findByPetId(req.params.id);
        for (const img of images) {
          await deleteImage(img.image_path, img.cloudinary_id);
        }
        await PetImage.deleteByPetId(req.params.id);

        // Xóa thư mục pet local nếu tồn tại (chỉ Development)
        if (!isProduction) {
          const petDir = path.join(
            __dirname,
            "../public/images/pets",
            String(req.params.id),
          );
          if (fs.existsSync(petDir)) {
            fs.rmSync(petDir, { recursive: true, force: true });
          }
        }

        await Pet.delete(req.params.id);
      }

      res.redirect("/adopt");
    } catch (error) {
      console.error("Error deleting pet:", error);
      res.status(500).json({ error: "Không thể xóa thú cưng" });
    }
  },
};

module.exports = petController;
