const { log } = require('async')
const e = require('express')
const { Pool, Client } = require('pg')
const pool = new Pool({
    user: 'ftzvjgxu',
    host: 'john.db.elephantsql.com',
    database: 'ftzvjgxu',
    password: 'gQt5XXIrCa81Dcn2MTonBdeQc59ER4Aw',
    port: 5432,
})

function serverAvailable(q_id, cb) {
    pool.connect((err, client, release) => { // 1 Pool = 1 Client

        if (err) { // Error Handling for Pool
            console.log(err)
            return cb('Error acquiring client', null)
        }

        // Find out if Queue exists -> Find out if Queue is empty -> Update Customer in Queue
        client.query('SELECT queue_id FROM customers WHERE queue_id = UPPER($1)', [q_id], function (err, result) {//0
            if (err) {
                console.log(err)
                return cb(err.stack, null)
            }
            if (result.rows.length == 0) { // Queue does not exist
                console.log("Q doesnt exist")
                return cb("404", null)
            } else {
                client.query('SELECT customer_id FROM customers WHERE served = false AND queue_id = UPPER($1) ORDER BY time_created ASC LIMIT 1', [q_id], function (err1, result1) {//1
                    if (err1) {
                        console.log(err1)
                        return cb(err1.stack, null)
                    }
                    if (result1.rows.length == 0) { // Queue is empty
                        console.log("Q is empty")
                        return cb(null, result1)
                    } else {
                        client.query('UPDATE customers SET served = true WHERE customer_id = $1', [result1.rows[0].customer_id], function (err2, result2) {//Set served to true,2
                            if (err2) {
                                console.log(err2)
                                return cb(err2.stack, null)
                            } else { // Success
                                return cb(null, result1)
                            }
                        })
                    }
                })

            }
        })
        client.release()

    })
}

function arrivalRate(q_id, from, duration, cb) {
    //End Date to Unix
    var endDate = from + (duration * 60)
    pool.connect((err, client, release) => { // 1 Pool = 1 Client

        if (err) { // Error Handling for Pool
            return cb('Error acquiring client', null)
        }

        client.query('SELECT queue_id FROM customers WHERE queue_id = UPPER($1)', [q_id], function (err, result) {//change to from queue when fk is added
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            if (result.rows.length == 0) { // Queue does not exist
                console.log("Q doesnt exist")
                return cb("404", null)
            } else {
                // We don't need the above SQL statement's result
                // Create Timestamp using the query, we can also use for loop
                client.query(`select generate_series($1::bigint,$2::bigint) as timestamp `, [from, endDate], function (err, result) {
                    if (err) {
                        console.log(err)
                        return cb(err, null)
                    } else {
                        client.query(`SELECT COUNT(*),time_created FROM customers WHERE (time_created BETWEEN $1 AND $2) AND queue_id = UPPER($3) GROUP BY time_created`, [from, endDate, q_id], function (err1, result1) {//1
                            if (err1) {
                                console.log(err1)
                                return cb(err1, null)
                            } else {
                                console.log("Starting Date: " + from)
                                console.log("EndDate: " + endDate)
                                console.log("Length of Array: " + result.rows.length)
                                console.log("Length of Array2: " + result1.rows.length)
                                for (var i = 0; result.rows.length > i; i++) {
                                    if (result1.rows.length != 0) {
                                        for (var x = 0; result1.rows.length > x; x++) {
                                            if (result.rows[i].timestamp == result1.rows[x].time_created) {
                                                result.rows[i].count = result1.rows[x].count;
                                            } else {
                                                result.rows[i].count = 0;
                                            }
                                        }
                                    } else {
                                        result.rows[i].count = 0;
                                    }
                                }
                                console.log(result.rows)
                                return cb(null, result.rows)
                            }
                        })
                    }
                })

            }
        })
        client.release();

    })
}

// ****** JOIN QUEUE ******
function joinQueue(c_id, q_id, cb) {

    console.log(c_id)
    console.log(q_id)

    pool.connect((err, client, release) => {
        if (err) { // Error Handling for Pool
            return console.error('Error acquiring client', err.stack)
        }

        // Check if queue is inactive
        client.query(`SELECT * FROM queue WHERE queue_id = $1 AND status = 'INACTIVE'`, [q_id], function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }

            if (result.rows.length == 1) {  // if result is not null, queue is inactive
                return cb({ code: 'INACTIVE_QUEUE' }, null)
            } else {
                // check if this customer is already in this queue
                client.query('SELECT * FROM customers WHERE customer_id = $1 AND queue_id = UPPER($2)', [c_id, q_id], function (err, result) {
                    if (err) {
                        console.log(err)
                        return cb(err, null)
                    }

                    if (result.rows.length >= 1) {  // if there are results, customer_id is already in given queue (DUPLICATE)
                        return cb({ code: 'ER_DUP_ENTRY' }, null)
                    } else {
                        // if no results, add customer into given queue
                        client.query('INSERT INTO customers (customer_id, queue_id, time_created) VALUES($1, $2, $3)', [c_id, q_id, ((Date.now() / 1000) | 0)], function (err, result) {
                            if (err) {
                                console.log(err);
                                return cb(err, null)
                            } else {
                                return cb(null, result)
                            }
                        })
                    }

                })
            }
        })

        client.release();

    })
}



// ****** CHECK QUEUE ******
function checkQueue(c_id, q_id, cb) {
    let total;

    pool.connect((err, client, release) => {
        if (err) { // Error Handling for Pool
            return console.error('Error acquiring client', err.stack)
        }

        client.query(`SELECT * FROM queue WHERE UPPER(queue_id) = UPPER($1);`, [q_id], function (err, result) {     // check if queue exists
            if (err) {
                console.log(err)
                return cb(err, null)
            }

            if (result.rows.length == 0) {
                return cb({
                    "error": `Queue Id ${q_id} Not Found`,
                    "code": "UNKNOWN_QUEUE"
                }, null)

            } else {
                // total no. of ppl that is still in queue (excluding those have missed the queue/already served)
                // COALESCE (return first non null value, if there are no served customers in queue (null), set it to 0)
                client.query(`SELECT COUNT(customer_id) "count" FROM customers WHERE UPPER(queue_id) = UPPER($1) AND row_no > (SELECT COALESCE((SELECT row_no FROM customers WHERE UPPER(queue_id) = UPPER($2) AND served = true ORDER BY row_no DESC LIMIT 1), 0));`, [q_id, q_id], function (err, result) {
                    if (err) {
                        console.log(err)
                        return cb(err, null)
                    } else {
                        total = parseInt(result.rows[0].count);
                    }

                    if (c_id != null) {
                        // (if customer_id is provided then run)
                        // number of customers that are served (negative value) -> MISSED
                        // select no. of customers that are served and row no > given row c_id (check if there are people that join later but already served)
                        client.query('SELECT COUNT(customer_id) "count" FROM customers WHERE served = true AND UPPER(queue_id) = UPPER($1) AND row_no > (SELECT row_no FROM customers WHERE customer_id = $2 AND UPPER(queue_id) = UPPER($3));', [q_id, c_id, q_id], function (err, result) {
                            if (err) {
                                console.log(err)
                                return cb(err, null)
                            }

                            if (result.rows[0].count == 0) {
                                // (if count is 0, customer )  
                                // number of customers that are not served (positive value)
                                // select no. of customers that are served and row no < given row c_id (count no. of people that join before and are served)
                                client.query('SELECT COUNT(customer_id) FROM customers WHERE served = false AND UPPER(queue_id) = UPPER($1) AND row_no < (SELECT row_no FROM customers WHERE customer_id = $2 AND UPPER(queue_id) = UPPER($3)) AND row_no > (SELECT COALESCE((SELECT row_no FROM customers WHERE UPPER(queue_id) = UPPER($4) AND served = true ORDER BY row_no DESC LIMIT 1), 0));', [q_id, c_id, q_id, q_id], function (err, result) {
                                    if (err) {
                                        console.log(err)
                                        return cb(err, null)
                                    }

                                    return cb(null, { "total": total, "ahead": parseInt(result.rows[0].count), "status": "ACTIVE" })
                                })

                            } else {
                                // return cb(null, { "total": total, "ahead": parseInt(0 - result.rows[0].count), "status": "INACTIVE" })

                                let status = total > 0 ? "ACTIVE" : "INACTIVE"      // if total is more than 0, queue is ACTIVE
                                return cb(null, { "total": total, "ahead": -1, "status": status })
                            }
                        })
                    } else {
                        return cb(null, { "total": total, "status": "ACTIVE" })
                    }
                })
            }
        })
        client.release();
    })

}



// ****** CREATE QUEUE ******
function createQueue(c_id, q_id, callback) {
    console.log(c_id, q_id);
    pool.connect((err, client, release) => {
        if (err) {
            console.log(err)
            return callback(err, null)
        }
        client.query('SELECT queue_id from queue WHERE queue_id = $1', [q_id], function (error, result) {
            if (error) {
                callback(err, null)
                return;
            }
            if (result.rows.length > 0) {
                callback("422", null)
                return
            } else {
                client.query('INSERT INTO queue(queue_id, company_id, status) VALUES ($1, $2, $3)', [q_id, c_id, "DEACTIVATE"], function (err1, res1) {
                    if (err1) {
                        // if (err1.code === 'ERR_DUP_ENTRY') {
                        //     callback(
                        //         {
                        //             code: '422',
                        //             message: 'Queue Id already exists',
                        //             inner: err1
                        //         }, null)
                        //     return;
                        // }
                        console.log(err1);
                        callback("500", null)
                        return;

                    }

                    return callback(null, res1.affectedRows)

                })

            }
            client.release();
        })
    })

}

// ****** UPDATE QUEUE ******
function updateQueue(q_id, status, callback) {
    console.log(q_id, status);
    pool.connect((err, client, release) => {
        if (err) {
            console.log(err)
            return callback(err, null)
        }

        client.query("SELECT queue_id FROM queue WHERE queue_id = $1", [q_id], function (err1, res1) {
            console.log(res1.rows.length)
            if (res1.rows.length == 0) {
                return callback("404", null)
            }else if (err1) {
                return callback(err1, null)
            } else {
                client.query("UPDATE queue SET status = $1 WHERE queue_id = $2", [status, q_id], function (err2, res2) {
                    if (err) {
                        return callback(err2, null);
                    }
                    return callback(null, res2.affectedRows)
                })
            }
        })
        client.release();
    })

}


function resetTables() {
    /**
     * return a promise that resolves when the database is successfully reset, and rejects if there was any error.
     */
}

function closeDatabaseConnections() {
    /**
     * return a promise that resolves when all connection to the database is successfully closed, and rejects if there was any error.
     */
    pool.end()
        .then(() => console.log('ENDED'))
        .catch((err) => console.log(err))

}

module.exports = {
    arrivalRate,
    serverAvailable,
    joinQueue,
    checkQueue,
    createQueue,
    updateQueue,
    // resetTables,
    closeDatabaseConnections,
};
