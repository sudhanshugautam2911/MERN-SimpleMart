require("dotenv").config();
const { User } = require("../models/User");
const crypto = require("crypto");
const { sanitizeUser } = require("../services/common");
var jwt = require("jsonwebtoken");

exports.createUser = async (req, res) => {
  try {
    console.log("code ", process.env.JWT_SECRET_KEY);
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        const user = new User({ ...req.body, password: hashedPassword, salt });
        const doc = await user.save();
        if (err) {
          console.error("Error hashing password: ", err);
          return res.status(500).json({ error: "Error hashing password" });
        }
        // creatuser ke badh login session create krna taki login ho jaye
        req.login(sanitizeUser(doc), (err) => {
          // this also call serializer
          if (err) {
            res.status(400).json(err);
          } else {
            const token = jwt.sign(
              sanitizeUser(doc),
              process.env.JWT_SECRET_KEY
            );
            res
              .cookie("jwt", token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true,
              })
              .status(201)
              .json({ id: doc.id, role: doc.role });
          }
        });
      }
    );
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.loginUser = async (req, res) => {
  try {
    const user = req.user;
    res.cookie("jwt", user.token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
      // secure: true, // Uncomment this if your site is served over HTTPS
    });
    res.status(201).json({ id: user.id, role: user.role });
  } catch (err) {
    console.error("Error in loginUser: ", err);
    res.status(500).json({ error: "Error logging in user" });
  }
};

exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    // res.json(req.user);
    res.sendStatus(401);
  }
};
