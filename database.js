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
//Testing
function testFunction() {
    pool.connect((err, client, release) => {

        if (err) {//Error Handling for Pool
            return console.error('Error acquiring client', err.stack)
        }

        client.query('SELECT NOW()', (err, result) => {//Callback Method
            if (err) {
                return console.error('Error executing query', err.stack)
            }
            console.log(result.rows)
        })

        client//Promise Method
            .query('SELECT NOW()')
            .then(result => console.log(result.rows))
            .catch(e => console.error(e.stack))

        release()

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
    /**
     * return a promise that resolves when all connection to the database is successfully closed, and rejects if there was any error.
     */
}

module.exports = {
    joinQueue,
    resetTables,
    closeDatabaseConnections,
    testFunction
};
