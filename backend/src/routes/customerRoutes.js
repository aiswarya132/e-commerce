const express = require("express");
const pool = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/products", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT p.id, p.name, p.description, p.image_url, p.price, p.stock, u.name AS vendor_name FROM products p JOIN users u ON p.vendor_id = u.id"
  );
  return res.json(rows);
});

router.use(authenticate, authorize("CUSTOMER"));

router.post("/orders", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order items are required." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let totalAmount = 0;
    const productCache = [];

    for (const item of items) {
      const [rows] = await conn.query("SELECT id, vendor_id, price, stock FROM products WHERE id = ?", [item.productId]);
      if (rows.length === 0) {
        throw new Error(`Product ${item.productId} not found.`);
      }

      const product = rows[0];
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}.`);
      }

      totalAmount += Number(product.price) * Number(item.quantity);
      productCache.push({ ...product, quantity: item.quantity });
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
      [req.user.userId, totalAmount, "PLACED"]
    );
    const orderId = orderResult.insertId;

    for (const item of productCache) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.id, item.vendor_id, item.quantity, item.price]
      );
      await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.id]);
    }

    await conn.commit();
    return res.status(201).json({ message: "Order placed.", orderId });
  } catch (error) {
    await conn.rollback();
    return res.status(400).json({ message: "Order failed.", error: error.message });
  } finally {
    conn.release();
  }
});

router.get("/orders/me", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC", [req.user.userId]);
  return res.json(rows);
});

module.exports = router;
