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
      ref: "user", // Reference to the user model for the author of the blog
      required: true, // Ensure a blog must have an author
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

const Blog = model("blog", blogSchema);

module.exports = Blog;
