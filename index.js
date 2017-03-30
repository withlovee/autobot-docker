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

app.get('/api/get', function (req, res) {

	fs.readFile(req.query.template + '.json', function read(err, data) {
		if (err) {
			throw err;
		}
		
		res.json(JSON.parse(data));
	});

})

function getData(path, data) {
	if (!path) {
		return null;
	} 

	var pathArray = path.split('\\');
	console.log(pathArray)
}

function convert(mapping, data) {
	var result = {
		"account":{
			"an": getData(mapping.account_app, data),
			"cn": "us",
			"ln": "en"
		},
		"site_type": "aa",
		"id": {
			"gaid": "e16332c1-dd78-4288-a4e3-6190ed632b7e"
		},
		"events": [
			{
				"event": "trackTransaction",
				"dd": 1,
				"nc ": 0,
				"id": "transaction-uid",
				"currency": "USD",
				"product": [
					{
						"id": "1234",
						"price": 10.2,
						"quantity": 1
					},
					{
						"id": "2345",
						"price": 11.2,
						"quantity": 2
					}
				]
			}
		],
		"ip":"192.168.0.1",
		"version":"s2s_v1.0.0"
	};

}

app.get('/api/convert', function (req, res) {
	// should we handle file not found?
	fs.readFile(req.query.template + '.json', function read(err, data) {
		if (err) {
			throw err;
		}
		
		var json = JSON.parse(data);

		convert(json.mapping, req.query.data);
	});

})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})