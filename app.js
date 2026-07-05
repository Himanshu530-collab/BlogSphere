require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Blog = require("./models/blog");
const { validateToken } = require("./services/authentication");

const userRoute = require("./routes/user");
const commentRoute = require("./routes/comment");
const blogRoute = require("./routes/blog");

const app = express();
const port = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= VIEW ENGINE =================
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// ================= DB CONNECTION FUNCTION =================
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI2);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
}

// ================= GLOBAL BLOG FETCH HELPER =================
async function getBlogs() {
    try {
        return await Blog.find().sort({ createdAt: -1 });
    } catch (err) {
        console.error("❌ Error fetching blogs:", err);
        return [];
    }
}

// ================= HOME ROUTE =================
app.get("/", async (req, res) => {
    try {
        const token = req.cookies.authToken;
        let user = null;

        if (token) {
            const decoded = validateToken(token);

            if (decoded) {
                user = decoded;
            } else {
                res.clearCookie("authToken");
            }
        }

        const blogs = await getBlogs();
        return res.render("home", { user, blogs });

    } catch (error) {
        console.error("❌ Home route error:", error);
        return res.render("home", { user: null, blogs: [] });
    }
});

// ================= ROUTES =================
app.use("/user", userRoute);
app.use("/comments", commentRoute);
app.use("/blog", blogRoute);

// ================= START SERVER =================
async function startServer() {
    await connectDB();

    app.listen(port, () => {
        console.log(`🚀 Server running at http://localhost:${port}`);
    });
}

startServer();