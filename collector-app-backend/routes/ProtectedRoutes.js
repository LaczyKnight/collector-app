const express = require("express");
const authorize = require("../middleware/AuthMiddleware");

const router = express.Router();

// Route only for admins
router.post("/create-user", authorize("manage_users"), (req, res) => {
    res.json({ message: "User created!" });
});

// Route for editors and admins
router.put("/edit-content", authorize("edit_content"), (req, res) => {
    res.json({ message: "Content updated!" });
});

// Route for all users
router.get("/view-content", authorize("view_content"), (req, res) => {
    res.json({ message: "Here is your content!" });
});

module.exports = router;
