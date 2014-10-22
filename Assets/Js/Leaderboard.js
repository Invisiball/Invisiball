var Top50 = $('tbody').children(), /**< Top 50 players. */
	LastQuery = '';

/**
 * Queries all player information to get matches.
 */
function query(str) {
	if (LastQuery === str) { // No point of updating if query is the same.
		return;
	}

	LastQuery = str; // New last query.

	if (str === '') { // If blank, show top 50.
		$('tbody').html(''); // Clear table.

		// Enter top 50 data.
		for (var iter = 0; iter < Top50.length; iter++) {
			$('tbody').append('<tr>' + Top50[iter].innerHTML + '</tr>');
		}
	} else { // Not blank, so query with str.
		$.get('/SearchUsers/?Query=' + str, function(data) {
			$('tbody').html(''); // Clear table.

			if (data === 'Maintenance') { // If there is maintenance, go to maintenenace.
				window.location.href = '/Maintenance?FromGame=false';
			}

			// Otherwise, enter players which were matched.
			for (var iter = 0; iter < data.length; iter++) {
				// Append data.
				$('tbody').append('<tr><td>' + data[iter].Place + '</td>' +
								  '<td><a href="/Profile/' + data[iter].Username + '">' + data[iter].Username + '</a></td>' +
								  '<td>' + data[iter].Kills.toString() + '</td>' +
								  '<td>' + data[iter].Deaths.toString() + '</td>' +
								  '<td>' + data[iter].Shots.toString() + '</td>' +
								  '<td>' + data[iter].Accuracy.toString() + '%</td>' +
								  '<td>' + data[iter].Kdr.toString() + '</td></tr>');
			}
		});
	}
}

// On enter, key up.
$('#search').keyup(function(v) {
	if (v.keyCode === 13) { // "ENTER" pressed.
		query($(this).val() || '');
	}
});
