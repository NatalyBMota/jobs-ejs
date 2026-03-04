const express = require("express");
require("express-async-errors");
require("dotenv").config(); // to load the .env file into the process.env object

// Security packages
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')

// Session packages
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require('cookie-parser');

// Passport for sessions
const passport = require("passport");

// CSRF protection
const { csrf, getToken, refreshToken, clearToken } = require('host-csrf');

const app = express();

// Security Middleware - Global
app.set('trust proxy', 1);
app.use(
  rateLimiter({ 
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
  })
)
app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(xss())

// Session Set-up for UI Pages
const url = process.env.MONGO_URI;
const store = new MongoDBStore({
  // may throw an error, which won't be caught
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
  // app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(cookieParser(process.env.SESSION_SECRET));

// CSFR Middleware
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

// View Engine and Static Files
app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(express.static("public"));

// Server Rendered Pages with Sessions
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/jobs", (req, res) => {
  res.render("jobs")
})

app.use("/sessions", require("./routes/sessionRoutes"));

const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

// const connectDB = require('./db/connect')

// API Routes - JSON Endpoints with JWT
const authenticateUser = require('./middleware/authentication')
const authRouter = require('./routes/api/auth')
const jobsRouter = require('./routes/api/jobs')

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/jobs', authenticateUser, jobsRouter)

// Error Handler Middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

/* 
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
}); */

// Start Server
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();