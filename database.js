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
    pool.connect((err, client, release) => {//1 Pool = 1 Client

        if (err) {//Error Handling for Pool
            return console.error('Error acquiring client', err.stack)
        }

        // client.query('SELECT NOW()', (err, result) => {//Callback Method
        //     if (err) {
        //         return console.error('Error executing query', err.stack)
        //     }
        //     console.log(result.rows)
        // })

        client//Promise Method
            .query('SELECT NOW()')
            .then((result) => {
                console.log(result.rows)
                client//Promise Method
                    .query('SELECT NOW()')
                    .then((result) => { console.log(result.rows) }
                    ).catch(e =>
                        console.error(e.stack)
                    )
            }
            )
            .catch(e =>
                console.error(e.stack)
            )




    })
}

function serverAvailable(q_id, cb) {
    pool.connect((err, client, release) => {//1 Pool = 1 Client

        if (err) {//Error Handling for Pool
            return cb('Error acquiring client', null)
        }
        //client.query('TRUNCATE customers')// reset table
        //client.query('INSERT INTO customers(customer_id,queue_id,time_created,served) VALUES(2,1,to_timestamp('+(Date.now()/1000)+'),false)')    
        client.query('SELECT * FROM customers', function (err, result) {
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            console.log(result.rows)
        })

        client.query('SELECT queue_id FROM customers WHERE queue_id = $1', [q_id], function (err, result) {//0
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            if (result.rows.length == 0) {//Queue Doesnt exist
                console.log("Q is doesnt exist")
                return cb("404", null)
            }else{
                client.query('SELECT customer_id FROM customers WHERE served = false AND queue_id = $1 ORDER BY time_created ASC LIMIT 1', [q_id], function (err1, result1) {//1
                    if (err1) {
                        console.log(err1)
                        return cb(err1, null)
                    }
                    if (result1.rows.length == 0) {//Queue is Empty
                        console.log("Q is empty")
                        return cb(null, result1)
                    } else {
                        client.query('UPDATE customers SET served = true WHERE customer_id = $1',[result1.rows[0].customer_id], function (err2, result2) {//Set served to true,2
                            if (err2) {
                                console.log(err2)
                                return cb(err2, null)
                            }else{//Success
                                return cb(null, result1)
                            }
                        })
                    }
                })
            }
        })

        


    })
}

function CreateQueue(c_id, p_id, Callback) {
    pool.connect((err, connect, release) =>{
        if(err) {
            return Callback('Error accquiring client', null);
        }

        client.query('INSERT INTO queue')

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
    serverAvailable,
    CreateQueue,
    resetTables,
    closeDatabaseConnections,
    testFunction,
};
