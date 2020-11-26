// Group 4
// Members: Alastair Tan (p1936096), Yu Dong En (p1936348), Guan Shao Jun (p1925545)
// Class: DIT/2B/02

const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const validate = require('jsonschema').validate;
const app = express(); // DO NOT DELETE

const database = require('./database');
const { queue, log } = require('async');

app.use(morgan('dev'));
app.use(cors());
app.use(express.json())

var schemaObj = {
    arrival_rate: {
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
                //"pattern":'(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})[+-](\d{2})\:(\d{2})'
                "pattern": /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)/
            },
            "duration": {
                "type": "integer",
                "maximum": 1440,
                "minimum": 1
            }
        }
    },
    server_available: {
        "type": "object",
        "required": ["queue_id"],
        "properties": {
            "queue_id": {
                "type": "string",
                "maxLength": 10,
                "minLength": 10,
                "pattern": '^[a-zA-Z0-9]*$'
            }
        }
    },

    join_queue: {
        "type": "object",
        "required": ["customer_id", "queue_id"],
        "properties": {
            "customer_id": {
                "type": "integer",
                "minimum": 1000000000,
                "maximum": 9999999999,
                "pattern": "^[\d{10}]"
            },
            "queue_id": {
                "type": "string",
                "pattern": '^[a-zA-Z0-9]*$',
                "minLength": 10,
                "maxLength": 10
            }
        }
    },

    check_queue: {
        "type": "object",
        "required": ["queue_id"],
        "properties": {
            "customer_id": {
                "type": "integer",
                "minimum": 1000000000,
                "maximum": 9999999999,
                "pattern": "^[\d{10}]"
            },
            "queue_id": {
                "type": "string",
                "pattern": '^[a-zA-Z0-9]*$',
                "minLength": 10,
                "maxLength": 10
            }
        }
    },

    create_queue: {
        "type": "object",
        "required": ["company_id", "queue_id"],
        "properties": {
            "company_id": {
                "type": "integer",
                "minimum": 1000000000,
                "maximum": 9999999999,
                "pattern": "^[\d{10}]"
            },
            "queue_id": {
                "type": "string",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^[0-9A-Za-z]*$"
            }
        }
    },

    update_queue: {
        "type": "object",
        "required": ["queue_id"],
        "properties": {
            "queue_id": {
                "type": "string",
                "minLength": 10,
                "maxLength": 10,
                "pattern": "^[0-9A-Za-z]*$"
            },
        }
    },

    update_queue_status: {
        "type": "object",
        "required": ["status"],
        "properties": {
            "status": {
                "type": "string",
                "minLength": 8,
                "maxLength": 10,
                "pattern": "^(ACTIVATE|DEACTIVATE)$"
            }
        }
    }
}

function checkErrorMsg(validateStatus) {
    var errorName = validateStatus.errors[0].name;
    var errorArgument = validateStatus.errors[0].argument;

    switch (validateStatus.errors[0].property) {
        // COMPANY_ID
        case 'instance.company_id':
            if (errorName == 'type') {
                errorStatusMsg = "company_id is not an integer!"

            } else if (errorName == 'minimum') {
                errorStatusMsg = "company_id is too short!"

            } else if (errorName == 'maximum') {
                errorStatusMsg = "company_id is too long!"

            } else if (errorName == 'required') {
                errorStatusMsg = "company_id is not in the body!"

            }
            break;

        // CUSTOMER_ID
        case 'instance.customer_id':
            if (errorName == 'minimum') {
                errorStatusMsg = "customer_id is below 10 digits!"

            } else if (errorName == 'maximum') {
                errorStatusMsg = "customer_id is above 10 digits!"

            } else if (errorName == 'type') {
                errorStatusMsg = "customer_id is not an integer!"

            }
            break;

        // QUEUE_ID
        case 'instance.queue_id':
            if (errorName == 'type') {
                errorStatusMsg = "queue_id is not a String!"

            } else if (errorName == 'minLength') {
                errorStatusMsg = "queue_id is too short!"

            } else if (errorName == 'maxLength') {
                errorStatusMsg = "queue_id is too long!"

            } else if (errorName == 'pattern') {
                errorStatusMsg = "queue_id has invalid characters!"

            } else if (errorName == 'required') {
                errorStatusMsg = "queue_id is not in the body!"

            }
            break;

        case 'instance.status':
            if (errorName == 'type') {
                errorStatusMsg = "status is not a String!"

            } else if (errorName == 'pattern') {
                errorStatusMsg = "status might be either 'ACITVATE' OR 'DEACTIVATE'!"

            } else if (errorName == 'required') {
                errorStatusMsg = "status is not in the body!"

            }
            break;

        // DURATION
        case 'instance.duration':
            if (errorName == 'minimum') {
                errorStatusMsg = "duration is too low!"

            } else if (errorName == 'maximum') {
                errorStatusMsg = "duration is too high!"

            } else if (errorName == 'type') {
                errorStatusMsg = "duration is not a integer!"

            }
            break;

        // FROM
        case 'instance.from':
            if (errorName == 'type') {
                errorStatusMsg = "from is not in a Date-Time format!"

            } else if (errorName == 'pattern') {
                errorStatusMsg = "from is not in a correct format!"

            }
            break;

        // if a param/body key is not added
        case 'instance':
            errorStatusMsg = errorArgument + " is not present"
            break;

    }
    return errorStatusMsg;
}

/**
 * =====================================================================
 * ========================== CODE STARTS HERE =========================
 * =====================================================================
 */

/**
 * ========================== SETUP APP =========================
 * CHER SAID WE CAN IGNORE THIS
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
app.post('/reset', function (req, res) {
    database.resetTables(function (err, result) {
        if (err) {
            res.status(500).json({
                "error": "Unable to establish connection with database",
                "code": "UNEXPECTED_ERROR"
            })
        }
        else {
            res.status(200).end()
        }
    })
})



/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue
 */
app.post('/company/queue', function (req, res) {
    const company_id = req.body.company_id;
    const queue_id = req.body.queue_id;

    let schema = schemaObj.create_queue;
    let errorStatusMsg;
    let validateStatus = validate(req.body, schema);

    if (validateStatus.errors.length != 0) {
        errorStatusMsg = checkErrorMsg(validateStatus);
        //console.log(errorStatusMsg)

        res.status(400).json({
            error: errorStatusMsg,
            code: "INVALID_JSON_BODY"
        })

    } else {
        database.createQueue(company_id, queue_id, function (err, result) {
            if (err) {
                console.log(err);
                if (err == 422) {
                    res.status(422).json({
                        error: "Queue ID '" + queue_id + "' already exists",
                        code: "QUEUE_EXISTS"
                    })
                } else {
                    res.status(500).json({
                        error: "Unable to establish connection with database",
                        code: "UNEXPECTED_ERROR"
                    })
                }
            } else {
                // console.log("Queue Created")
                res.status(201).end();
            }
        })
    }
})


/**
 * Company: Update Queue
 */
app.put('/company/queue', function (req, res) {
    const queue_id = req.query.queue_id;
    const status = req.body.status;

    let status_schema = schemaObj.update_queue_status;
    let schema = schemaObj.update_queue;

    let validateStatus = validate(req.body, status_schema);     // check status if it's ACTIVATE OR DEACTIVATE
    let validateStatus1 = validate(req.query, schema);          // check queue_id

    let errorStatusMsg;

    if (validateStatus.errors.length != 0) {        // since it does not require a specific error msg, we do not need to call checkErrorMsg()
        errorStatusMsg = checkErrorMsg(validateStatus);
        res.status(400).json({
            error: errorStatusMsg,
            code: "INVALID_JSON_BODY"
        })

    } else if (validateStatus1.errors.length != 0) {
        errorStatusMsg = checkErrorMsg(validateStatus1);

        res.status(400).json({
            error: errorStatusMsg,
            code: "INVALID_QUERY_STRING"
        })


    } else {
        database.updateQueue(queue_id, status, function (error, result) {
            console.log(queue_id, status)
            if (error) {
                if (error == "404") {
                    res.status(404).json({
                        error: "Queue ID '" + queue_id + "' cannot be found!",
                        code: "UNKNOWN_QUEUE"
                    })
                } else {
                    res.status(500).json({
                        error: "Unable to establish connection with database",
                        code: "UNEXPECTED_ERROR"
                    })
                }

            } else {
                res.status(200).end()
            }
        })
    }
})


/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res) {
    const queue_id = req.body.queue_id;

    let schema = schemaObj.server_available
    let errorStatusMsg;
    let validateStatus = validate(req.body, schema);

    if (validateStatus.errors.length != 0) {
        // JSON Validation Handling
        errorStatusMsg = checkErrorMsg(validateStatus);

        res.status(400).json({ // If JSON Validation returns false
            error: errorStatusMsg,
            code: "INVALID_JSON_BODY"
        })

    } else {

        database.serverAvailable(queue_id, function (err, result) {
            if (err == '404') { // If Queue does not exist

                console.log("Queue doesnt Exist")
                res.status(404).json({
                    error: "Queue ID '" + queue_id + "' cannot be found!",
                    code: "UNKNOWN_QUEUE"
                })

            } else if (err != null) { // If other error

                res.status(500).json({
                    error: "Unable to establish connection with database",
                    code: "UNEXPECTED_ERROR"
                })

            } else { // If Success

                if (result.rows.length != 0) {
                    console.log(result.rows[0])
                    res.status(200).json({
                        customer_id: parseInt(result.rows[0].customer_id)//This is already a JSON
                    })
                } else {
                    res.status(200).json({
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
app.get('/company/arrival_rate', function (req, res) { // Add JSON Schema Validation
    let errorStatusMsg;
    const from = Date.parse(req.query.from) / 1000;//get Unix time from query
    const queue_id = req.query.queue_id;

    if (req.query.duration != undefined) {// If duration is not in the query string, dont declare the variable, therefore it is not present and will be handled by the rest of JSON schema Validation
        var duration = req.query.duration = Number(req.query.duration); // It's a query STRING, so we need to change this to INT, or Number if we want to have error handling
    }

    let schema = schemaObj.arrival_rate
    let validateStatus = validate(req.query, schema);// JSON Validation Handling
    if (validateStatus.errors.length != 0) { // JSON Validation Handling
        errorStatusMsg = checkErrorMsg(validateStatus);

        res.status(400).json({
            error: errorStatusMsg,
            code: "INVALID_QUERY_STRING"
        })

    } else {

        database.arrivalRate(queue_id, from, duration, function (err, result) {
            if (err == '404') { // If Q doesnt exist
                res.status(404).json({
                    error: "Queue ID '" + queue_id + "' cannot be found!",
                    code: "UNKNOWN_QUEUE"
                })
            } else if (err != null) {//If Other error
                res.status(500).json({
                    error: "Unable to establish connection with database",
                    code: "UNEXPECTED_ERROR"
                })
            } else { // If Success
                res.status(200).json(result)
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

app.post('/customer/queue', function (req, res) {
    const customer_id = req.body.customer_id;
    const queue_id = req.body.queue_id;

    let schema = schemaObj.join_queue;
    let errorStatusMsg;
    let validateStatus = validate(req.body, schema);

    if (validateStatus.errors.length != 0) { // JSON Validation Handling
        errorStatusMsg = checkErrorMsg(validateStatus);

        res.status(400).json({
            error: errorStatusMsg,
            code: "INVALID_JSON_BODY"
        })

    } else {
        database.joinQueue(customer_id, queue_id, function (err, result) {
            if (!err) {
                res.status(201).end()       // Successful Response

            } else if (err.code == 23503) {
                res.status(404).json({
                    error: `Queue ID '${queue_id}' cannot be found!`,
                    code: 'UNKNOWN_QUEUE'
                })

            } else if (err.code == 'ER_DUP_ENTRY') {
                res.status(422).json({
                    error: `Customer '${customer_id}' is already in queue '${queue_id}'!`,
                    code: 'ALREADY_IN_QUEUE'
                })

            } else if (err.code == 'INACTIVE_QUEUE') {
                res.status(422).json({
                    error: `Queue '${queue_id}' is inactive.`,
                    code: 'INACTIVE_QUEUE'
                })

            } else {
                res.status(500).json({
                    error: "Unable to establish connection with database",
                    code: "UNEXPECTED_ERROR"
                })
            }
        });
    }

})

/**
 * Customer: Check Queue
 */
app.get('/customer/queue', function (req, res) {
    const queue_id = req.query.queue_id;
    if (req.query.customer_id != undefined) {
        req.query.customer_id = Number(req.query.customer_id) // parse query STRING to INT
    }
    const customer_id = req.query.customer_id
    let schema = schemaObj.check_queue;
    let errorStatusMsg;
    let validateStatus = validate(req.query, schema)

    if (validateStatus.errors.length != 0) { // JSON Validation Handling
        errorStatusMsg = checkErrorMsg(validateStatus);

        res.status(400).json({
            error: errorStatusMsg,
            code: "INVALID_QUERY_STRING"
        })

    } else {
        database.checkQueue(customer_id, queue_id, function (err, result) {
            if (!err) {
                res.status(200).json(result)

            } else if (err.code = "UNKNOWN_QUEUE") {
                res.status(404).json(err)

            } else {
                console.log(err)
                res.status(500).json({
                    error: "Unable to establish connection with database",
                    code: "UNEXPECTED_ERROR"
                })

            }
        });
    }


})

/**
 * ========================== UTILS =========================
 */


/**
 * 404
 */
app.use(function (req, res, next) { // 404
    res.status(404).json(
        {
            error: "Path not found",
            code: "UNKNOWN_PATH"
        }
    )
})

/**
 * Error Handler
 */
app.use(function (err, req, res, next) {
    res.status(500).json(
        {
            error: "Unable to establish connection with database",
            code: "UNEXPECTED_ERROR"
        }
    )
})


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
