const express = require("express");
const { refreshToken } = require("host-csrf");
const router = express.Router();

router.get("/", (req, res) => {
  if (!req.session.secretWord) {
    req.session.secretWord = "syzygy";
  }
  res.render("secretWord", { secretWord: req.session.secretWord });
});

router.post("/", (req, res) => {
  const nextWord = (req.body.secretWord || "").trim();

  if (!nextWord) {
    req.flash("error", "Please enter a secret word.");
  } else if (nextWord.toUpperCase()[0] == "P") {
    req.flash("error", "That word won't work!");
    req.flash("error", "You can't use words that start with p.");
  } else {
    req.session.secretWord = nextWord;
    req.flash("info", "The secret word was changed.");
  }

  refreshToken(req, res);
  res.redirect("/secretWord");
});

module.exports = router;
