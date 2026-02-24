const authMiddleware = (req, res, next) => {
  if (!req.user) {
    // console.log("AUTH: About to flash error")
    req.flash("error", "You can't access that page before logon.");
    // console.log("Auth middleware flashing error - flash called");
    res.redirect("/");
  } else {
    next();
  }
};

module.exports = authMiddleware;
