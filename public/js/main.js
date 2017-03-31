
function allowDrop(ev) {
	ev.preventDefault();
}

function drag(ev) {
	ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("text");
	ev.target.appendChild(document.getElementById(data));
}

$('#edit-template-modal').on('click', '.remove-field-button', function() {
	var parent = $(this).parent('.field-box');
	parent.remove();
});

$('#edit-template-modal').on('click', '.add-button button', function() {
	var depth = $(this).data('depth');
	var target = $(this).data('target');
	$(target).append(`
		<div class="field-box extra-field-box" style="margin-left: ' +depth+ 'px">
			<input type="text" class="form-control extra-input" placeholder="extra_field1">
			<div class="drop-box" id="extra1" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
			<button type="button" class="btn btn-link remove-field-button"><i class="glyphicon glyphicon-remove"></i></button>
		</div><!-- field-box -->`);

});

// $('#edit-template-modal').modal('show');

function getTime() {
	var dNow = new Date();
	return new Date().toISOString().replace(':', '').replace(':', '').replace('.', '-');
}

function flattenSchema(name, schema, level, parentType, path) {
	var result = [];
	var offset = 30;

	if (schema.type == 'array') {

		if (schema.items.type == 'object') {

			result.push({
				name: name,
				type: schema.type + '(object)',
				path: path + '\\' + name,
				level: level
			});

			result = result.concat(flattenSchema('$', schema.items, level, schema.type, path + '\\' + name));
		}
		else {

			result.push({
				name: name,
				type: schema.type,
				path: path + '\\' + name,
				level: level
			});

			result = result.concat(flattenSchema(name + '$', schema.items, level + offset, null, path + '\\' + name));
		}


	} else if (schema.type == 'object') {

		if (parentType != 'array') {
		
			result.push({
				name: name,
				type: schema.type,
				path: path + '\\' + name,
				level: level
			});
		}

		for (key in schema.properties) {
			var subProperty = schema.properties[key];
			
			result = result.concat(flattenSchema(key, subProperty, level + offset, null, path + '\\' + name));
		}
	} else {
		
		result.push({
			name: name,
			type: schema.type,
			path: path + '\\' + name,
			level: level
		});

	}

	return result;
}

function renderTree(boxes) {
	$('.schema-tree').empty();
	if (!boxes || boxes.length == 0) {
		$('.schema-tree').html('<p class="text-center">Please insert sample data</p>');
	}
	for(i in boxes) {
		if (i == 0) {
			continue;
		}
		$('.schema-tree').append(`
			<div class="field-box" id="field-box-`+boxes[i].level+`" style="margin-left: `+boxes[i].level+`px" ondrop="drop(event)" ondragover="allowDrop(event)">
				<div class="drop-box-inner">
					<button class="element" id="el`+i+`" draggable="true" ondragstart="drag(event)" data-path="`+boxes[i].path+`">`+boxes[i].name+` (`+boxes[i].type+`)</button>
				</div>
				<span class="shadow">`+boxes[i].name+` (`+boxes[i].type+`)</span>
			</div><!-- field-box -->`);
	}
}

function getIdMapping(boxes) {
	var map = {};
	for (i in boxes) {
		map[boxes[i].path] = i;
	}

	return map;
}

function renderExtraData(template, map) {
	$('#box2').empty();
	if (template.mapping && template.mapping.extra) {
		var extra = template.mapping.extra;
		for(extraKey in extra) {
			var i = new Date().getTime();
			var ex = extra[extraKey];
			if (ex.path in map) {
				i = map[ex.path];
			}
			if ('path' in ex) {
				$('#box2').append(`
					<div class="field-box extra-field-box">
						<input type="text" class="form-control extra-input" placeholder="extra_field1" value="`+extraKey+`">
						<div class="drop-box" id="extra1" ondrop="drop(event)" ondragover="allowDrop(event)">
							<button class="element" id="el`+i+`" draggable="true" ondragstart="drag(event)" data-path="`+ex.path+`">`+ex.name+`</button>
						</div>
						<button type="button" class="btn btn-link remove-field-button"><i class="glyphicon glyphicon-remove"></i></button>
					</div><!-- field-box -->`);
				$('#el' + i).remove();
			} 
		}
	}	
}

function renderMappings(template, map) {
	$('.mapping-tree .drop-box').empty();
	for (m in template.mapping) {
		if ('path' in template.mapping[m]) {
			var i = 0;

			if (template.mapping[m].path in map) {
				i = map[template.mapping[m].path];
			} else {
				i = new Date().getTime();
			}	

			var btn = `<button class="element" id="nel`+i+`" draggable="true" ondragstart="drag(event)" data-path="`+template.mapping[m].path+`">`+template.mapping[m].name+`</button>`;
			$(".mapping-tree #" + m).html(btn);
			$('#el'+i).remove(); // remove button on left side
		}
	}

	renderExtraData(template, map);
}

function getTree(templateName) {
	var input = $('#input').val();
	$.get('/api/getSchema?json=' + input, function( data ) {
		var result = flattenSchema('root', data.schema, 0, null, '');
		renderTree(result);

		var map = getIdMapping(result);
		console.log('template', templateName);
		$.get('/api/get?template=' + templateName, function(template) {
			renderMappings(template, map);

		});
	});
}

function getPath(element) {
	var button = element.find('button');
	return {
		path: button.data('path'),
		name: button.html()
	}
}

function getExtraData() {
	var extras = {};
	$('.extra-field-box').each(function(extraBox) {
		var key = $(this).find('input').val();
		var button = $(this).find('button.element');
		var name = button.html();
		var path = $(this).find('button.element').data('path');
		extras[key] = {
			name: name,
			path: path
		};
	});

	return extras;
}

function getMapping() {
	var fields = [
		'account_app',
		'account_currency',
		'account_language',
		'site_type',
		'gaid',
		'event_type',
		'currency',
		'products',
		'transaction_id',
		'product_id',
		'quantity',
		'price'
	];

	var results = {};

	for(i in fields) {
		var path = getPath($('#' + fields[i]));
		results[fields[i]] = path;
	}

	results['extra'] = getExtraData();
	console.log(results);

	return results;
}

function save() {
	var mapping = getMapping();
	var templateName = $('#template_name').val();

	$.ajax({
		url: 'api/save',
		dataType: 'json',
		method: 'post',
		contentType: 'application/json',
		data: JSON.stringify({
			templateName: templateName,
			mapping: mapping
		}),
		//TODO handle if failed
		success: function(res) {
			if (res.success) {
				if ($('#template option[value="' + templateName + '"]').length == 0) {
					$('#template').append('<option value="' + templateName + '">' + templateName + '</option>')
					$('#template').val(templateName);
				}
				$('#edit-template-modal').modal('hide');
				console.log(res);

			} else {
				alert('Oops! Something went wrong.');
			}
		},
		dataType: 'json'
	});
}

function openModal(name) {
	$('#edit-template-modal').modal('show');
	getTree(name);
}


$('.new-button').click(function() {
	$('#template_name').val('New Template ' + getTime());
	$('#template_name').prop('disabled', false);
	openModal();
});

$('.edit-button').click(function() {
	var templateName = $('#template').val();
	$('#template_name').val(templateName);
	$('#template_name').prop('disabled', true);
	openModal(templateName);
});
// $('#edit-template-modal').on('show.bs.modal', function () {
// 	getTree();
// })

$('.save').click(function() {
	save();
})

$('.fire').click(function() {
	var template = $('#template').val();
	var data = $('#input').val();

	$('#output').val('');
	$('.status').hide();

	$.get('/api/convert', {
		template: template,
		data: data
	}, function( data ) {
		console.log(data);
		if (data.success) {
			$('#output').val(data.results);
			// show green tick (/)
			$('#passed').fadeIn(300);
			$('#failed').hide();
		} else {
			// show red (x)
			$('#failed').fadeIn(300);
			$('#passed').hide();
		}
	});
});