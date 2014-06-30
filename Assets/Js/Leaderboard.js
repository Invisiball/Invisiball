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

var old_data = [], data_childs = $('tbody').length === 0 ? [] : $('tbody').children();

function query(str) {
	if (str === '') {
		$('tbody').html('');

		for (var iter = 0; iter < data_childs.length; iter++) {
			$('tbody').append('<tr>' + data_childs[iter].innerHTML + '</tr>');
		}
	} else {
		$.get('/SearchUsers/?Query=' + str, function(data) {
			$('tbody').html('');

			if (data === 'Maintenance') {
				window.location.href = '/Maintenance?FromGame=false';
			}

			for (var iter = 0; iter < data.length; iter++) {
				var accuracy = data[iter].kills * 100 / data[iter].shots;
				if (accuracy.toString() === 'NaN') {
					accuracy = (0).toFixed(2);
				}

				var kdr = data[iter].kills / data[iter].deaths;
				if (kdr === Infinity) {
					kdr = data[iter].kills.toFixed(2);
				} else if (kdr.toString() === 'NaN') {
					kdr = (0).toFixed(2);
				}

				$('tbody').append('<tr><td>' + data[iter].rowid + '</td><td><a href="/Profile/' + data[iter].username + '">' + data[iter].username + '</a></td><td>' + data[iter].kills.toString() + '</td><td>' + data[iter].deaths.toString() + '</td><td>' + data[iter].shots.toString() + '</td><td>' + accuracy.toString() + '%</td><td>' + kdr.toString() + '</td></tr>');
			}
		});
	}
}

$('#search').keyup(function(v) {
	query($(this).val() || '');
});
