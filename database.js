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
        //client.query('INSERT INTO customers(customer_id,queue_id,time_created,served) VALUES(123456789,1234567890,to_timestamp('+(Date.now()/1000)+'),false)')    
        // client.query('SELECT * FROM customers', function (err, result) {
        //     if (err) {
        //         console.log(err)
        //         return cb(err, null)
        //     }
        //     console.log(result.rows)
        // })

        //Find out if queue Exists -> Find out if queue is Empty -> Update customer in queue
        //Better way to name this
        client.query('SELECT queue_id FROM customers WHERE queue_id = $1', [q_id], function (err, result) {//0
            if (err) {
                console.log(err)
                return cb(err, null)
            }
            if (result.rows.length == 0) {//Queue Doesnt exist
                console.log("Q doesnt exist")
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

function arrivalRate(q_id,from,duration, cb) {
    console.log("From: "+from)
    pool.connect((err, client, release) => {//1 Pool = 1 Client

        if (err) {//Error Handling for Pool
            return cb('Error acquiring client', null)
        }
        //client.query('INSERT INTO customers(customer_id,queue_id,time_created,served) VALUES(322533345,1234567890,to_timestamp('+(Date.now()/1000)+')::timestamp without time zone,false)')  
        client.query(`SELECT * FROM customers`, function (err, result) {
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
                console.log("Q doesnt exist")
                return cb("404", null)
            }else{
                //I give up, wtf is the error 
                //Literally most ineffecient way
                var endDate = (from/1000)+duration
                //for(var x = (from/1000);x < endDate;x++){
                    client.query('SELECT COUNT(*) FROM customers WHERE time_created > to_timestamp($1)::timestamp without time zone ', [from], function (err1, result1) {//1
                        if (err1) {
                            console.log(err1)
                            return cb(err1, null)
                        }else{
                            //console.log(x)
                            console.log("Matches: "+result1.rows[0].count)
                        }
                    })
                //}
            }
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
