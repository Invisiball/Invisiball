$('input').keyup(function(e) {
	if (e.keyCode === 13) {
		if ($('input#room').val().length >= 4 && parseInt($('input#max_players').val()) > 0 && parseInt($('input#max_players').val()) < 21) {
			window.location.href = '/Play/' + $('input').val() + '?Password=' + $('input#password').val() + '&PlayerNumber=' + parseInt($('input#max_players').val()).toString();
		} else {
			$('#error').html('Error validating data... Check your data and try again.');
		}
	}
});
