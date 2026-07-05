const { Router } = require("express");
const User = require("../models/user");
const authenticate = require("../middlewares/authenticate");

const {
  createTokenForUser,
  validateToken,
} = require("../services/authentication");

const router = Router();

const cookieParser = require("cookie-parser");
router.use(cookieParser());

// 🔥 Cloudinary setup
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Middleware to check authentication
const checkAuthenticated = (req, res, next) => {
  const token = req.cookies.authToken;

  if (token) {
    try {
      const decodedUser = validateToken(token);
      req.user = decodedUser;
      return next();
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  }

  req.user = null;
  next();
};

router.use(checkAuthenticated);

/* =========================
   AUTH PAGES
========================= */

router.get("/signin", (req, res) => {
  return res.render("signin", { user: req.user });
});

router.get("/signup", (req, res) => {
  return res.render("signup", { user: req.user });
});

/* =========================
   SIGNIN
========================= */

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("signin", {
        errorMessage: "Invalid email or password",
        user: req.user,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.render("signin", {
        errorMessage: "Invalid email or password",
        user: req.user,
      });
    }

    const token = createTokenForUser(user);

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "strict",
    });

    return res.redirect("/");
  } catch (error) {
    console.error("Error during signin:", error);
    return res.status(500).send("Something went wrong");
  }
});

/* =========================
   SIGNUP
========================= */

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send("Email already in use");
    }

    const newUser = await User.create({
      fullName,
      email,
      password,
    });

    const token = createTokenForUser(newUser);

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "strict",
    });

    return res.redirect("/");
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).send("Error creating user");
  }
});

/* =========================
   LOGOUT
========================= */

router.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.redirect("/");
});

/* =========================
   CLOUDINARY MULTER SETUP
========================= */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 300, height: 300, crop: "limit" }],
  },
});

const upload = multer({ storage });

/* =========================
   UPDATE PROFILE IMAGE (CLOUDINARY)
========================= */

router.post(
  "/update-profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    try {
      await User.findByIdAndUpdate(req.user._id, {
        profileImageURL: req.file.path, // 🔥 Cloudinary URL
      });

      return res.redirect("/user/profile");
    } catch (error) {
      console.error("Error updating profile image:", error);
      return res.status(500).send("Server error");
    }
  }
);

/* =========================
   PROFILE PAGE
========================= */

router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("profile", { user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("Error fetching profile.");
  }
});

module.exports = router;