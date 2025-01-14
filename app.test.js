const request = require("supertest");

const app = require("./app");
const db = require("./db");
const {
  commonBeforeEach,
  commonBeforeAll,
  commonAfterAll,
  commonAfterEach,
} = require("./routes/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach); 
afterEach(commonAfterEach);   
afterAll(commonAfterAll);

test("not found for site 404", async function () {
  const resp = await request(app).get("/no-such-path");
  expect(resp.statusCode).toEqual(404);
});

test("not found for site 404 (test stack print)", async function () {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test"; // Mock NODE_ENV to 'test' during this test

  const resp = await request(app).get("/no-such-path");
  expect(resp.statusCode).toEqual(404);

  // Restore the original NODE_ENV
  process.env.NODE_ENV = originalNodeEnv;

  // Reset the modules to ensure no lingering state
  jest.resetModules();
});
