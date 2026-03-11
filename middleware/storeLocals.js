const storeLocals = (req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }

  // Load flash messages only when a view is actually rendered.
  // This prevents unrelated requests from consuming messages early.
  const originalRender = res.render.bind(res);
  res.render = (view, locals, callback) => {
    res.locals.info = req.flash("info");
    res.locals.errors = req.flash("error");
    return originalRender(view, locals, callback);
  };

  next();
};

module.exports = storeLocals;