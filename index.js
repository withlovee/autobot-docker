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

	fs.writeFile(req.body.templateName + ".json", JSON.stringify(req.body), function(err) {
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

function getData(pathObj, data) {
	if (!pathObj) {
		return null;
	} 

	var pathArr = pathObj.path.split('\\');
	console.log(pathArr);
	var cursor = data;
	for (i in pathArr) {
		if (pathArr[i] == '' || pathArr[i] == '$' || pathArr[i] == 'root') continue;
		if (pathArr[i] in cursor) {
			cursor = cursor[pathArr[i]];
		} else {
			return null;
		}
		console.log(cursor);
	}
	
	return cursor;
}

function getProductData(parentPath, dataPath, data) {
	if (!dataPath) return null;
	var relativePath = dataPath.path.replace(parentPath.path, '');

	return getData(relativePath, data);
}

function loopProduct(mapping, data) {
	if (mapping.products) {
		var productNode = getData(mapping.products, data);
		var products = [];

		for (i in productNode) {
			products.push({
				id: getProductData(mapping.products, mapping.product_id, productNode),
				price: getProductData(mapping.products, mapping.price, productNode),
				quantity: getProductData(mapping.products, mapping.quantity, productNode)
			});
		}
	}
}

function convert(mapping, data) {
	var product = loopProduct(mapping, data);

	var event = {
		"event": getData(mapping.event_type, data),
		"id": getData(mapping.transaction_id, data),
		"currency": getData(mapping.currency, data),
		"product": getData(mapping.products, data)
	};

	return {
		"account":{
			"an": getData(mapping.account_app, data),
			"cn": getData(mapping.account_currency, data),
			"ln": getData(mapping.account_language, data)
		},
		"site_type": getData(mapping.site_type, data),
		"id": {
			"gaid": getData(mapping.gaid, data)
		},
		"events": [ event ]
	};

}

app.get('/api/convert', function (req, res) {

		console.log(req.query.template);
	// should we handle file not found?
	fs.readFile(req.query.template + '.json', function read(err, data) {
		if (err) {
			throw err;
		}
		var json = JSON.parse(data);

		res.json(convert(json.mapping, JSON.parse(req.query.data)));
	});

})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})