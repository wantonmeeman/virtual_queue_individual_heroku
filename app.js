const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const jsonschema = require('jsonschema');
const jsonvalidator = new jsonschema.Validator();
const app = express(); // DO NOT DELETE

const database = require('./database');
const { queue, log } = require('async');

app.use(morgan('dev'));
app.use(cors());
app.use(express.json())

// TEST API
app.get('/', function (req, res) {
    res.send("Test API")
    database.testFunction()
})

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

/**
 * Company: Arrival Rate
 */

/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue
 */

app.post('/customer/queue', function (req, res) {
    const customer_id = req.body.customer_id;
    const queue_id = req.body.queue_id;

    console.log(JSON.stringify(req.query));

    var schema = {
        "type": "object",
        "required": ["customer_id", "queue_id"],
        "properties": {
            "customer_id": {
                "type": "integer",
                "minimum": 1000000000,
                "maximum": 9999999999
            },
            "queue_id": {
                "type": "string",
                "pattern": "^[a-zA-Z0-9]*$",
                "minLength": 10,
                "maxLength": 10

            }
        }
    };

    let errorStatusMsg;

    let validateStatus = jsonvalidator.validate(req.body, schema) // JSON Validation

    console.log("body: " + req.body);
    console.log("query: " + req.query);

    console.log(validateStatus);

    /* database.joinQueue(customer_id, queue_id, function (err, result) {
        if (!err) {
            res.sendStatus(200)
        } else if (err.code == 23503) {
            res.status(404).json({ error: `Queue Id ${queue_id} not found.`, code: 'UNKNOWN_QUEUE' })
        } else if (err.code == 'ER_DUP_ENTRY') {
            res.status(422).json({ error: `Customer ${customer_id} is already in queue ${queue_id}!`, code: 'ALREADY_IN_QUEUE' })
        } else if (err.code == 'INACTIVE_QUEUE') {
            res.status(422).json({ error: `Queue ${queue_id} is inactive.`, code: 'INACTIVE_QUEUE' })
        } else {
            res.status(500).send('Internal Server Error')
        }
    }); */


})

/**
 * Customer: Check Queue
 */
app.get('/customer/queue', function (req, res) {
    const customer_id = req.query.customer;
    const queue_id = req.query.queue;

    var schema = {
        "type": "object",
        "required": ["customer_id", "queue_id"],
        "properties": {
            "customer_id": {
                "type": "integer",
                "minimum": 1000000000,
                "maximum": 9999999999
            },
            "queue_id": {
                "type": "string",
                "pattern": "^[a-zA-Z0-9]*$",
                "minLength": 10,
                "maxLength": 10

            }
        }
    };

    let errorStatusMsg;

    let validateStatus = jsonvalidator.validate(req.body, schema) // JSON Validation

    database.checkQueue(customer_id, queue_id, function (err, result) {
        if (!err) {
            res.status(200).send()

        } else if (err.code == '') {
            console.log(err);
            res.status(422).json({ error: `Customer ID should be 10 digits` })

        } else {
            console.log(err)
            res.status(500).send('Internal Server Error')

        }
    });


})

/**
 * ========================== UTILS =========================
 */

/**
 * 404
 */

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
