const express = require("express");
const router = express.Router();
const petController = require("../controller/petController");
const tinderController = require("../controller/tinderController"); // New Controller
const { upload } = require("../config/upload");
const { isStaff, isAuthenticated } = require("../middleware/authMiddleware"); // Import isAuthenticated

// Staff/Admin routes (MUST be defined BEFORE /:id route)
// GET - Show add pet form
router.get("/admin/add", isStaff, petController.showAddPetForm);

// POST - Create new pet with image upload
router.post(
  "/admin/add",
  isStaff,
  upload.single("image"),
  petController.createPet,
);

// GET - Show edit pet form
router.get("/admin/edit/:id", isStaff, petController.showEditPetForm);

// POST - Update pet with optional image
router.post(
  "/admin/edit/:id",
  isStaff,
  upload.single("image"),
  petController.updatePet,
);

// POST - Delete pet
router.post("/admin/delete/:id", isStaff, petController.deletePet);

// Public routes (AFTER admin routes)
// GET - Adopt page with all pets
router.get("/", petController.getAdoptPage);

// --- NEW PETSNAP ROUTES (Must be before /:id) ---
// GET - PetSnap UI Page
router.get("/petsnap", isAuthenticated, tinderController.getTinderPage);

// API Routes for PetSnap ( AJAX )
router.get(
  "/api/petsnap/random",
  isAuthenticated,
  tinderController.getRandomPets,
);
router.post(
  "/api/petsnap/interaction",
  isAuthenticated,
  tinderController.recordInteraction,
);
router.get(
  "/api/petsnap/likes",
  isAuthenticated,
  tinderController.getLikedPets,
);
// ----------------------------------------------

// GET - Pet detail page (wildcard :id MUST be last)
router.get("/:id", petController.getPetDetail);

module.exports = router;
