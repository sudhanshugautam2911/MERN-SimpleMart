require('dotenv').config();
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


// JWT options
const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY; // TODO: it should not be in code


// EndPoint / stripe webhook
//we will capture acutall order after deploying on server

const endpointSecret = process.env.ENDPOINT_SECRET;

server.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


// middlewares

// step during build and deploy
server.use(express.static('build'))

server.use(cookieParser());

// passport
server.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);
server.use(passport.authenticate('session'));
server.use(
  cors({
    origin: '*',
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
  'local',
  new LocalStrategy({ usernameField: 'email' }, async function (
    email,
    password,
    done
  ) {
    // by default passport uses username
    console.log({ email, password });
    try {
      const user = await User.findOne({ email: email });
      console.log(email, password, user);
      if (!user) {
        return done(null, false, { message: 'invalid credentials' }); // for safety
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        'sha256',
        async function (err, hashedPassword) {
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: 'invalid credentials' });
          }
          const token = jwt.sign(
            sanitizeUser(user),
            process.env.JWT_SECRET_KEY
          );
          done(null, { id: user.id, role: user.role, token }); // this lines sends to serializer
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


// Payments


const stripe = require("stripe")('sk_test_51OAofGSHlXMzqEut0drvMDGIrdyBcnziIUn0iVaaCNqjI7zdvxe65qLWDX71T3LGQCNonjBhkHj9ZdBNM58kdVEK00Rdl8xsDp');

server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount } = req.body;
  
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount*100,
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});




// db
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Database connected");
}

// default Port
server.get("/", (req, res) => {
  res.send(`<h1> This is Homepage</h1>`);
});

//activate
server.listen(process.env.PORT, () => {
  console.log("Server started");
});
