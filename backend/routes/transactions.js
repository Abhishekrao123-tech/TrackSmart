console.log("transactions.js loaded");
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

/* ADD TRANSACTION */
router.post("/", verifyToken, (req, res) => {
  const { type, description, category, amount, transaction_date } = req.body;

  db.query(
    `INSERT INTO transactions
        (user_id,type,description,category,amount,transaction_date)
        VALUES (?,?,?,?,?,?)`,
    [req.user.id, type, description, category, amount, transaction_date],
    (err, result) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          message: "Failed to save transaction",
        });
      }

      res.status(201).json({
        message: "Transaction added",
      });
    },
  );
});

/* GET USER TRANSACTIONS */
router.get("/", verifyToken, (req, res) => {
  db.query(
    `SELECT *
         FROM transactions
         WHERE user_id = ?
         ORDER BY id DESC`,
    [req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
        });
      }

      res.json(results);
    },
  );
});
router.delete("/:id", verifyToken, (req, res) => {
  db.query(
    `
    DELETE FROM transactions
    WHERE id = ?
    AND user_id = ?
    `,
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Delete failed",
        });
      }

      res.json({
        message: "Deleted successfully",
      });
    },
  );
});
router.delete("/hello", (req, res) => {
  res.json({
    message: "Delete route reached",
  });
});
module.exports = router;
