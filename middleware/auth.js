"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// Middleware to check if user is an admin
function ensureAdmin(req, res, next) {
  if (res.locals.user && res.locals.user.isAdmin) {
    return next(); // User is an admin, continue to the route handler
  }
  // Not an admin, send an error or handle accordingly
  return res.status(403).json({ error: "Unauthorized, admin privileges required" });
}

function ensureAdminOrOwner(req, res, next) {
  const usernameFromParams = req.params.username;
  const loggedInUser = res.locals.user;

  // Check if the logged-in user is an admin or if they are trying to delete their own account
  if (loggedInUser.isAdmin || loggedInUser.username === usernameFromParams) {
    return next(); // Proceed if either condition is true
  }

  // If not an admin and not the same user, deny access
  return res.status(403).json({ error: "Unauthorized, admin or the user themselves required" });
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrOwner
};
