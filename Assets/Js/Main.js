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

$('input').keyup(function(e) {
	if (e.keyCode === 13) {
		if ($('input#room').val().length >= 4 && parseInt($('input#max_players').val()) > 0 && parseInt($('input#max_players').val()) < 21) {
			window.location.href = '/Play/' + $('input').val() + '?Password=' + $('input#password').val() + '&PlayerNumber=' + parseInt($('input#max_players').val()).toString();
		} else {
			$('#error').html('Error validating data... Check your data and try again.');
		}
	}
});
