const User = require("../models/user.model");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "This email is already registered" });
    }

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: "User created!", user });
  } catch (err) {
    res.status(500).json({ error: "Error creating user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); 
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error loading users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error loading user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    let updateData = { username, email };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User updated!", user });
  } catch (err) {
    res.status(500).json({ error: "Error updating user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted!" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting user" });
  }
};
