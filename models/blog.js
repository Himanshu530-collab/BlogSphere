const { Schema, model } = require("mongoose");

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    coverImageURL: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Corrected reference to "User" model with uppercase 'U'
      required: true, // Ensure a blog must have an author
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

const Blog = model("Blog", blogSchema); // You can use "Blog" with uppercase as well if desired

module.exports = Blog;
