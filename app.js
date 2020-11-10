const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const app = express(); // DO NOT DELETE

const database = require('./database');

app.use(morgan('dev'));
app.use(cors());
app.use(express.json())

app.get('/',function(req,res){
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
app.put('/company/server',async function(req,res){
    database.serverAvailable(req.body.queue_id,function(err,result){
        if(err == '404'){
            console.log(404)
            res.status(404).send({

                error: "Queue Id "+req.body.queue_id+" Not Found",
                code: "UNKNOWN_QUEUE"

            })

        }else if(err != null){
            console.log(500)
            res.status(500).send({

                error: "Unable to establish connection with database",
                code:  "UNEXPECTED_ERROR"

            })
            console.log(err)
        }else{
            if(result.rows.length != 0){
                res.status(200).send({

                    customer_id : result.rows[0].customer_id//Probably a better way to do this.

                })
            }else{
                res.status(200).send({

                    customer_id : 0

                })
            }
            
        }
    })
    
})
/**
 * Company: Arrival Rate
 */

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
        console.log("404")
        res.status(404).json(
            {
                error: "Queue ID "+/*QUEUE ID*/1+" not found.",
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
