"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for users: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "email",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: true,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {

  // Test for users retrieving their own information
  test("works for users retrieving their own info", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  // Test for admins retrieving any user's information
  test("works for admins retrieving any user's info", async function () {
    const resp = await request(app)
        .get(`/users/u1`)  // Admin should be able to get info of u1
        .set("authorization", `Bearer ${adminToken}`);  // Use admin token here
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  // Test for a user trying to retrieve another user's information (should be forbidden)
  test("forbidden for user to retrieve another user's info", async function () {
    const resp = await request(app)
        .get(`/users/u2`)  // Trying to get info of u2 as u1
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  // Test for a non-existing user (should return 404)
  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)  // No such user
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Not Found
  });
});


/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {

  // Test for a user updating their own data
  test("works for users updating their own data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  // Test for an admin updating any user's data
  test("works for admins updating any user's data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "AdminUpdated",
        })
        .set("authorization", `Bearer ${adminToken}`); // Use admin token here
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "AdminUpdated",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  // Test for when a user tries to update another user's account (should be forbidden)
  test("forbidden for user to update another user's data", async function () {
    const resp = await request(app)
        .patch(`/users/u2`)  // Trying to update u2's data as u1
        .send({
          firstName: "NotAllowed",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  // Test for a non-existing user (should return 404)
  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Not Found
  });

  // Test for invalid data (should return 400)
  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,  // Invalid data type for firstName
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400); // Bad Request
  });

  // Test for setting a new password
  test("works: set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });

    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  // Test for the user deleting their own account
  test("works for users deleting their own account", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  // Test for an admin deleting a user
  test("works for admins to delete a user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`); // Use an admin token here
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  // Test for when a user tries to delete someone else's account
  test("forbidden for user to delete another user's account", async function () {
    const resp = await request(app)
      .delete(`/users/u2`)  // Trying to delete u2's account as u1
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  // Test for non-existing user to delete
  test("not found if user missing", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)  // Trying to delete a non-existent user
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Not Found
  });
});