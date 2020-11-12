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
    pool.connect((err, client, release) => {//1 Pool = 1 Client

        if (err) {//Error Handling for Pool
            return cb('Error acquiring client', null)
        }
        //Debugging

        //client.query('TRUNCATE customers')// reset table
        // client.query('SELECT * FROM customers', function (err, result) {
        //     if (err) {
        //         console.log(err)
        //         return cb(err, null)
        //     }
        //     console.log(result.rows)
        // })

        //Find out if queue Exists -> Find out if queue is Empty -> Update customer in queue
        client.query('SELECT queue_id FROM customers WHERE queue_id = $1', [q_id], function (err, result) {//0
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            if (result.rows.length == 0) {//Queue Doesnt exist
                console.log("Q doesnt exist")
                return cb("404", null)
            } else {
                client.query('SELECT customer_id FROM customers WHERE served = false AND queue_id = $1 ORDER BY time_created ASC LIMIT 1', [q_id], function (err1, result1) {//1
                    if (err1) {
                        console.log(err1)
                        return cb(err1, null)
                    }
                    if (result1.rows.length == 0) {//Queue is Empty
                        console.log("Q is empty")
                        return cb(null, result1)
                    } else {
                        client.query('UPDATE customers SET served = true WHERE customer_id = $1', [result1.rows[0].customer_id], function (err2, result2) {//Set served to true,2
                            if (err2) {
                                console.log(err2)
                                return cb(err2, null)
                            } else {//Success
                                return cb(null, result1)
                            }
                        })
                    }
                })
            }
        })




    })
}

function arrivalRate(q_id, from, duration, cb) {
    //End Date to Unix
    var endDate = from + (duration * 60)
    pool.connect((err, client, release) => {//1 Pool = 1 Client

        if (err) {//Error Handling for Pool
            return cb('Error acquiring client', null)
        }

        //client.query('TRUNCATE queue')
        //client.query(`INSERT INTO queue(queue_id,company_id,status) VALUES('QUEUE12345',1234567890,'ACTIVE')`)  
        //client.query(`INSERT INTO customers(customer_id,queue_id,time_created,served) VALUES(1234567890,'QUEUE12345',`+((Date.now()/1000)|0)+`,false)`)  

        client.query(`SELECT * FROM customers`, function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            console.log(result.rows)
        })
        client.query(`SELECT * FROM queue`, function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            console.log(result.rows)
        })


        client.query('SELECT queue_id FROM customers WHERE queue_id = $1', [q_id], function (err, result) {//change to from queue when fk is added
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            if (result.rows.length == 0) {//Queue Doesnt exist
                console.log("Q doesnt exist")
                return cb("404", null)
            } else {//We dont need the above SQL statement's result
                //Create TimeStamp using the query, we can also use for loop
                client.query(`select generate_series($1::bigint,$2::bigint) as timestamp `, [from, endDate], function (err, result) {
                    if (err) {
                        console.log(err)
                        return cb(err, null)
                    } else {
                        client.query(`SELECT COUNT(*),time_created FROM customers WHERE (time_created BETWEEN $1 AND $2) AND queue_id = $3 GROUP BY time_created`, [from, endDate, q_id], function (err1, result1) {//1
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
    })
}

// ****** JOIN QUEUE ******
function joinQueue(customer_id, queue_id, cb) {

    console.log(customer_id)
    console.log(queue_id)

    pool.connect((err, client, release) => {
        if (err) { // Error Handling for Pool
            return console.error('Error acquiring client', err.stack)
        }

        client.query(`SELECT * FROM queue WHERE queue_id = $1 AND status = 'ACTIVE'`, [queue_id], function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }

            if (result.rows.length == 0) {
                return cb({ code: 'INACTIVE_QUEUE' }, null)
            } else {
                client.query('SELECT * FROM customers WHERE customer_id = $1 AND queue_id = $2', [customer_id, queue_id], function (err, result) {
                    if (err) {
                        console.log(err)
                        return cb(err, null)
                    }

                    if (result.rows.length >= 1) {
                        return cb({ code: 'ER_DUP_ENTRY' }, null)
                    } else {
                        client.query('INSERT INTO customers (customer_id, queue_id, time_created) VALUES($1, $2, $3)', [customer_id, queue_id, ((Date.now() / 1000) | 0)], function (err, result) {
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



    })
}


// ****** CREATE QUEUE ******
function CreateQueue(c_id, q_id, callback) {
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
function UpdateQueue(q_id, status, callback) {
    console.log(q_id, status);
    pool.connect((err, client, release) => {
        if (err) {
            console.log(err)
            return callback(err, null)
        }

        client.query("SELECT queue_id FROM queue WHERE queue_id = $1", [q_id], function (err1, res1) {
            if (err1) {
                if (res1.rows.length = 0) {
                    return callback("404", null)
                } else {
                    return callback(err1, null)
                }
            } else {
                client.query("UPDATE queue SET status = $1 WHERE queue_id = $2", [status, q_id], function(err2, res2) {
                    if(err) {
                        return callback(err2, null);
                    }
                    return callback(null, res2.affectedRows)
                })
            }
        })
        client.release();
    })

}




// ****** CHECK QUEUE ******
function checkQueue(customer_id, queue_id) {

    pool.connect((err, client, release) => {
        if (err) { // Error Handling for Pool
            return console.error('Error acquiring client', err.stack)
        }

        client.query('SELECT COUNT(*) FROM customers', function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            console.log(result.rows);

        })

        client.query('SELECT COUNT(*) FROM customers WHERE customer_id = $1 AND queue_id = $2', [customer_id, queue_id], function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            console.log(result.rows);

        })

    })

}

function resetTables() {
    /**
     * return a promise that resolves when the database is successfully reset, and rejects if there was any error.
     */
}

function closeDatabaseConnections() {
    pool.end()
        .then(() => console.log('ENDED'))
        .catch((err) => console.log(err))
    /**
     * return a promise that resolves when all connection to the database is successfully closed, and rejects if there was any error.
     */
}

module.exports = {
    arrivalRate,
    serverAvailable,
    CreateQueue,
    resetTables,
    closeDatabaseConnections,
};
