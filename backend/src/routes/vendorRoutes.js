const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("VENDOR"));

router.get("/products", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE vendor_id = ? ORDER BY id DESC", [req.user.userId]);
  return res.json(rows);
});

router.post("/products", async (req, res) => {
  const { name, description, imageUrl, price, stock } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: "name and price are required." });
  }

  const [result] = await pool.query(
    "INSERT INTO products (vendor_id, name, description, image_url, price, stock) VALUES (?, ?, ?, ?, ?, ?)",
    [req.user.userId, name, description || "", imageUrl || null, price, stock || 0]
  );
  return res.status(201).json({ message: "Product created.", productId: result.insertId });
});

router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, price, stock } = req.body;

  const [existing] = await pool.query("SELECT id FROM products WHERE id = ? AND vendor_id = ?", [
    id,
    req.user.userId,
  ]);
  if (existing.length === 0) {
    return res.status(404).json({ message: "Product not found or not owned by vendor." });
  }

  await pool.query(
    "UPDATE products SET name = ?, description = ?, image_url = ?, price = ?, stock = ? WHERE id = ? AND vendor_id = ?",
    [name, description, imageUrl || null, price, stock, id, req.user.userId]
  );
  return res.json({ message: "Product updated." });
});

router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.query("SELECT id FROM products WHERE id = ? AND vendor_id = ?", [
    id,
    req.user.userId,
  ]);
  if (existing.length === 0) {
    return res.status(404).json({ message: "Product not found or not owned by vendor." });
  }

  await pool.query("DELETE FROM products WHERE id = ? AND vendor_id = ?", [id, req.user.userId]);
  return res.json({ message: "Product deleted." });
});

router.get("/customers", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id, u.name, u.email
     FROM users u
     JOIN orders o ON o.customer_id = u.id
     JOIN order_items oi ON oi.order_id = o.id
     WHERE oi.vendor_id = ? AND u.role = 'CUSTOMER'`,
    [req.user.userId]
  );
  return res.json(rows);
});

module.exports = router;
