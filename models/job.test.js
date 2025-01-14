"use strict";

const db = require("../db");
const Job = require("../models/job");
const { BadRequestError, NotFoundError } = require("../expressError");
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Job model", function () {
  /************************************** create */

  describe("create", function () {
    test("works", async function () {
      const newJob = {
        title: "New Job",
        salary: 60000,
        equity: "0.05",
        companyHandle: "c1",
      };

      const job = await Job.create(newJob);
      expect(job).toEqual({
        id: expect.any(Number),
        title: "New Job",
        salary: 60000,
        equity: "0.05",
        companyHandle: "c1",
      });
    });

    test("bad request with duplicate", async function () {
      try {
        await Job.create({
          title: "j1",
          salary: 100000,
          equity: "0.1",
          companyHandle: "c1",
        });
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });

  /************************************** findAll */

  describe("findAll", function () {
    test("works: no filter", async function () {
      const jobs = await Job.findAll();
      expect(jobs).toEqual([
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
      ]);
    });

    test("works: filter by minSalary", async function () {
      const jobs = await Job.findAll({ minSalary: 250000 });
      expect(jobs).toEqual([
        {
          id: expect.any(Number),
          title: "j3",
          salary: 300000,
          equity: "0.3",
          companyHandle: "c3",
        },
      ]);
    });

    test("works: filter by hasEquity", async function () {
      const jobs = await Job.findAll({ hasEquity: true });
      expect(jobs).toEqual([
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
      ]);
    });

    test("works: filter by title", async function () {
      const jobs = await Job.findAll({ title: "j1" });
      expect(jobs).toEqual([
        {
          id: expect.any(Number),
          title: "j1",
          salary: 100000,
          equity: "0.1",
          companyHandle: "c1",
        },
      ]);
    });
  });

  /************************************** get */

  describe("get", function () {
    test("works", async function () {
      const job = await Job.get(1); // assuming 1 exists after test setup
      expect(job).toEqual({
        id: 1,
        title: "j1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      });
    });

    test("not found if no such job", async function () {
      try {
        await Job.get(9999);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });

  /************************************** update */

  describe("update", function () {
    test("works", async function () {
      const updatedJob = await Job.update(1, {
        title: "Updated Title",
        salary: 120000,
      });
      expect(updatedJob).toEqual({
        id: 1,
        title: "Updated Title",
        salary: 120000,
        equity: "0.1",
        companyHandle: "c1",
      });
    });

    test("not found if no such job", async function () {
      try {
        await Job.update(9999, { title: "No Job" });
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });

    test("bad request with no data", async function () {
      try {
        await Job.update(1, {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });

  /************************************** remove */

  describe("remove", function () {
    test("works", async function () {
      await Job.remove(1);
      const res = await db.query("SELECT id FROM jobs WHERE id = 1");
      expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
      try {
        await Job.remove(9999);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
});
