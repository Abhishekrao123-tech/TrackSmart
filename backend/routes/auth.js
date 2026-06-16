const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

/* SIGNUP */
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users(email,password) VALUES(?,?)",
      [email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(400).json({
            message: "User already exists",
          });
        }

        res.status(201).json({
          message: "Account created successfully",
        });
      },
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
const jwt = require("jsonwebtoken");

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = results[0];

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({
          message: "Invalid password",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        },
      );

      res.json({
        message: "Login successful",
        token,
      });
    },
  );
});
