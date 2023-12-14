require("dotenv").config();
const { User } = require("../models/User");
const crypto = require("crypto");
const { sanitizeUser, sendMail } = require("../services/common");
var jwt = require("jsonwebtoken");

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

exports.logout = async (req, res) => {
  res
    .cookie("jwt", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      // secure: true, // Uncomment this if your site is served over HTTPS
    })
    .sendStatus(200);
};

exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    // res.json(req.user);
    res.sendStatus(401);
  }
};

exports.resetPasswordRequest = async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email });

  if (user) {
    const token = crypto.randomBytes(48).toString("hex");
    user.resetPasswordToken = token;
    await user.save();

    const resetPageLink =
      "https://mern-simple-mart.onrender.com/reset-password?token=" +
      token +
      "&email=" +
      email;
    const logoUrl =
      "https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500";
    const subject = "Password Reset Link";
    const html = `
    <div style="font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <img src="${logoUrl}" alt="Logo" style="display: block; margin: 0 auto; max-width: 40%; height: auto;"/>
            <h1 style="color: #333; margin-top: 10px;">Password Reset</h1>
            <p style="color: #666;">You have requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetPageLink}" style="display: inline-block; padding: 10px 20px; background-color: #6366F1; color: #fff; text-decoration: none; border-radius: 3px; margin-top: 10px;">Reset Password</a>
            <p style="color: #666; margin-top: 10px;">If you did not request a password reset, please ignore this email.</p>
            <p style="color: #666;">Thank you for using our service.</p>
        </div>
    </div>
`;

    if (email) {
      const response = await sendMail({
        to: email,
        subject,
        html,
      });
      res.json(response);
    } else {
      console("Req body email not found");
      res.sendStatus(400);
    }
  } else {
    res.sendStatus(400);
  }
};
exports.resetPassword = async (req, res) => {
  const { email, password, token } = req.body;

  const user = await User.findOne({ email: email, resetPasswordToken: token });
  if (user) {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        user.password = hashedPassword;
        user.salt = salt;
        await user.save();
        const subject = "Attention: Simplemart Password has been changed";
        const logoUrl =
          "https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500";

        const html = `
                <div style="font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 20px auto; background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <img src="${logoUrl}" alt="Logo" style="display: block; margin: 0 auto; max-width: 40%; height: auto;"/>
                        <h1 style="color: #333; margin-top: 10px;">Password Changed</h1>
                        <p style="color: #666;">Your password has been successfully changed. If you did not initiate this change, please contact support immediately.</p>
                        <p style="color: #666;">Thank you for using our service.</p>
                    </div>
                </div>
`;
        if (email) {
          const response = await sendMail({ to: email, subject, html });
          res.json(response);
        } else {
          res.sendStatus(400);
        }
      }
    );
  } else {
    res.sendStatus(400);
  }
};
