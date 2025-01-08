const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {
  test("generates SQL for partial updates with jsToSql mapping", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toBe('"first_name"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });

  test("generates SQL for partial updates with no jsToSql mapping", () => {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = {};

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toBe('"firstName"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });

  test("throws error when no data is provided", () => {
    const dataToUpdate = {};
    const jsToSql = {};

    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrowError(BadRequestError);
    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrowError("No data");
  });
});