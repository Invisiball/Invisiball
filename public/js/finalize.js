// "Go" button click.
$('button').click(function() {
	var name = $('input').val();
	if (name.length < 8 || name.length > 20) { // Check for bad usernames.
		$('#error').html('Username "' + $('input').val() + '" has to be between 8 - 20 characters.');
	} else {
		window.location.href = '/me/profile/finalize?username=' + name;
	}
});
