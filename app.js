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
    }
}
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

/**
 * Company: Update Queue
 */

/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res) {//Add JSON Schema Validation

    let schema = schemaObj.server_available

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

    let schema = schemaObj.arrival_rate

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
                break;
            case 'instance.queue_id':
                if (validateStatus.errors[0].name == 'type') {
                    errorStatusMsg = "queueID is not in a Date-time format!"
                }
                break;
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
        // console.log(req.query.from.replace(/ /g,''))
        // Ask about + Value
        //%2B
        req.query.from = Date.parse(req.query.from) / 1000;
        database.arrivalRate(
            req.query.queue_id,
            req.query.from,
            req.query.duration,
            function (err, result) {
                if (err == '404') {//If Q doesnt Exist

                    res.status(404).send({
                        error: "Queue Id " + req.query.queue_id + " Not Found",
                        code: "UNKNOWN_QUEUE"
                    })

                } else if (err != null) {//If Other error

                    res.status(500).send({
                        error: "Unable to establish connection with database",
                        code: "UNEXPECTED_ERROR"
                    })

                } else {//If Success
                    
                    res.status(200).send(result)
                    
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
