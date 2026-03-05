const express = require("express");
require("express-async-errors");
require("dotenv").config();
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

// connectDB
const connectDB = require("./db/connect");

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
const url = process.env.MONGO_URI;
const store = new MongoDBStore({
  uri: url,
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
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

app.use(express.static("public"));

// Message locals for views
app.use((req, res, next) => {
  res.locals.message = req.query.message || "";
  next();
});

// Server Rendered Pages with JWT cookie auth
const jobsRouter = require("./routes/jobs");
const pageAuth = require("./middleware/auth");

app.use("/jobs", pageAuth, jobsRouter);

// Existing session-based routes
app.use("/sessions", authLimiter);
app.use("/sessions", require("./routes/sessionRoutes"));

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", pageAuth, secretWordRouter);

app.get("/", (req, res) => {
  res.render("index");
});

// Error Handler Middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start Server
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.log(error);
  }
};

start();