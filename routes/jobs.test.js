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

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: 0.1,
        companyHandle: "c1",
    };

    test("ok for admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                title: "new",
                salary: 100000,
                id: expect.any(Number),
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("forbidden for non-admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`); // Use regular user token
        expect(resp.statusCode).toEqual(403); // Should be forbidden for non-admins
        expect(resp.body).toEqual({
            error: "Unauthorized, admin privileges required",
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 100000,
            })
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(400); // Should be a bad request
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: "not-a-number",
                equity: 0.1,
                companyHandle: "c1",
            })
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(400); // Should be a bad request
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1",
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 200000,
                    equity: "0.2",
                    companyHandle: "c2",
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300000,
                    equity: "0.3",
                    companyHandle: "c3",
                },
            ],
        });
        expect(resp.statusCode).toEqual(200);
    });

    test("filtering by title works", async function () {
        const resp = await request(app).get("/jobs").query({ title: "j1" });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1",
                },
            ],
        });
        expect(resp.statusCode).toEqual(200);
    });

    test("filtering by minSalary works", async function () {
        const resp = await request(app).get("/jobs").query({ minSalary: 250000 });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300000,
                    equity: "0.3",
                    companyHandle: "c3",
                },
            ],
        });
        expect(resp.statusCode).toEqual(200);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            jobs: {
                id: 1,
                title: "j1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    const updatedJobData = {
        title: "new",
    };

    test("ok for admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send(updatedJobData)
            .set("authorization", `Bearer ${adminToken}`); // Use admin tokene
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("forbidden for non-admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send(updatedJobData)
            .set("authorization", `Bearer ${u1Token}`); // Use regular user token
        expect(resp.statusCode).toEqual(403); // Should be forbidden for non-admins
        expect(resp.body).toEqual({
            error: "Unauthorized, admin privileges required",
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send(updatedJobData)
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(404); // Should be not found
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                id: 0,
            })
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(400); // Should be a bad request
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: 0,
            })
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(400); // Should be a bad request
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("ok for admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.body).toEqual({ deleted: "1" });
    });

    test("forbidden for non-admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`); // Use regular user token
        expect(resp.statusCode).toEqual(403); // Should be forbidden for non-admins
        expect(resp.body).toEqual({
            error: "Unauthorized, admin privileges required",
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`); // Use admin token
        expect(resp.statusCode).toEqual(404); // Should be not found
    });
});
