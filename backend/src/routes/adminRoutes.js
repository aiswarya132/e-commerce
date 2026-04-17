const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", async (_req, res) => {
  const [rows] = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC");
  return res.json(rows);
});

router.get("/vendors", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE role = 'VENDOR' ORDER BY id DESC"
  );
  return res.json(rows);
});

router.get("/customers", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE role = 'CUSTOMER' ORDER BY id DESC"
  );
  return res.json(rows);
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return res.json({ message: "User deleted." });
});

router.get("/products", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT p.*, u.name AS vendor_name FROM products p JOIN users u ON p.vendor_id = u.id ORDER BY p.id DESC"
  );
  return res.json(rows);
});

router.post("/products", async (req, res) => {
  const { vendorId, name, description, imageUrl, price, stock } = req.body;
  if (!vendorId || !name || !price) {
    return res.status(400).json({ message: "vendorId, name, and price are required." });
  }

  const [vendorRows] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'VENDOR'", [vendorId]);
  if (vendorRows.length === 0) {
    return res.status(400).json({ message: "Invalid vendorId. Must belong to a vendor." });
  }

  const [result] = await pool.query(
    "INSERT INTO products (vendor_id, name, description, image_url, price, stock) VALUES (?, ?, ?, ?, ?, ?)",
    [vendorId, name, description || "", imageUrl || null, price, stock || 0]
  );
  return res.status(201).json({ message: "Product created.", productId: result.insertId });
});

router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { vendorId, name, description, imageUrl, price, stock } = req.body;

  if (!vendorId || !name || !price) {
    return res.status(400).json({ message: "vendorId, name, and price are required." });
  }

  await pool.query(
    "UPDATE products SET vendor_id = ?, name = ?, description = ?, image_url = ?, price = ?, stock = ? WHERE id = ?",
    [vendorId, name, description || "", imageUrl || null, price, stock || 0, id]
  );
  return res.json({ message: "Product updated." });
});

router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM products WHERE id = ?", [id]);
  return res.json({ message: "Product deleted." });
});

module.exports = router;
