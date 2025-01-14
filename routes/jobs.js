"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 * 
 * company should be { title, salary, equity, companyHandle }
 * 
 * Returns { title, salary, equity, companyHandle }
 * 
 * Authorization required: Admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *  { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 * 
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity (true returns only jobs with equity > 0)
 * 
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
        const { title, minSalary, hasEquity } = req.query;
        
        // Convert minSalary to a number if it's provided
        const minSalaryNum = minSalary ? Number(minSalary) : undefined;

        if (minSalary && isNaN(minSalaryNum)) {
            // Handle invalid minSalary input
            return res.status(400).json({
                error: { message: "minSalary must be a number", status: 400 },
            });
        }
        
        // Convert hasEquity to a boolean if it's provided
        const hasEquityBool = hasEquity === "true" ? true : undefined;

        const jobs = await Job.findAll({title, minSalary: minSalaryNum, hasEquity: hasEquityBool});
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /:id  =>  { job }
 * 
 * Job is { id, title, salary, equity, companyHandle }
 * 
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const jobs = await Job.get(req.params.id);

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /:id { fld1, fld2, ... } => { job }
 * 
 * Patches job data.
 * 
 * fields can be: { title, salary, equity }
 * 
 * Returns { title, salary, equity, companyHandle }
 * 
 * Authorization required: Admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const idNum = Number(req.params.id); // Convert id to a number
        const job = await Job.update(idNum, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }  
});

/** DELETE /id  =>  { deleted: handle }
 *
 * Authorization: Admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;