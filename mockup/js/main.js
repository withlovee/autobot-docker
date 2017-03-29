
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
	$(target).append('<div class="field-box" style="margin-left: ' +depth+ 'px"><input type="text" class="form-control extra-input" placeholder="extra_field1"><div class="drop-box" id="extra1" ondrop="drop(event)" ondragover="allowDrop(event)"></div><button type="button" class="btn btn-link remove-field-button"><i class="glyphicon glyphicon-remove"></i></button></div><!-- field-box -->');

});

$('#edit-template-modal').modal('show');