const PetLike = require("../models/PetLike");
const Pet = require("../models/Pet");

const tinderController = {
  // Render the Tinder-style swipe page
  getTinderPage: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect("/auth/login");
      }

      // Initial batch of pets
      console.log("[Tinder] Loading pets for user:", req.session.user.id);
      const pets = await PetLike.findRandomPets(req.session.user.id, 10);
      const likedPets = await PetLike.findLikedPets(req.session.user.id);
      console.log(
        "[Tinder] Found",
        pets.length,
        "random pets,",
        likedPets.length,
        "liked pets",
      );

      res.render("adopt-petsnap", {
        title: "PetSnap - Tìm Bạn Bốn Chân",
        pets: pets,
        likedPets: likedPets,
        user: req.session.user,
      });
    } catch (error) {
      console.error("[Tinder] Error loading tinder page:", error);
      res.render("error", {
        message: "Không thể tải trang",
        error: { status: 500 },
      });
    }
  },

  // API to get more random pets
  getRandomPets: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log(
        "[Tinder API] Fetching random pets for user:",
        req.session.user.id,
      );
      const pets = await PetLike.findRandomPets(req.session.user.id, 5);
      console.log("[Tinder API] Returning", pets.length, "pets");
      res.json(pets);
    } catch (error) {
      console.error("[Tinder API] Error fetching random pets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // API to record interaction (like/pass)
  recordInteraction: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { petId, status } = req.body; // status: 'liked' or 'passed'

      if (!petId || !["liked", "passed"].includes(status)) {
        return res.status(400).json({ error: "Invalid data" });
      }

      await PetLike.create(req.session.user.id, petId, status);

      res.json({ success: true });
    } catch (error) {
      console.error("[Tinder API] Error recording interaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // API to get liked pets
  getLikedPets: async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const likedPets = await PetLike.findLikedPets(req.session.user.id);
      res.json(likedPets);
    } catch (error) {
      console.error("[Tinder API] Error fetching liked pets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = tinderController;
