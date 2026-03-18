const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, please try again later",
  };

  if (err.name === "ValidationError") {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue,
    )} field, please choose another value`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.name === "CastError") {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  if (req.accepts("html")) {
    if (typeof req.flash === "function") {
      req.flash("error", customError.msg);
    }

    if (customError.statusCode === StatusCodes.UNAUTHORIZED) {
      return res.redirect("/sessions/logon");
    }

    if (req.originalUrl.startsWith("/friendsBday")) {
      return res.redirect("/friendsBday");
    }

    if (req.originalUrl.startsWith("/secretWord")) {
      return res.redirect("/secretWord");
    }

    return res.redirect("/");
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = errorHandlerMiddleware;