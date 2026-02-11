const Pet = require("../models/Pet");
const { getImageUrl, deleteImage } = require("../config/upload");

const petController = {
  // Get adopt page with all available pets
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

  // Get pet detail page
  getPetDetail: async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).render("error", {
          message: "Không tìm thấy thú cưng",
          error: { status: 404 },
        });
      }

      res.render("adopt-detail", {
        title: `${pet.name} - Pet Helper`,
        pet: pet,
      });
    } catch (error) {
      console.error("Error loading pet detail:", error);
      res.status(500).render("error", {
        message: "Đã xảy ra lỗi",
        error: { status: 500 },
      });
    }
  },

  // Show add pet form (Admin only)
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

      // Get image URL from uploaded file
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

  // Show edit pet form (Admin only)
  showEditPetForm: async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.id);

      if (!pet) {
        return res.status(404).render("error", {
          message: "Không tìm thấy thú cưng",
          error: { status: 404 },
        });
      }

      res.render("admin/add-pet", {
        title: "Sửa Thú Cưng - Pet Helper",
        pet: pet,
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
        // Delete image file
        deleteImage(pet.image_url);
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
