const express = require("express");
const router = express.Router();
const authApiV1Controller = require("../../../controller/authApiV1Controller");
const { requireApiAuth } = require("../../../middleware/apiAuthV1");

router.post("/register", authApiV1Controller.register);
router.post("/login", authApiV1Controller.login);
router.post("/logout", authApiV1Controller.logout);
router.get("/me", requireApiAuth, authApiV1Controller.me);
router.patch("/profile", requireApiAuth, authApiV1Controller.updateProfile);
router.post("/avatar", requireApiAuth, authApiV1Controller.uploadAvatar);
router.post("/background", requireApiAuth, authApiV1Controller.updateBackground);

module.exports = router;
