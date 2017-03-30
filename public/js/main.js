
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
		<div class="field-box" style="margin-left: ' +depth+ 'px">
			<input type="text" class="form-control extra-input" placeholder="extra_field1">
			<div class="drop-box" id="extra1" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
			<button type="button" class="btn btn-link remove-field-button"><i class="glyphicon glyphicon-remove"></i></button>
		</div><!-- field-box -->`);

});

// $('#edit-template-modal').modal('show');

function flattenSchema(name, schema, level, parentType, path) {
	var result = [];
	var offset = 20;

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

			result = result.concat(flattenSchema('$', schema.items, level + offset, null, path + '\\' + name));
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
	for(i in boxes) {
		if (i == 0) {
			continue;
		}
		$('.schema-tree').append(`
			<div class="field-box" id="field-box-`+boxes[i].level+`" style="margin-left: `+boxes[i].level+`px" ondrop="drop(event)" ondragover="allowDrop(event)">
				<div class="drop-box-inner">
					<button class="element" id="el`+i+`" draggable="true" ondragstart="drag(event)">`+boxes[i].path+` (`+boxes[i].type+`)</button>
				</div>
				<span class="shadow">`+boxes[i].path+` (`+boxes[i].type+`)</span>
			</div><!-- field-box -->`);
	}
}

function getTree(data) {
	var input = $('#input').val();
	$.get('/api/getSchema?json=' + input, function( data ) {
		var result = flattenSchema('root', data.schema, 0, null, '');
		console.log(data);
		renderTree(result);
	});
}

function save() {
	var mapping = getMapping();
	$.ajax({
		url: 'api/save',
		dataType: 'json',
		method: 'post',
		contentType: 'application/json',
		data: JSON.stringify({
			'test': 1234
		}),
		//TODO handle if failed
		success: function(res) {
			console.log(res);
		},
		dataType: 'json'
	});
}

$('#edit-template-modal').on('shown.bs.modal', function () {
  getTree();
})

save();