const express = require("express");
require("express-async-errors");
require("dotenv").config({ quiet: true });

if (process.env.NODE_ENV !== "production") {
  process.env.XS_COOKIE_DEVELOPMENT_MODE = "true";
}
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required");
}

const path = require("path");
const cookieParser = require("cookie-parser");

// Security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

// Session packages
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

// Passport for sessions
const passport = require("passport");

// CSRF protection
const { csrf, getToken } = require("host-csrf");

const app = express();
app.disable("x-powered-by");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1);

// Security Middleware - Global
/* app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  })
); */
const globalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { msg: "Too many requests, please try again later." },
});

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { msg: "Too many authentication attempts, please try again later." },
});

app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET));
// app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
  })
);
app.use(cors());
app.use(xss());

// Session Set-up for UI Pages
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  uri: mongoURL,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  sessionParms.cookie.secure = true;
}

app.use(session(sessionParms));

// CSRF Middleware
app.use(csrf());
app.use((req, res, next) => {
  if (!res.locals._csrf) {
    getToken(req, res);
  }
  next();
});

// Passport set-up for sessions
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());
app.use(require("./middleware/flash"));
app.use(require("./middleware/storeLocals"));

app.use(express.static("public"));

// Message locals for views
app.use((req, res, next) => {
  res.locals.message = req.query.message || "";
  next();
});

// Server Rendered Pages with JWT cookie auth
const friendsBdaysRouter = require("./routes/friendsBdays");
const pageAuth = require("./middleware/auth");

app.use("/friendsBday", pageAuth, friendsBdaysRouter);

// Existing session-based routes
app.use("/sessions", authLimiter);
app.use("/sessions", require("./routes/sessionRoutes"));

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", pageAuth, secretWordRouter);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

// Error Handler Middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start Server
const port = process.env.PORT || 3000;
/* const start = async () => {
  try {
    const connectDB = require("./db/connect");
    await connectDB(process.env.MONGO_URI);
    const server = app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use.`);
        return;
      }
      console.log(error);
    });
    return server;
  } catch (error) {
    console.log(error);
  }
}; */

const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };