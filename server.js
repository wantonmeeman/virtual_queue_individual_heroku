var app = require('./app.js');


var port=3000//8081

//localhost 
var server = app.app.listen(process.env.PORT || 3000/*For Heroku*/, function () {
    console.log(`Web App Hosted at http://localhost:${port}`,port);
});
app.get("/testing",function(req,res){
    res.status(200).send("OK")
})