var express = require('express')
var bodyParser = require('body-parser')
var GenerateSchema = require('generate-schema');
var fs = require('fs');
var app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(bodyParser.json())

app.get('/', function (req, res) {
	res.render('index');
})

app.get('/api/getSchema', function (req, res) {
	var schema = GenerateSchema.json('Data', req.query.json ? JSON.parse(req.query.json) : '');

	res.json({'schema': schema});
})

app.post('/api/save', function (req, res) {
	// TODO: check security issue here -- anyone can write
	console.log(req.body);

	fs.writeFile("template.json", JSON.stringify(req.body), function(err) {
	    if(err) {
	    	console.log(err);
			res.json({'success': false});
	    }

		res.json({'success': true});
	});

})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})