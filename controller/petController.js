const Pet = require("../models/Pet");
const PetImage = require("../models/PetImage");
const PetLike = require("../models/PetLike");
const adoptionRequestService = require("../service/adoptionRequestService");
const {
  cloudinary,
  isProduction,
  getImageUrl,
  getImageUrlForPet,
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

      // Favorite & interest data
      const userId = req.user ? req.user.id : null;
      const isLiked = userId ? await PetLike.checkUserLike(userId, req.params.id) : false;
      const likesCount = await PetLike.countLikes(req.params.id);
      const pendingCount = await adoptionRequestService.countPendingRequests(req.params.id);

      res.render("adopt-detail", {
        title: `${pet.name} - Pet Helper`,
        pet: pet,
        images: images,
        isLiked: isLiked,
        likesCount: likesCount,
        pendingCount: pendingCount,
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
        image_url = getImageUrl(req.file);
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

      // Handle image update
      let image_url = oldPet.image_url;
      if (req.file) {
        // Xóa ảnh cũ (hỗ trợ cả Local và Cloudinary)
        await deleteImage(oldPet.image_url, null);

        // Lấy URL mới
        image_url = getImageUrl(req.file);
        const cloudinaryId = getCloudinaryId(req.file);

        if (isProduction) {
          // PRODUCTION: Lưu URL Cloudinary vào pet_images
          const nextOrder = await PetImage.getNextDisplayOrder(petId);
          await PetImage.create(petId, req.file.path, nextOrder, cloudinaryId);
        } else {
          // DEVELOPMENT: Copy file vào thư mục pet
          const petDir = ensurePetFolder(petId);
          const filename = req.file.filename;
          const sourcePath = req.file.path;
          const destPath = path.join(petDir, filename);

          fs.copyFileSync(sourcePath, destPath);

          const nextOrder = await PetImage.getNextDisplayOrder(petId);
          const imagePath = `/images/pets/${petId}/${filename}`;
          await PetImage.create(petId, imagePath, nextOrder, null);
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
        // Delete all images (cả Cloudinary và Local)
        const images = await PetImage.findByPetId(req.params.id);
        for (const img of images) {
          await deleteImage(img.image_path, img.cloudinary_id);
        }
        await PetImage.deleteByPetId(req.params.id);

        // Xóa ảnh đại diện cũ (legacy)
        await deleteImage(pet.image_url, null);

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

  // Like a pet (POST /adopt/:id/like)
  likePet: async (req, res) => {
    try {
      const petId = Number(req.params.id);
      if (!petId || Number.isNaN(petId)) {
        return res.status(400).json({ message: "ID thú cưng không hợp lệ" });
      }

      await PetLike.create(req.user.id, petId, "liked");
      const totalLikes = await PetLike.countLikes(petId);

      return res.status(200).json({
        success: true,
        isLiked: true,
        totalLikes: totalLikes,
      });
    } catch (error) {
      console.error("Error liking pet:", error);
      return res.status(500).json({ message: "Không thể thích thú cưng" });
    }
  },

  // Unlike a pet (DELETE /adopt/:id/like)
  unlikePet: async (req, res) => {
    try {
      const petId = Number(req.params.id);
      if (!petId || Number.isNaN(petId)) {
        return res.status(400).json({ message: "ID thú cưng không hợp lệ" });
      }

      await PetLike.delete(req.user.id, petId);
      const totalLikes = await PetLike.countLikes(petId);

      return res.status(200).json({
        success: true,
        isLiked: false,
        totalLikes: totalLikes,
      });
    } catch (error) {
      console.error("Error unliking pet:", error);
      return res.status(500).json({ message: "Không thể bỏ thích thú cưng" });
    }
  },

  // GET /favorites — User's favorite pet list
  getFavoritePets: async (req, res) => {
    try {
      const pets = await PetLike.findLikedPets(req.user.id);

      res.render("favorites", {
        title: "Thú cưng yêu thích - Pet Helper",
        pets: pets,
      });
    } catch (error) {
      console.error("Error loading favorite pets:", error);
      res.status(500).render("error", {
        message: "Đã xảy ra lỗi",
        error: { status: 500 },
      });
    }
  },

  // GET /api/favorites - Quick favorites overlay data
  getFavoritePetsApi: async (req, res) => {
    try {
      const userId = req.user && req.user.id ? Number(req.user.id) : 0;
      if (!userId || Number.isNaN(userId)) {
        return res.status(401).json({ message: "Vui lòng đăng nhập" });
      }

      const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 8));
      const rows = await PetLike.findRecentLikedPets(userId, limit);

      const data = rows.map((pet) => ({
        id: pet.id,
        name: pet.name,
        pet_type: pet.pet_type,
        status: pet.status,
        liked_at: pet.liked_at,
        image: pet.avatar_image || pet.image_url || "/images/logo.svg",
        description: pet.description
          ? String(pet.description).slice(0, 120)
          : "",
      }));

      return res.json({
        view: "recent",
        data,
        total: data.length,
        limit,
      });
    } catch (error) {
      console.error("Error loading quick favorites:", error);
      return res.status(500).json({ message: "Không thể tải danh sách yêu thích" });
    }
  },
};

module.exports = petController;
