"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

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

/************************************** POST /companies */

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${adminToken}`); // Use admin token
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("forbidden for non-admin users", async function () {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${u1Token}`); // Use regular user token
    expect(resp.statusCode).toEqual(403); // Should be forbidden for non-admins
    expect(resp.body).toEqual({
      error: "Unauthorized, admin privileges required",
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        handle: "new",
        numEmployees: 10,
      })
      .set("authorization", `Bearer ${u1Token}`); // Using regular user token
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${u1Token}`); // Using regular user token
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img",
            },
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
        .get("/companies")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("filters companies by minEmployees and maxEmployees", async function () {
    const response = await request(app).get("/companies?minEmployees=100&maxEmployees=500");
    expect(response.statusCode).toBe(200);
    expect(response.body.companies.length).toBeGreaterThan(0);

    // Check that all companies meet the employee count criteria
    response.body.companies.forEach(company => {
      expect(company.numEmployees).toBeGreaterThanOrEqual(100);
      expect(company.numEmployees).toBeLessThanOrEqual(500);
    });
  });

  test("returns a 400 error when minEmployees > maxEmployees", async function () {
    const response = await request(app).get("/companies?minEmployees=500&maxEmployees=100");
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("minEmployees cannot be greater than maxEmployees");
  });
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  const updatedCompanyData = {
    name: "C1-new",
  };

  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send(updatedCompanyData)
      .set("authorization", `Bearer ${adminToken}`); // Use admin token
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("forbidden for non-admin users", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send(updatedCompanyData)
      .set("authorization", `Bearer ${u1Token}`); // Use regular user token
    expect(resp.statusCode).toEqual(403); // Should be forbidden for non-admins
    expect(resp.body).toEqual({
      error: "Unauthorized, admin privileges required",
    });
  });

  test("not found, no such company", async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Company not found
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new", // Changing handle should not be allowed
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400); // Should return a bad request error
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url", // Invalid URL
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400); // Should return a bad request error
  });
});


/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
