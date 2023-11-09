const { User } = require("../models/User");
const crypto = require("crypto");
const { sanitizeUser } = require("../services/common");
const SECRET_KEY = 'SECRET_KEY';
var jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
  try {
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

        // creatuser ke badh login session create krna taki login ho jaye
        req.login(sanitizeUser(doc), (err) => {
          // this also call serializer
          if (err) {
              res.status(400).json(err);
          } else {
              const token = jwt.sign(sanitizeUser(doc), SECRET_KEY);
              res.status(201).json(token);
          }
        });
      }
    );
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

exports.loginUser = async (req, res) => {
  res.json(req.user);
};

exports.checkUser = async (req, res) => {
  res.json({status:'success',user: req.user});
};
