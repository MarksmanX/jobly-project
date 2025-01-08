const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL `SET` clause for updating selected fields of a database record.
 * 
 * This function helps create parameterized SQL `UPDATE` queries by accepting an
 * object with fields to be updated, and a mapping of JavaScript-style keys to
 * SQL-style column names. It supports partial updates where you can only update
 * a subset of fields, rather than all columns.
 *
 * @param {Object} dataToUpdate - An object containing the fields to be updated 
 *                                as key-value pairs, where the keys are the field names 
 *                                (JavaScript-style) and the values are the new values 
 *                                to update the columns with.
 * @param {Object} jsToSql - An object mapping JavaScript-style keys to SQL-style column 
 *                           names (e.g., `{firstName: "first_name"}`).
 * @returns {Object} An object with two properties:
 *   - `setCols`: A string representing the SQL `SET` clause, e.g. '"first_name"=$1, "age"=$2'
 *   - `values`: An array of values corresponding to the placeholders in `setCols`.
 * 
 * @throws {BadRequestError} If `dataToUpdate` is empty, indicating no fields were provided to update.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
