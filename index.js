var express = require('express')
var bodyParser = require('body-parser')
var GenerateSchema = require('generate-schema');
var jsonFormat = require('json-format');
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
			res.json({});
			fs.close(0);
			return;
		}
		
		res.json(JSON.parse(data));

		fs.close(0);
	});

})

function getData(pathObj, data) {
	if (Object.keys(pathObj).length == 0) {
		return null;
	} 
	var pathArr = pathObj.path.split('\\');
	var cursor = data;
	for (i in pathArr) {
		console.log('--------------' + pathArr[i]);
		console.log(cursor);
		if (pathArr[i] == '' || pathArr[i].slice(-1) == '$' || pathArr[i] == 'root') continue;
		if (pathArr[i] in cursor) {
			cursor = cursor[pathArr[i]];
		} else {
			return null;
		}
	}
	
	return cursor;
}

function getProductData(parentPath, dataPath, data) {
	if (!dataPath) return null;
	var relativePath = dataPath.path.replace(parentPath.path, '');
	// console.log(data);
	var data = getData({path: relativePath}, data);
	return data;
}

function loopProduct(mapping, products) {

	return products.map(function(product) {
		return {
			id: getProductData(mapping.products, mapping.product_id, product),
			price: getProductData(mapping.products, mapping.price, product),
			quantity: getProductData(mapping.products, mapping.quantity, product)
		}
	})
}

function loopProduct2(mapping, data) {
	var ids = getData(mapping.product_id, data);
	var quantities = getData(mapping.quantity, data);
	var prices = getData(mapping.price, data);

	var products = [];
	
	if (ids) {

		for(i in ids) {
			products.push({
				id: ids[i],
				quantity: quantities[i],
				price: prices[i]
			});
		}
	}

	return products;
}

function convert(mapping, data) {

	var event = {
		event: getData(mapping.event_type, data),
		id: getData(mapping.transaction_id, data),
		currency: getData(mapping.currency, data),
		product: getData(mapping.products, data)
	};

	if (event.product && Object.keys(mapping.product_id).length > 0) {
		event.product = loopProduct(mapping, event.product)
	} else {
		event.product = loopProduct2(mapping, data)		
	}

	// extra
	for (key in mapping.extra) {
		event[key] = getData(mapping.extra[key], data);
	}

	return {
		account:{
			an: getData(mapping.account_app, data),
			cn: getData(mapping.account_currency, data),
			ln: getData(mapping.account_language, data)
		},
		site_type: getData(mapping.site_type, data),
		id: {
			gaid: getData(mapping.gaid, data)
		},
		events: [ event ]
	};

}

app.get('/api/convert', function (req, res) {

	// should we handle file not found?
	fs.readFile(req.query.template + '.json', function read(err, data) {
		if (err) {
			res.json({ success: false })
			return;
		}
		try {
			var json = JSON.parse(data);
			var outputData = convert(json.mapping, JSON.parse(req.query.data));
			var config = {
			    type: 'space',
			    size: 4
			}

			res.json({ success: true, results: jsonFormat(outputData, config)});

		} catch(ex) {
			res.json({ success: false })
		}
	});

})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})