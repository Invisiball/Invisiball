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

//(function(){
	/**
	 * Returns a random number between and including min and max.
	 * @param min Minimum number to return.
	 * @param max Maximum number to return.
	 * @return A random number between and including min and max.
	 */
	function RandomNumber(min, max) {
		return parseInt(Math.random() * ((max + 1) - min) + min);
	}

	/**
	 * Returns a random color.
	 * @return A random color.
	 * @see RandomNumber
	 */
	function RandomColor() {
		switch(RandomNumber(0, 10)) {
			case 0: return 0x3E4C81;
			case 1: return 0x4B819A;
			case 2: return 0x7B8B44;
			case 3: return 0x9A5389;
			case 4: return 0x979393;
			case 5: return 0x596380;
			case 6: return 0x778059;
			case 7: return 0xBD979F;
			case 8: return 0x403633;
			case 9: return 0xFFD700;
			case 10: return 0x0D2B26;
			default: return 0xA52A2A;
		}
	}

	/**
	 * Creates a new spotlight at (x, y, z) pointing down.
	 * @param x X-Coordinate
	 * @param y Y-Coordinate
	 * @param z Z-Coordinate
	 * @return The new light.
	 */
	function createNewLight(x, y, z) {
		var lght = new THREE.SpotLight(0xFFFFFF);
		lght.castShadow = true;
		lght.shadowCameraNear = 20;
		lght.shadowCameraFar = 50;
		lght.shadowCameraFov = 40;
		lght.shadowMapBias = 0.1;
		lght.shadowMapDarkness = 0.7;
		lght.shadowMapWidth = 1024;
		lght.shadowMapHeight = 1024;
		lght.position.set(x, y, z);
		lght.target.position.set(x, 0, z);
		return lght;
	}

	/**
	 * Adds an update to the list for the player to see.
	 * @param message The message to send.
	 * @param shouldRemove True if should remove last child, false if not.
	 */
	function update(message, shouldRemove) {
		if ((shouldRemove === undefined ? true : shouldRemove) && $('#update').children().length > 5) {
			$('#update').children().first().fadeOut(1000);
			setTimeout(function() { $('#update').children().first().remove(); }, 1000);
		}
		$('#update').append(message).scrollTop(9999999999);
	}

	/**
	 * Re-creates the leaderboard with updated leaderboardData.
	 * @see leaderboardData
	 */
	function make_leaderboard() {
		for (var iter_ = 0; iter_ < leaderboardData.length; iter_++) {
			for (var iter = 0; iter < leaderboardData.length - 1; iter++) {
				if (leaderboardData[iter].kills > leaderboardData[iter + 1].kills) {
					var tmp = leaderboardData[iter];
					leaderboardData[iter] = leaderboardData[iter + 1];
					leaderboardData[iter + 1] = tmp;
				}
			}
		}

		var final = '';
		for (var iter = leaderboardData.length - 1; iter >= 0; iter--) {
			final += '<tr' + (leaderboardData[iter].is_self ? ' style="color: orange;">' : '>') +
					 '<td>' + leaderboardData[iter].username + '</td>' +
					 '<td>' + leaderboardData[iter].kills + '</td>' +
					 '<td>' + leaderboardData[iter].deaths + '</td></tr>';
		}

		$('#leaderboard').find('tr').slice(1).remove();
		$('#leaderboard').find('table').append(final);
	}

	var ballColors = {}, /**< Records colors of balls. */
		lastTimeKilled = 0, /**< Records the last time killed. */
		leaderboardData = []; /**< Records leaderboard data. */

	var socket = io.connect('/');

	var sphereShape, sphereBody, world, physicsMaterial, balls = [], ballMeshes = [], walls = [];

	const ONE_SECOND = 60, /**< Time for 1 second to go through. */
		  MAX_TIME_LIMIT = 3 * ONE_SECOND, /**< Seconds until balls disappear. */
		  MAX_USER_BALL_NUMBER = 10; /**< Number of balls allowed by the user. */

	var BALLS_OF_USER = 0; /**< Number of balls that the user owns. */

	var camera, scene, renderer, stats,
		geometry, material, mesh,
		controls, time = Date.now();

	var lights = []; /**< Light data. */

	var blocker = document.getElementById('blocker'), instructions = document.getElementById('instructions');

	// Set up PointerLock.
	if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
		var element = document.body;

		var pointerlockchange = function(event) {
			if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
				controls.enabled = true;
				blocker.style.display = 'none';
			} else {
				$('#title').html('Click to play.');
				$('#body').html('(W, A, S, D = Move, SPACE = Jump, MOUSE = Look, CLICK = Shoot, T = Talk, L = Toggle Leaderboard, C = Toggle Sound, P = Toggle Cinematic Mode, ESC = This Message)');

				controls.enabled = false;

				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';

				instructions.style.display = '';
			}
		}

		var pointerlockerror = function(event) {
			instructions.style.display = '';
		}

		// Hook pointer lock state change events
		document.addEventListener('pointerlockchange', pointerlockchange, false);
		document.addEventListener('mozpointerlockchange', pointerlockchange, false);
		document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

		document.addEventListener('pointerlockerror', pointerlockerror, false);
		document.addEventListener('mozpointerlockerror', pointerlockerror, false);
		document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

		instructions.addEventListener('click', function (event) {
			instructions.style.display = 'none';

			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

			if (/Firefox/i.test(navigator.userAgent)) {
				var fullscreenchange = function(event) {
					if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
						document.removeEventListener('fullscreenchange', fullscreenchange);
						document.removeEventListener('mozfullscreenchange', fullscreenchange);

						element.requestPointerLock();
					}
				}

				document.addEventListener('fullscreenchange', fullscreenchange, false);
				document.addEventListener('mozfullscreenchange', fullscreenchange, false);

				element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
				element.requestFullscreen();
			} else {
				element.requestPointerLock();
			}
		}, false);
	} else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
	}

	initCannon();
	init();
	animate();

	/**
	 * Initializes the cannon.
	 */
	function initCannon() {
		// Setup our world
		world = new CANNON.World();
		world.quatNormalizeSkip = 0;
		world.quatNormalizeFast = false;

		var solver = new CANNON.GSSolver();

		world.defaultContactMaterial.contactEquationStiffness = 1e9;
		world.defaultContactMaterial.contactEquationRegularizationTime = 4;

		solver.iterations = 7;
		solver.tolerance = 0.1;

		var split = true;
		if (split) {
			world.solver = new CANNON.SplitSolver(solver);
		} else {
			world.solver = solver;
		}

		world.broadphase = new CANNON.NaiveBroadphase();

		// Create a slippery material (friction coefficient = 0.0)
		physicsMaterial = new CANNON.Material("slipperyMaterial");
		var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, 0.0 /* friction coefficient */, 0.3  /* restitution */);
		// We must add the contact materials to the world
		world.addContactMaterial(physicsContactMaterial);

		// Create a sphere
		var mass = 5, radius = 1.3;
		sphereShape = new CANNON.Sphere(radius);
		sphereBody = new CANNON.RigidBody(mass, sphereShape, physicsMaterial);
		sphereBody.position.set(RandomNumber(5, 100), 10, RandomNumber(5, 100));
		sphereBody.linearDamping = 0.9;
		world.add(sphereBody);

		// Create a plane
		var groundShape = new CANNON.Plane();
		var groundBody = new CANNON.RigidBody(0, groundShape, physicsMaterial);
		groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), - Math.PI / 2);
		world.add(groundBody);
	}

	/**
	 * Sets up the world and scene.
	 */
	function init() {
		// Set physics gravity.
		world.gravity.set(0, -30, 0);

		// Make camera.
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

		// Create scene.
		scene = new THREE.Scene();

		// Create fog.
		scene.fog = new THREE.Fog(0x000000, 0, 500);

		// Add an ambient light.
		var ambient = new THREE.AmbientLight(0x111111);
		scene.add(ambient);

		// Add more lights.
		lights.push(createNewLight(0, 60, 0));
		lights.push(createNewLight(-50, 60, 100));
		lights.push(createNewLight(-50, 60, -100));
		lights.push(createNewLight(100, 60, 0));
		for (var iter = 0; iter < lights.length; iter++) {
			scene.add(lights[iter]);
		}

		// Create controls.
		controls = new PointerLockControls(camera, sphereBody);
		scene.add(controls.getObject());

		// Add collision for balls and player.
		sphereBody.addEventListener('collide', function(e) {
			if (e.contact.bi.shape.type === CANNON.Shape.types.SPHERE && (e.contact.bi.userData && e.contact.bi.userData.name !== user_data.username) && Date.now() - lastTimeKilled > 500) {
				sphereBody.position.set(RandomNumber(5, 100), 10, RandomNumber(5, 100));

				socket.emit('score::add', e.contact.bi.userData.name);

				if (toggle.allowsSound) {
					$('audio')[0].play();
				}

				lastTimeKilled = Date.now();

				/*$('#title').html('Take invisivenge!!! Click to play.');
				$('#body').html(e.contact.bi.userData.name + ' invisikilled you.');

				controls.enabled = false;

				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';

				instructions.style.display = '';*/
			}
		});

		// Create floor geometry.
		geometry = new THREE.PlaneGeometry(300, 300, 50, 50);
		geometry.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));

		// Create floor material.
		material = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
		THREE.ColorUtils.adjustHSV(material.color, 0, 0, 0.9);

		// Create floor.
		mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Stone material.
		var stone = new CANNON.Material('stone');

		// Create walls.
		for (var iter = 0; iter < 4; iter++) {
			walls.push({ plane: new CANNON.Plane() });
			walls[iter].body = new CANNON.RigidBody(0, walls[iter].plane, stone);
		}

		walls[0].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
		walls[0].body.position.set(-150, 0, 0);

		walls[1].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
		walls[1].body.position.set(150, 0, 0);

		walls[2].body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
		walls[2].body.position.set(0, -150, 0);

		walls[3].body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
		walls[3].body.position.set(0, 150, 0);

		for (var iter = 0; iter < 4; iter++) {
			world.add(walls[iter].body);
		}

		// Create renderer.
		renderer = new THREE.WebGLRenderer();
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(scene.fog.color, 1);
		document.body.appendChild(renderer.domElement);

		// Create stats.
		stats = new Stats();
		$(stats.domElement).css('position', 'absolute')
						   .css('bottom', '15px')
						   .css('left', '5px')
						   .attr('id', 'stats');
		$('#container').append(stats.domElement);

		// Create resize event listener.
		window.addEventListener('resize', function() {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);
	}

	/**
	 * Animates / steps the world and scene.
	 */
	function animate() {
		// Animate scene / world.
		requestAnimationFrame(animate);
		world.step(1/60);

		// Update ball positions
		for(var i = 0; i < balls.length; i++) {
			if (balls[i][1] > MAX_TIME_LIMIT) { // Remove ball if it has existed for more than MAX_TIME_LIMIT.
				if (balls[i][0].userData.name === user_data.username && BALLS_OF_USER > 0) { // If is a user ball, decrement BALLS_OF_USER.
					BALLS_OF_USER--;
				}

				// Remove the ball from the physics world and the scene.
				world.remove(balls[i][0]);
				scene.remove(ballMeshes[i]);

				// Remove the ball from ball data.
				balls.splice(i, 1);
				ballMeshes.splice(i, 1);
			} else {
				balls[i][0].position.copy(ballMeshes[i].position);
				balls[i][0].quaternion.copy(ballMeshes[i].quaternion);
				balls[i][1]++;
			}
		}

		// Update controls, scene, camera, time, and stats
		controls.update(Date.now() - time);
		renderer.render(scene, camera);
		time = Date.now();
		stats.update();
	}

	// Create shooter.
	var ballShape = new CANNON.Sphere(0.2);
	var ballGeometry = new THREE.SphereGeometry(ballShape.radius);
	var shootDirection = new THREE.Vector3();
	var shootVelo = 20;
	var projector = new THREE.Projector();

	/**
	 * Get shot direction.
	 * @param targetVec Vector to store direction in.
	 */
	function getShootDir(targetVec) {
		var vector = targetVec;
		targetVec.set(0, 0, 1);
		projector.unprojectVector(vector, camera);
		var ray = new THREE.Ray(sphereBody.position, vector.subSelf(sphereBody.position).normalize());
		targetVec.x = ray.direction.x;
		targetVec.y = ray.direction.y;
		targetVec.z = ray.direction.z;
	}

	// Add click (shot) event listener.
	window.addEventListener('click', function(e) {
		if (controls.enabled) { // Make sure that controls are enabled.
			if (BALLS_OF_USER >= MAX_USER_BALL_NUMBER) { // If player-owned balls exceed the maximum number of balls, do nothing.
				return;
			}
			// Otherwise, increment user's ball counter.
			BALLS_OF_USER++;

			// Play shooting sound if user has sound turned on.
			if (toggle.allowsSound) {
				$('audio')[1].play();
			}

			// Get shot direction.
			getShootDir(shootDirection);

			// Send a message to the server about the new ball that should be added.
			socket.emit('ball::set', [[
					shootDirection.x * shootVelo,
					shootDirection.y * shootVelo,
					shootDirection.z * shootVelo
				], [
					sphereBody.position.x + shootDirection.x * (sphereShape.radius * 1.52 + ballShape.radius),
					sphereBody.position.y + shootDirection.y * (sphereShape.radius * 1.52 + ballShape.radius),
					sphereBody.position.z + shootDirection.z * (sphereShape.radius * 1.52 + ballShape.radius)
				]]);

			if (__DEBUG__) {
				console.log('Ball::Set');
			}
		}
	});

	// Start toggle options and event.
	var toggle = Object.seal({ /**< Records events that send data. */
		allowsSound: true, /**< Records if the user wants sounds or not. */
		isInLeaderboard: false, /**< Records if the user is viewing the leaderboard. */
		isInPrintMode: false, /**< Records if the user is in cinematic mode. */
		isTalking: false, /**< Records if the user is "talking". */
	});

	// Add keyup event for detecting toggles.
	window.addEventListener('keyup', function(e) {
		if (__DEBUG__) {
			console.log(e.keyCode);
		}

		if (e.keyCode === 76) { // "L" was pressed.
			if (!toggle.isTalking) { // Make sure user is not typing a message.
				if (toggle.isInLeaderboard) { // Remove leaderboard if viewing leaderboard.
					$('#leaderboard').animate({
						opacity: 0,
						right: '-=300'
					});
					toggle.isInLeaderboard = false;
				} else { // Show leaderboard if not viewing leaderboard.
					$('#leaderboard').animate({
						opacity: 1,
						right: '+=300'
					});
					toggle.isInLeaderboard = true;
				}
			}
		} else if (e.keyCode === 80) { // "P" was pressed.
			if (!toggle.isTalking) { // Make sure user is not typing a message.
				if (toggle.isInPrintMode) { // Reset views if already in cinematic mode.
					$('#leaderboard').fadeIn(0);
					$('#instructions').fadeIn(0);
					$('#userinfo').fadeIn(0);
					$($('.hair')[0]).fadeIn(0);
					$($('.hair')[1]).fadeIn(0);
					$('#update').fadeIn(0);
					$('#stats').fadeIn(0);
					toggle.isInPrintMode = false;
				} else { // Hide views if not in cinematic mode.
					$('#leaderboard').fadeOut(0);
					$('#instructions').fadeOut(0);
					$('#userinfo').fadeOut(0);
					$($('.hair')[0]).fadeOut(0);
					$($('.hair')[1]).fadeOut(0);
					$('#update').fadeOut(0);
					$('#stats').fadeOut(0);
					toggle.isInPrintMode = true;
				}
			}
		} else if (e.keyCode === 84) { // "T" was pressed.
			if (!toggle.isTalking) { // If not talking, show the input.
				update('<input type="text" style="width: 250px; height: 20px; margin: 5px; color: black;" placeholder="Press \'ENTER\' to send.">', false);
				$('#update').find('input').focus();
				toggle.isTalking = true;
			}
		} else if (e.keyCode === 13) { // "ENTER" was pressed.
			if (toggle.isTalking) { // Send message to server if is talking and there is a message to send.
				var message = $('#update').find('input').val().replace(/[<>]/g, '');
				if (message.length !== 0) {
					socket.emit('user::chat', message);
				}
				$('#update').find('input').remove();
				toggle.isTalking = false;
			}
		} else if (e.keyCode === 67) { // "C" was pressed.
			// Toggle sound.
			toggle.allowsSound = !toggle.allowsSound;
		}
	});

	// Tell user to get ready.
	update('<li style="color: green;">You will be placed in a game soon.</li>');

	// Start connection to server.
	socket.on('connect', function() {
		// Connected!
		update('<li style="color: green;">Connected!</li>');

		if (__DEBUG__) {
			console.log('User::Authenticate (' + room_data.name + ')');
		}

		// Authenticate user.
		socket.emit('user::authenticate', room_data.name);

		// Connecting.
		socket.on('connecting', function() {
			update('<li style="color: green;">Connecting...</li>');
		});

		// Disconnected.
		socket.on('disconnect', function() {
			update('<li style="color: red;">Disconnected!</li>');
		});

		// Connection failed.
		socket.on('connect_failed', function() {
			update('<li style="color: red;">Connecting failed...</li>');
		});

		// An error occured.
		socket.on('error', function(err) {
			update('<li style="color: red;">Error! Please wait while we try to fix it...</li>');
		});

		// Reconnection failed.
		socket.on('reconnect_failed', function() {
			update('<li style="color: red;">Reconnection failed!</li>');
		});

		// Reconnected.
		socket.on('reconnect', function() {
			update('<li style="color: green;">Reconnected!</li>');
		});

		// Reconnecting.
		socket.on('reconnecting', function() {
			update('<li style="color: green;">Reconnecting...</li>');
		});

		// Forced to do this because of https://github.com/Automattic/socket.io/issues/430.
		//window.times = {'ball::set': {}, 'score::add': {}, 'user::create': {}, 'user::delete': {}};

		// A new ball must be created.
		socket.on('ball::set', function(name, ballinfo) {
			/*if (!window.times['ball::set'][name]) {
				window.times['ball::set'][name] = Date.now();
			} else {
				var dateNow = Date.now();
				if (dateNow - window.times['ball::set'][name] < 40) {
					window.times['ball::set'][name] = dateNow;
					if (__DEBUG__) {
						console.log('[ball::set] Double Event Blocked!');
					}
					return;
				}
				window.times['ball::set'][name] = dateNow;
			}*/

			if (__DEBUG__) {
				console.log('Ball::Set (' + name + ').');
			}

			// Set the ball's distinct color.
			if (!ballColors[name]) {
				ballColors[name] = RandomColor();
			}

			// Create the ball.
			var tmp_material = new THREE.MeshLambertMaterial({ color: ballColors[name] });
			THREE.ColorUtils.adjustHSV(tmp_material.color, 0, 0, 0.9);

			var ballBody = new CANNON.RigidBody(1, ballShape);
			var ballMesh = new THREE.Mesh(ballGeometry, tmp_material);
			world.add(ballBody);
			scene.add(ballMesh);
			ballMesh.castShadow = true;
			ballMesh.receiveShadow = true;
			ballBody.userData = { 'name': name };
			balls.push([ballBody, 0]);
			ballMeshes.push(ballMesh);
			ballBody.velocity.set(ballinfo[0][0], ballinfo[0][1], ballinfo[0][2]);
			ballBody.position.set(ballinfo[1][0], ballinfo[1][1], ballinfo[1][2]);
			ballMesh.position.set(ballinfo[1][0], ballinfo[1][1], ballinfo[1][2]);
			ballMesh.useQuaternion = true;
		});

		// A point must be added.
		socket.on('score::add', function(name, victim) {
			/*if (!window.times['score::add'][name]) {
				window.times['score::add'][name] = {};
			}
			if (!window.times['score::add'][name][victim]) {
				window.times['score::add'][name][victim] = dateNow;
			}
			var dateNow = Date.now();
			if (dateNow - window.times['score::add'][name][victim] < 40) {
				window.times['score::add'][name][victim] = dateNow;
				if (__DEBUG__) {
					console.log('[score::add] Double Event Blocked!');
				}
				return;
			}
			window.times['score::add'][name][victim] = dateNow;*/

			if (__DEBUG__) {
				console.log('Score::Add (' + name + ', ' + victim + ').');
			}

			if (name === user_data.username) { // Update kills if player was killer.
				$('#score').html(parseInt($('#score').html()) + 1);
				update('<li style="color: orange;">You invisikilled ' + victim + '!</li>');
				socket.emit('point::add');
			} else if (victim === user_data.username) { // Update deaths if player was killed.
				$('#death').html(parseInt($('#death').html()) + 1);
				update('<li style="color: orange;">' + name + ' invisikilled you!</li>');
			} else { // Other players were fighting, so add that.
				update('<li>' + name + ' invisikilled ' + victim + '!</li>');
			}

			var dfn = false, /**< Did find name. */
				dfv = false; /**< Did find victim. */
			// Add the point to the leaderboard data.
			for (var iter = 0; iter < leaderboardData.length; iter++) {
				if (dfn && dfv) {
					break;
				}

				if (leaderboardData[iter].username === name) {
					leaderboardData[iter].kills++;
					dfn = true;
				}

				if (leaderboardData[iter].username === victim) {
					leaderboardData[iter].deaths++;
					dfv = true;
				}
			}

			// Update the leaderboard.
			make_leaderboard();
		});

		// Authenicate user with password.
		socket.on('user::authenticate', function(password) {
			if (password !== '') {
				var answer = prompt('This is a password-protected room.', 'Enter the password here.');
				if (answer !== password) {
					window.location.href = '/?Error=Incorrect password.';
					return;
				}
			}

			if (__DEBUG__) {
				console.log('User::Create (' + JSON.stringify(room_data) + ')');
			}

			// Create user.
			socket.emit('user::create', room_data);
		});

		// A new user must be added.
		socket.on('user::create', function(name) {
			/*if (!window.times['user::create'][name]) {
				window.times['user::create'][name] = Date.now();
			} else {
				var dateNow = Date.now();
				if (dateNow - window.times['user::create'][name] < 40) {
					window.times['user::create'][name] = dateNow;
					if (__DEBUG__) {
						console.log('[user::create] Double Event Blocked!');
					}
					return;
				}
				window.times['user::create'][name] = dateNow;
			}*/

			if (__DEBUG__) {
				console.log('User::Create (' + name + ').');
			}

			// Tell player that a new player joined.
			update(name === user_data.username ? '<li style="color: orange;">You joined!</li>' : '<li>' + name + ' joined!</li>');

			// Add this player to the leaderboard.
			leaderboardData.push({
				username: name,
				kills: 0,
				deaths: 0,
				is_self: name === user_data.username
			});

			// Update the leaderboard.
			make_leaderboard();

			// Disconnect socket when leaving.
			window.onbeforeunload = function() {
				socket.disconnect();
			}

			// setInterval(function() {
			// 	socket.emit('pos::set', [sphereBody.position.x, sphereBody.position.y, sphereBody.position.z]);
			// }, 1000 / 60);
		});

		// A user must be deleted.
		socket.on('user::delete', function(name) {
			/*if (!window.times['user::delete'][name]) {
				window.times['user::delete'][name] = Date.now();
			} else {
				var dateNow = Date.now();
				if (dateNow - window.times['user::delete'][name] < 40) {
					window.times['user::delete'][name] = dateNow;
					if (__DEBUG__) {
						console.log('[user::delete] Double Event Blocked!');
					}
					return;
				}
				window.times['user::delete'][name] = dateNow;
			}*/

			if (__DEBUG__) {
				console.log('User::Delete (' + name + ').');
			}

			// Tell the player that a player left.
			update(name === user_data.username ? '<li style="color: orange;">You left.</li>' : '<li>' + name + ' left.</li>');

			// Update the leaderboard data.
			for (var iter = 0; iter < leaderboardData.length; iter++) {
				if (leaderboardData[iter].username === name) {
					leaderboardData.splice(iter, 1);
					break;
				}
			}

			// Update the leaderboard.
			make_leaderboard();
		});

		// A chat message must be presented.
		socket.on('user::chat', function(name, message) {
			// Tell the player the message and the author.
			update(user_data.username === name ? '<li style="color: orange;"><i>You: ' + message + '</i></li>' : '<li><i>' + name + ': ' + message + '</i></li>');
		});

		// The leaderboard must be initialized.
		socket.on('leaderboard::get', function(data) {
			// Push new data to the leaderboard.
			for (var iter = 0; iter < data.length; iter++) {
				data.is_self = false;
				leaderboardData.push(data[iter]);
			}

			// Update the leaderboard.
			make_leaderboard();
		});

		// Maintenance.
		socket.on('maintenance', function() {
			socket.disconnect();
			window.location.href = '/Maintenance?FromGame=true';
		});
	});
//})('Invisiball');
