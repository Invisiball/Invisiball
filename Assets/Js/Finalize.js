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

/**
 * Replaces all find with replace.
 * @param find String to find.
 * @param replace String to replace found with.
 */
String.prototype.Replace = function(find, replace) {
	return this.replace(new RegExp(find, 'g'), replace);
}

// "Go" button click.
$('button').click(function() {
	if (!(/^[a-z0-9]+$/i).test($('input').val()) || $('input').val().length < 8) { // Check for bad usernames.
		$('#error').html('Username "' + $('input').val() + '" is bad.');
	} else {
		window.location.href = '/Me/Profile/Finalize?NewUsername=' + $('input').val();
	}
});
