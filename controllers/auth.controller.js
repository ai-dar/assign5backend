const User = require("../models/user.model.js");

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash("error_msg", "This email is already registered!");
            return res.redirect("/register");
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        req.flash("success_msg", "Registration successful! Now log in.");
        res.redirect("/login");
    } catch (err) {
        req.flash("error_msg", "Registration error.");
        res.redirect("/register");
    }
};

const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            req.flash("error_msg", "User not found!");
            return res.redirect("/login");
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash("error_msg", "Incorrect password!");
            return res.redirect("/login");
        }

        req.session.user = user;
        req.flash("success_msg", "You have successfully logged in!");
        res.redirect("/");
    } catch (err) {
        req.flash("error_msg", "Login error.");
        res.redirect("/login");
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};
