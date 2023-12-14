const passport = require("passport");
const nodemailer = require("nodemailer");

exports.isAuth = (req, res, done) => {
  return passport.authenticate("jwt");
};

exports.sanitizeUser = (user) => {
  return { id: user.id, role: user.role };
};

exports.cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }
  // TODO: temporary for testing
  // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1NGYwNjhjYmU3NDNmNTAyMzk3NzExZiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjk5Njc3ODQ3fQ.zOdLrDq0iLK9dxWmcC05F95Rz6N6UeX4dqCfwarmckI"
  return token;
};

// Email section
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "gautamsudhanshu2911@gmail.com",
    pass: process.env.MAIL_PASSWORD,
  },
});

// Mail endpoint
exports.sendMail = async function  ({ to, subject, text, html }) {
    const info = await transporter.sendMail({
      from: '"Simple Mart" <gautamsudhanshu2911@gmail.com>', // sender address
      to,
      subject,
      text,
      html
    });
};
