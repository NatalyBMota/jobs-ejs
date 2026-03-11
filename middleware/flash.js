const flash = (req, res, next) => {
  if (!req.session) {
    return next();
  }

  if (!req.session.flash) {
    req.session.flash = {};
  }

  req.flash = (type, message) => {
    if (!type) {
      return [];
    }

    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }

    if (typeof message === "undefined") {
      const messages = req.session.flash[type];
      req.session.flash[type] = [];
      return messages;
    }

    const messages = req.session.flash[type];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage !== message) {
      messages.push(message);
    }

    return messages;
  };

  next();
};

module.exports = flash;