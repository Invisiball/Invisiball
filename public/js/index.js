function select_mode(elem) {
	elem = $(elem);
	$('#modeName').text(elem.attr('data-mode-pretty'));
	$('#modeInput').val(elem.attr('data-mode-raw'));
}

function select_map(elem) {
	elem = $(elem);
	$('#mapName').text(elem.attr('data-map-pretty'));
	$('#mapInput').val(elem.attr('data-map-raw'));
}
