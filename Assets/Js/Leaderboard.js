/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Usandfriends
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

////////// INVISIBALL //////////////

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
				// Accuracy.
				var accuracy = data[iter].Kills * 100 / data[iter].Shots;
				if (accuracy.toString() === 'NaN') {
					accuracy = (0).toFixed(2);
				}

				// Kdr.
				var kdr = data[iter].Kills / data[iter].Deaths;
				if (kdr === Infinity) {
					kdr = data[iter].Kills.toFixed(2);
				} else if (kdr.toString() === 'NaN') {
					kdr = (0).toFixed(2);
				}

				// Append data.
				$('tbody').append('<tr><td>' + data[iter].Place + '</td>' +
								  '<td><a href="/Profile/' + data[iter].Username + '">' + data[iter].Username + '</a></td>' +
								  '<td>' + data[iter].Kills.toString() + '</td>' +
								  '<td>' + data[iter].Deaths.toString() + '</td>' +
								  '<td>' + data[iter].Shots.toString() + '</td>' +
								  '<td>' + accuracy.toString() + '%</td>' +
								  '<td>' + kdr.toString() + '</td></tr>');
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
