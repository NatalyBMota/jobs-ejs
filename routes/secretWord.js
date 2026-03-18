const express = require("express");
const router = express.Router();

const renderSecretWordPage = (req, res, locals = {}) => {
  if (!req.session.secretWord) {
    req.session.secretWord = "syzygy";
  }

  return res.render("secretWord", {
    secretWord: req.session.secretWord,
    ...locals,
  });
};

router.get("/", (req, res) => {
  return renderSecretWordPage(req, res);
});

router.post("/", (req, res) => {
  const nextWord = (req.body.secretWord || "").trim();

  if (!nextWord) {
    return renderSecretWordPage(req, res, {
      errors: ["Please enter a secret word."],
    });
  }

  if (/['"]/.test(nextWord)) {
    return renderSecretWordPage(req, res, {
      errors: ["The secret word cannot contain single quotes or double quotes."],
    });
  }

  if (/[^a-zA-Z \-]/.test(nextWord)) {
    return renderSecretWordPage(req, res, {
      errors: [
        "The secret word may only contain letters, spaces, and hyphens.",
      ],
    });
  }

  if (nextWord.toUpperCase()[0] === "P") {
    return renderSecretWordPage(req, res, {
      errors: [
        "That word won't work!",
        "You can't use words that start with p.",
      ],
    });
  }

  req.session.secretWord = nextWord;
  req.flash("info", "The secret word was changed.");
  return res.redirect("/secretWord");
});

module.exports = router;
