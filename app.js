const express = require("express");
require("express-async-errors");

require("dotenv").config(); // to load the .env file into the process.env object
const session = require("express-session");

// extra security packages
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')

const app = express();

const MongoDBStore = require("connect-mongodb-session")(session);
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
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}
app.use(session(sessionParms));
const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.SESSION_SECRET));

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
const { csrf, getToken, refreshToken, clearToken } = require('host-csrf');

// attach the CSRF checker; every POST/PUT/DELETE/etc. will be validated
app.use(csrf());
// optional helper that ensures res.locals._csrf exists
app.use((req, res, next) => {
  if (!res.locals._csrf) {
    getToken(req, res);
  }
  next();
});

const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

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

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

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