const express = require("express");
const server = express();
const mongoose = require("mongoose");
const cors = require("cors");
// cors help to call from one port to another
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
var jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const productRouters = require("./routes/Product");
const brandRouters = require("./routes/Brand");
const categoryRouters = require("./routes/Category");
const usersRouters = require("./routes/Users");
const authRouters = require("./routes/Auth");
const cartRouters = require("./routes/Cart");
const ordersRouters = require("./routes/Order");
const { User } = require("./models/User");
const crypto = require("crypto");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");

const SECRET_KEY = "SECRET_KEY";  
// JWT options
const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = SECRET_KEY; // TODO: it should not be in code

// middlewares

// step during build and deploy
server.use(express.static('build'))

server.use(cookieParser());

// passport
server.use(
  session({
    secret: "keyboard cat",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);
server.use(passport.authenticate('session'));
server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);

server.use(express.json());
server.use("/products", isAuth(), productRouters.router); // we can also use JWT Token
server.use("/brands", brandRouters.router);
server.use("/categories", categoryRouters.router);
server.use("/users", usersRouters.router);
server.use("/auth", authRouters.router);
server.use("/cart", cartRouters.router);
server.use("/orders", ordersRouters.router);

// passport strategies
passport.use(
  "local",
  new LocalStrategy(
    {usernameField: 'email'},
    async function (email, password, done) {
    try {
      const user = await User.findOne({ email: email }) ;
      if (!user) {
        return done(null, false, { message: "No User with this email found" });
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: "Invalid Credentials !" });
          }
          const token = jwt.sign(sanitizeUser(user), SECRET_KEY);

          done(null, { id: user.id, role: user.role, token }); // this line sends to serializer
        }
      );
    } catch (err) {
      done(err);
    }
  })
);

// JWT strategies
passport.use(
  'jwt',
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, sanitizeUser(user)); // this calls serializer
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

// this creates session variable req.user on being called from callbacks
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

// this changes session variable req.user when called from authorized request

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// db
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");
  console.log("Database connected");
}

// default Port
server.get("/", (req, res) => {
  res.send(`<h1> This is Homepage</h1>`);
});

//activate
server.listen(8080, () => {
  console.log("Server started");
});
