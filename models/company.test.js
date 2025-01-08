"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let companies = await Company.findAll();
  
    expect(companies).toEqual([
      { handle: 'c1', name: 'C1', numEmployees: 100, description: 'Desc1', logoUrl: 'http://c1.img' },
      { handle: 'c2', name: 'C2', numEmployees: 200, description: 'Desc2', logoUrl: 'http://c2.img' },
      { handle: 'c3', name: 'C3', numEmployees: 300, description: 'Desc3', logoUrl: 'http://c3.img' },
    ]);
  });

  test("filters companies by name", async () => {
    // Insert test data into the database
    await db.query(`
      INSERT INTO companies (handle, name, description, num_employees, logo_url) 
      VALUES
      ('network-tech', 'Network Technologies', 'Tech company', 150, 'url'),
      ('studynet', 'Study Networks', 'Educational company', 200, 'url')
    `);

    const companies = await Company.findAll({ name: "net" });

    expect(companies).toHaveLength(2);
    expect(companies[0].name.toLowerCase()).toContain("net");
    expect(companies[1].name.toLowerCase()).toContain("net");
  });

  test("filters companies by minEmployees", async () => {
    const companies = await Company.findAll({ minEmployees: 150 });

    expect(companies).toHaveLength(2);
    expect(companies[0].numEmployees).toBeGreaterThanOrEqual(150);
  });

  test("filters companies by maxEmployees", async () => {
    const companies = await Company.findAll({ maxEmployees: 150 });
  
    expect(companies).toHaveLength(1);
    expect(companies[0].numEmployees).toBeLessThanOrEqual(150);
  });
  

  test("filters companies by both minEmployees and maxEmployees", async () => {  
    const companies = await Company.findAll({ minEmployees: 200, maxEmployees: 350 });
  
    expect(companies).toHaveLength(2);
    expect(companies[0].numEmployees).toBeGreaterThanOrEqual(200);
    expect(companies[0].numEmployees).toBeLessThanOrEqual(350);
    expect(companies[1].numEmployees).toBeGreaterThanOrEqual(200);
    expect(companies[1].numEmployees).toBeLessThanOrEqual(350);
  });
  

  test("throws error if minEmployees > maxEmployees", async () => {
    try {
      await Company.findAll({ minEmployees: 300, maxEmployees: 200 });
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.message).toBe("minEmployees cannot be greater than maxEmployees");
    }
  });  

  test("filters by name, minEmployees, and maxEmployees", async () => {
    const companies = await Company.findAll({
      name: "C",
      minEmployees: 200,
      maxEmployees: 350
    });
  
    expect(companies).toHaveLength(2);
    expect(companies[0].name).toContain("C");
    expect(companies[0].numEmployees).toBeGreaterThanOrEqual(200);
    expect(companies[0].numEmployees).toBeLessThanOrEqual(350);
    expect(companies[1].numEmployees).toBeGreaterThanOrEqual(200);
    expect(companies[1].numEmployees).toBeLessThanOrEqual(350);
  });  
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 100,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      name: "New",
      description: "New Description",
      numEmployees: 10,
      logoUrl: "http://new.img"
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      numEmployees: 10,
      logoUrl: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
