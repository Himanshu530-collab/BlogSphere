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
      ref: "User", // Correct reference to "User" model with uppercase 'U'
      required: true, // Ensure a blog must have an author
    },
    comments: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Comment" // Add the comments field as an array of references to Comment
    }],
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

const Blog = model("Blog", blogSchema);

module.exports = Blog;
