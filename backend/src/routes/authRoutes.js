const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedRoles = ["ADMIN", "VENDOR", "CUSTOMER"];

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, role]
    );

    return res.status(201).json({ message: "User registered.", userId: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
});

module.exports = router;
