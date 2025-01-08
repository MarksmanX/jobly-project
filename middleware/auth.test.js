"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError, ForbiddenError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrOwner,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
     //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("ensureAdmin", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    expect.assertions(1);
    ensureAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { 
      locals: { user: { username: "test", isAdmin: false } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    expect.assertions(3);

    ensureAdmin(req, res, next);

    // Verify that the middleware sends a 403 status code
    expect(res.status).toHaveBeenCalledWith(403);

    // Verify that the middleware sends the correct error message
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized, admin privileges required" });

    // Make sure next was not called
    expect(next).not.toHaveBeenCalled();
  });
});

describe("ensureAdminOrOwner", function () {
  test("works for admin", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    expect.assertions(1);
    ensureAdminOrOwner(req, res, next);
  });

  test("works for user trying to update their own data", function () {
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    expect.assertions(1);
    ensureAdminOrOwner(req, res, next);
  });

  test("forbidden for user trying to update another user's data", function () {
    const req = { params: { username: "otheruser" } };
    const res = { 
      locals: { user: { username: "test", isAdmin: false } },
      status: jest.fn().mockReturnThis(), 
      json: jest.fn() 
    };
    const next = jest.fn(); 
  
    expect.assertions(3); 
  
    ensureAdminOrOwner(req, res, next);
  
    // The middleware should return a 403 status code and call json() with the error message
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized, admin or the user themselves required" });
    expect(next).not.toHaveBeenCalled();
  });
  
});