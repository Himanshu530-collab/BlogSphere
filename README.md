
# BlogSphere 🌐

BlogSphere is a dynamic blogging platform built using **Node.js**, allowing users to sign up, log in, and manage their own blogs. With features like commenting, blog creation, editing, and deletion, this app offers a robust and interactive experience. It also incorporates user authentication with email and password, and manages sessions using cookies.

## Features 🚀

- **User Authentication**:
  - Users can sign up using their email and password.
  - Secure login and session management with cookies.

- **Blog Management**:
  - Create, edit, and delete blog posts.
  - Only the user who created a blog can edit or delete it.

- **Commenting System**:
  - Logged-in users can post comments on blog posts.
  - Comments are stored and displayed under the respective blog post.

## Tech Stack 🛠️

- **Backend:** Node.js
- **Authentication:** Email and password-based authentication with **bcrypt.js** for hashing passwords.
- **Session Management:** **cookie-parser** for handling user sessions.
- **Database:** MongoDB
- **Web Framework:** Express.js
- **Other Libraries:** bcrypt.js, body-parser, etc.

## Installation 🧑‍💻

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v14.x or higher)
- [npm](https://www.npmjs.com/) (Node Package Manager)

### Steps to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/himanshu530-collab/BlogSphere.git
   cd BlogSphere
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root of the project and add the following:
   ```
   DB_URI=<your-database-uri>
   SESSION_SECRET=<your-session-secret>
   PORT=3000
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   The application should now be running on `http://localhost:3000`.

## Usage 📱

### User Authentication

- **Sign Up**: 
  - Visit the signup page to create a new account using your email and password.
  
- **Login**:
  - Once registered, users can log in using their email and password. Cookies will be used to keep users authenticated.

### Blog Features

- **Create Blog Post**:
  - After logging in, navigate to the “Create Blog” section to add a new blog post.
  
- **Edit Blog Post**:
  - After creating a blog post, you can edit it anytime from your user dashboard.

- **Delete Blog Post**:
  - Users can delete their own blog posts at any time.

### Commenting on Blogs

- **Post Comments**:
  - Users can post comments on any blog post they like (must be logged in).
  
- **View Comments**:
  - Comments will be displayed below the corresponding blog posts.

## Technologies Used ⚙️

- **Node.js**: A JavaScript runtime to build the server-side logic.
- **Express.js**: A web framework that simplifies the routing and handling of HTTP requests.
- **MongoDB** (or specify your database): NoSQL database to store user data, blog posts, and comments.
- **bcrypt.js**: Password hashing for secure user authentication.
- **cookie-parser**: Middleware to handle cookie-based session management.

## Future Features 🌱

- **Search Functionality**: Search for blogs by keywords, tags, or categories.
- **Email Verification**: Add email verification during signup for additional security.

## Contributing 🤝

We welcome contributions! If you'd like to improve BlogSphere, feel free to open an issue or create a pull request. Here's how you can contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to your branch (`git push origin feature-branch`).
5. Open a pull request!


## Acknowledgments 💡

- **Node.js**: For providing a fast and scalable runtime environment.
- **Express.js**: For simplifying backend routing and handling.
- **bcrypt.js**: For ensuring secure password storage.
- **MongoDB**: For offering a flexible and powerful database.


