const path = require("path");
const express = require("express");
const mongoose=require("mongoose");

const app = express();
const port = 3000;

mongoose.connect("mongodb://localhost:27017/blogify")
.then(e=>console.log("MongoDB Connected"))
const userRoute=require('./routes/user');
// Set up the view engine to use EJS
app.set("view engine", "ejs");

// Set the directory for views
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: true }));  // Middleware for parsing URL-encoded form data
app.use(express.json());  // Middleware for parsing JSON bodies


// Home route
app.get("/", (req, res) => {
    res.render("home");  // Renders the 'home.ejs' file
});
app.use('/user',userRoute);

// Start the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
