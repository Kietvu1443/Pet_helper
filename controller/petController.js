const Pet = require("../models/Pet");
const PetImage = require("../models/PetImage");
const {
  upload,
  getImageUrl,
  getImageUrlForPet,
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

      // Lấy url ảnh từ lúc upload 
      let image_url = null;
      if (req.file) {
        image_url = getImageUrl(req.file.filename);
      }

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
        image_url,
        contact_info: contact_info || null,
        source_url: source_url || null,
        description: description || null,
      });

      // nếu ảnh đã được lưu thì cũng sẽ được tạo path trong pet_images và lưu ảnh vật lí trong pets_images
      if (req.file) {
        const petId = newPet.id;
        const petDir = ensurePetFolder(petId);
        const filename = req.file.filename;
        const sourcePath = req.file.path;
        const destPath = path.join(petDir, filename);

        // Sao chép file vào thư mục pets
        fs.copyFileSync(sourcePath, destPath);

        // Tạo pet_images ghi chú với display_order = 0 (ảnh đại diện)
        const imagePath = getImageUrlForPet(petId, filename);
        await PetImage.create(petId, imagePath, 0);
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

      // Handle image update
      let image_url = oldPet.image_url;
      if (req.file) {
        // Delete old image if it's a local file
        deleteImage(oldPet.image_url);
        image_url = getImageUrl(req.file.filename);

        // Also save to per-pet folder and create pet_images record
        const petDir = ensurePetFolder(petId);
        const filename = req.file.filename;
        const sourcePath = req.file.path;
        const destPath = path.join(petDir, filename);

        // Copy file to pet folder
        fs.copyFileSync(sourcePath, destPath);

        // Get next display_order
        const nextOrder = await PetImage.getNextDisplayOrder(petId);
        const imagePath = getImageUrlForPet(petId, filename);
        await PetImage.create(petId, imagePath, nextOrder);
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
        image_url,
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
        // Delete all images from pet_images table
        const images = await PetImage.findByPetId(req.params.id);
        for (const img of images) {
          deleteImage(img.image_path);
        }
        await PetImage.deleteByPetId(req.params.id);

        // Delete legacy image
        deleteImage(pet.image_url);

        // Delete pet folder if exists
        const petDir = path.join(
          __dirname,
          "../public/images/pets",
          String(req.params.id),
        );
        if (fs.existsSync(petDir)) {
          fs.rmSync(petDir, { recursive: true, force: true });
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
