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
    resetTables,
    closeDatabaseConnections,
    testFunction
};
