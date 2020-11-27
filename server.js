var app = require('./app.js');
var port = 3000 //8081

//localhost 
var server = app.app.listen(process.env.PORT || port, function () {
    console.log(`Web App Hosted at http://localhost:${port}`, port);
});
