var mode = '',
	map = '';

function new_room() {
	if ($('input#room').val().length > 3 && parseInt($('input#max_players').val(), 10) > 0 && parseInt($('input#max_players').val(), 10) < 21 && mode && map) {
		window.location.href = '/Play/' + $('input#room').val() + '?Password=' + $('input#password').val() + '&PlayerNumber=' + $('input#max_players').val() + '&Mode=' + mode + '&Map=' + map;
	} else {
		$('#error').html('Error validating data... Check your data and try again.');
	}
}

function select_mode(elem) {
	elem = $(elem);
	$('span#modeName').text(elem.attr('data-mode-pretty'));
	mode = elem.attr('data-mode-raw');
}

function select_map(elem) {
	elem = $(elem);
	$('span#mapName').text(elem.attr('data-map-pretty'));
	map = elem.attr('data-map-raw');
}
