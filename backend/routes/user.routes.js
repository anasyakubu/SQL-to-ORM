const express = require("express");
const router = express.Router();
const passport = require("passport");
const { requireAuth } = require("../middleware/authMiddleware");
const { test, registerUser, getUser, listUser, updateUser, loginUser,
  verifyOTP, resendOPTVerification, getProfile, } = require("../controllers/auth.controller");

router.get("/", test);
//*********** Login, register & verification ***********//
router.post("/auth/user/register", registerUser);
router.get("/auth/user/get/:id", getUser);
router.get("/auth/user/list", listUser);
router.put("/auth/user/update/:id", updateUser);
router.post("/auth/user/login", loginUser);
router.post("/auth/verifyOPT", verifyOTP);
router.post("/auth/resendOPT", resendOPTVerification);

//*********** profile ***********//
router.get("/auth/profile", requireAuth, getProfile);

//*********** New Routes for Social Media Authentication ***********//

//*********** Redirect to Google login page ***********//
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

//*********** Google callback URL ***********//
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    //*********** Successful authentication, send token ***********//
    const token = jwt.sign(
      { email: req.user.email, userID: req.user._id },
      process.env.JWT_SECRET, { expiresIn: "10hr" });
    res.status(200).json({
      status: 200,
      message: "User logged in successfully via Google!",
      token: token, userID: req.user._id,
      name: req.user.name, email: req.user.email,
    });
  }
);

module.exports = router;
