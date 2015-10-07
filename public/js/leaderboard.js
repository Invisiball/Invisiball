var leaders = $('tbody').children(), /**< Top 50 players. */
	lastQuery = '';

/**
 * Queries all player information to get matches.
 */
function query(str) {
	if (lastQuery === str) { // No point of updating if query is the same.
		return;
	}

	lastQuery = str; // New last query.

	if (str === '') { // If blank, show top 50.
		$('tbody').html(''); // Clear table.

		// Enter top 50 data.
		for (var iter = 0; iter < leaders.length; iter++) {
			$('tbody').append('<tr>' + leaders[iter].innerHTML + '</tr>');
		}
	} else { // Not blank, so query with str.
		$.get('/search/?query=' + str, function(data) {
			$('tbody').html(''); // Clear table.

			// Otherwise, enter players which were matched.
			for (var iter = 0; iter < data.length; iter++) {
				// Append data.
				$('tbody').append('<tr><td>' + (data[iter].place || iter + 1) + '</td>' +
								  '<td><a href="/Profile/' + data[iter].username + '">' + data[iter].username + '</a></td>' +
								  '<td>' + data[iter].kills + '</td>' +
								  '<td>' + data[iter].deaths + '</td>' +
								  '<td>' + data[iter].shots + '</td>' +
								  '<td>' + data[iter].accuracy + '%</td>' +
								  '<td>' + data[iter].kdr + '</td></tr>');
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
