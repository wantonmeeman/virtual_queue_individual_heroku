const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const jsonschema = require('jsonschema');
const jsonvalidator = new jsonschema.Validator();
const app = express(); // DO NOT DELETE

const database = require('./database');

app.use(morgan('dev'));
app.use(cors());
app.use(express.json())

/**
 * =====================================================================
 * ========================== CODE STARTS HERE =========================
 * =====================================================================
 */

/**
 * ========================== SETUP APP =========================
 */

/**
 * JSON Body
 */

/**
 * ========================== RESET API =========================
 */

/**
 * Reset API
 */

/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue
 */
app.post('/company/create', function (req, res) {


    var schema = {
        "type": "object",
        "required": ["company_id", "queue_id"],
        "properties": {
            "company_id": {
                "type": "integer",
                "minLength": 10,
                "maxLength": 10,
                // "pattern": "^[\d{10}]"
            },
            "queue_id": {
                "type": "String",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^[0-9A-Za-z]*$"
            }
        }
    }

    let errorStatusMsg;
    let validateStatus = jsonvalidator.validate(req.body, schema) //JSON validation
    if (validateStatus.errors.length != 0) {
        switch (validateStatus.errors[0].property) {
            case 'instance.company_id':
                if (validateStatus.errors[0].name == 'type') {
                    errorStatusMsg = "CompanyID is not a Integer"
                } else if (validateStatus.errors[0].name == 'minLength') {
                    errorStatusMsg = "CompanyID is too short"
                } else if (validateStatus.errors[0].name == 'maxLength') {
                    errorStatusMsg = "CompanyID is too long"
                } else if (validateStatus.errors[0].name == 'required') {
                    errorStatusMsg = "CompanyID is not in the body"
                }
                break;
            case 'instance.queue_id':
                if (validateStatus.errors[0].name == 'type') {
                    errorStatusMsg = "QueueID is not a String"
                } else if (validateStatus.errors[0].name == 'minLength') {
                    errorStatusMsg = "QueueID is too short"
                } else if (validateStatus.errors[0].name == 'maxLength') {
                    errorStatusMsg = "QueueID is too long"
                } else if (validateStatus.errors[0].name == 'pattern') {
                    errorStatusMsg = "QueueID has invalid characters"
                } else if (validateStatus.errors[0].name == 'required') {
                    errorStatusMsg = "QueueID is not in the body"
                }
                break;
        }
        console.log(errorStatusMsg)
        res.status(400).send({
            error: errorStatusMsg,
            code: "INVALID_JSON_BODY"
        })
    } else {
        var companyid = req.body.company_id;
        var queueid = req.body.queue_id;
        database.CreateQueue(companyid, queueid, function(err, result) {
            if(err) {
                console.log(err);
                if(err == 422) {
                    res.status(422).send({
                        error: "Queue Id '" + queueid +"' already exists",
                        code: "QUEUE_EXISTS"
                    })
                }else{
                    res.status(500).send({
                        error: "Unable to establish connection with database",
                        code: "UNEXPECTED_ERROR"
                    })
                }
            }else {
                res.status(201).send({
                    message: "Queue Created"
                })
            }
        })
    }
})


/**
 * Company: Update Queue
 */

/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res) {//Add JSON Schema Validation

    var schema = {
        "type": "object",
        "required": [
            "company_id",
            "queue_id"
        ],
        "properties": {
            "company_id": {
                "type": "integer",
                "minLength": 10,
                "maxLength": 10/* "pattern": "^[\d{10}]"*/
            },
            "queue_id": {
                "type": "string",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^[0-9A-Za-z]*$"
            }
        }
    };

    let errorStatusMsg;

    let validateStatus = jsonvalidator.validate(req.body, schema)//JSON Validation

    if (validateStatus.errors.length != 0) {//JSON Validation Handling

        if (validateStatus.errors[0].name == 'pattern') {//Maybe use switch case for this
            errorStatusMsg = "queueID has invalid characters"
        } else if (validateStatus.errors[0].name == 'minLength') {
            errorStatusMsg = "queueID is too short!"
        } else if (validateStatus.errors[0].name == 'maxLength') {
            errorStatusMsg = "queueID is too long!"
        } else if (validateStatus.errors[0].name == 'type') {
            errorStatusMsg = "queueID is a not a String"
        } else if (validateStatus.errors[0].name == 'required') {
            errorStatusMsg = "queueID is not in the body!"
        }
        res.status(400).send({//If JSON Validation returns false
            error: errorStatusMsg,
            code: "INVALID_JSON_BODY"
        })

    } else {

        database.serverAvailable(req.body.queue_id, function (err, result) {
            if (err == '404') {//If Q doesnt Exist

                res.status(404).send({
                    error: "Queue Id " + req.body.queue_id + " Not Found",
                    code: "UNKNOWN_QUEUE"
                })

            } else if (err != null) {//If Other error

                res.status(500).send({
                    error: "Unable to establish connection with database",
                    code: "UNEXPECTED_ERROR"
                })

            } else {//If Success
                if (result.rows.length != 0) {
                    res.status(200).send(
                        result.rows[0]//This is already a JSON
                    )
                } else {
                    res.status(200).send({
                        customer_id: 0
                    })
                }

            }

        })
    }
})
/**
 * Company: Arrival Rate
 */
app.get('/company/arrival_rate', function (req, res) {//Add JSON Schema Validation
    //Should we do json validation for query strings? or just normal validation

    var schema = {
        "type": "object",
        "required": ["queue_id", "from", "duration"],
        "properties": {
            "queue_id": {
                "type": "string",
                "maxLength": 10,
                "minLength": 10,
                "pattern": '^[a-zA-Z0-9]*$'
            },
            "from": {
                "type": "date-time",
            },
            "duration": {
                "type": "integer",
                "maximum": 1440,
                "minimum": 1
            }
        }
    };

    let errorStatusMsg;

    req.query.duration = Number(req.query.duration)//Its a Query STRING. so we need to change this to int, or number if we want to have error handling

    let validateStatus = jsonvalidator.validate(req.query, schema)//JSON Validation

    if (validateStatus.errors.length != 0) {//JSON Validation Handling
        switch (validateStatus.errors[0].property) {
            case 'instance.queue_id':
                if (validateStatus.errors[0].name == 'pattern') {//Should we use switch case for this
                    errorStatusMsg = "queueID has invalid characters"
                } else if (validateStatus.errors[0].name == 'minLength') {
                    errorStatusMsg = "queueID is too short!"
                } else if (validateStatus.errors[0].name == 'maxLength') {
                    errorStatusMsg = "queueID is too long!"
                } else if (validateStatus.errors[0].name == 'required') {
                    errorStatusMsg = "queueID is not in the body!"
                } else if (validateStatus.errors[0].name == 'type') {
                    errorStatusMsg = "queueID is a not a String!"
                }
                break;//Add Case for from
            case 'instance.duration':
                if (validateStatus.errors[0].name == 'minimum') {
                    errorStatusMsg = "duration is too low!"
                } else if (validateStatus.errors[0].name == 'maximum') {
                    errorStatusMsg = "duration is too high!"
                } else if (validateStatus.errors[0].name == 'type') {
                    errorStatusMsg = "duration is not a integer!"
                }
                break;

        }
        res.status(400).send({
            error: errorStatusMsg,
            code: "INVALID_QUERY_STRING"
        })

    } else {
        //2018-11-13T20:20:39 08:00
        //will return a NaN
        //So we remove the 08:00, the GMT portion 
        //We can also replace the " " with a GMT String or something
        //Adding Z to the end makes it parseable

        req.query.from = Date.parse((req.query.from.split(' ')[0]) + 'Z') / 1000

        database.arrivalRate(
            req.query.queue_id,
            req.query.from,
            req.query.duration,
            function (err, result) {
                if (err == '404') {//If Q doesnt Exist

                    res.status(404).send({
                        error: "Queue Id " + req.body.queue_id + " Not Found",
                        code: "UNKNOWN_QUEUE"
                    })

                } else if (err != null) {//If Other error

                    res.status(500).send({
                        error: "Unable to establish connection with database",
                        code: "UNEXPECTED_ERROR"
                    })

                } else {//If Success
                    console.log("Array" + result)

                }

            })
    }
})

/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue
 */

/**
 * Customer: Check Queue
 */

/**
 * ========================== UTILS =========================
 */


/**
 * 404
 */
app.use(function (req, res, next) {//404
    console.log("UNKNOWN URL")
    res.status(404).json(
        {
            error: "Queue ID " +/*QUEUE ID*/1 + " not found.",//What do i put here lmao
            code: "UNKNOWN_QUEUE"
        }
    )
})

/**
 * Error Handler
 */

function tearDown() {
    // DO NOT DELETE
    return database.closeDatabaseConnections();
}

/**
 *  NOTE! DO NOT RUN THE APP IN THIS FILE.
 *
 *  Create a new file (e.g. server.js) which imports app from this file and run it in server.js
 */

module.exports = { app, tearDown }; // DO NOT DELETE
