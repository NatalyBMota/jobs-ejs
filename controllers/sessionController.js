const User = require("../models/User");
const parseVErr = require("../util/parseValidationErr");
const { clearToken, refreshToken } = require("host-csrf");

const validateRegisterName = (name) => {
  try {
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return { valid: false, message: "Please provide name." };
    }

    if (trimmedName.length < 3) {
      return { valid: false, message: "Name must be at least 3 characters." };
    }

    if (trimmedName.length > 50) {
      return { valid: false, message: "Name cannot be longer than 50 characters." };
    }

    if (!/^[A-Za-z ]+$/.test(trimmedName)) {
      return { valid: false, message: "Name can contain letters and spaces only." };
    }

    return { valid: true, value: trimmedName };
  } catch (e) {
    return { valid: false, message: "Invalid name." };
  }
};

const validateRegisterEmail = (email) => {
  try {
    const trimmedEmail = typeof email === "string" ? email.trim() : "";

    if (!trimmedEmail) {
      return { valid: false, message: "Please provide email." };
    }

    if (/['"]/.test(trimmedEmail)) {
      return {
        valid: false,
        message: "Email cannot contain single quotes or double quotes.",
      };
    }

    if (!/^[A-Za-z]/.test(trimmedEmail)) {
      return { valid: false, message: "Email must start with a letter." };
    }

    return { valid: true, value: trimmedEmail.toLowerCase() };
  } catch (e) {
    return { valid: false, message: "Invalid email." };
  }
};

const validateRegisterPasswords = (password, password1) => {
  try {
    const value1 = typeof password === "string" ? password : "";
    const value2 = typeof password1 === "string" ? password1 : "";

    if (!value1 || !value2) {
      return { valid: false, message: "Please enter and confirm your password." };
    }

    if (/['"]/.test(value1) || /['"]/.test(value2)) {
      return {
        valid: false,
        message: "Password fields cannot contain single quotes or double quotes.",
      };
    }

    if (value1 != value2) {
      return { valid: false, message: "The passwords entered do not match." };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, message: "Invalid password input." };
  }
};

const registerShow = (req, res) => {
  res.render("register");
};

const registerDo = async (req, res, next) => {
  try {
    const nameCheck = validateRegisterName(req.body.name);

    if (!nameCheck.valid) {
      req.flash("error", nameCheck.message);
      return res.render("register", { errors: req.flash("error") });
    }

    req.body.name = nameCheck.value;

    const emailCheck = validateRegisterEmail(req.body.email);

    if (!emailCheck.valid) {
      req.flash("error", emailCheck.message);
      return res.render("register", { errors: req.flash("error") });
    }

    req.body.email = emailCheck.value;

    const passwordCheck = validateRegisterPasswords(
      req.body.password,
      req.body.password1
    );

    if (!passwordCheck.valid) {
      req.flash("error", passwordCheck.message);
      return res.render("register", { errors: req.flash("error") });
    }

    await User.create(req.body);
    return res.redirect("/sessions/logon");
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    } else if (e.name === "MongoServerError" && e.code === 11000) {
      req.flash("error", "That email address is already registered.");
    } else {
      return next(e);
    }

    return res.render("register", { errors: req.flash("error") });
  }
};

const logoff = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    }
    clearToken(req,res);
    res.redirect("/");
  });
};

const logonShow = (req, res) => {
  if (req.user) {
    refreshToken(req,res);
    return res.redirect("/");
  }
  res.render("logon");
};

module.exports = {
  registerShow,
  registerDo,
  logoff,
  logonShow,
};