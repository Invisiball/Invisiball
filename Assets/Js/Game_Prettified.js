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

(function() {
	var App = Object.freeze({
		Data: {
			Leaderboard: {},
			Player: {},
			Game: {}
		},
		Utils: {},
		Messenger: {},
		Connection: {}
	});

	//========== START UTILS ==========

	/**
	 * Returns a random number between and including Minimum and Maximum.
	 * @param Minimum Minimum number to return.
	 * @param Maximum Maximum number to return.
	 * @return A random number between and including Minimum and Maximum.
	 */
	App.Utils.RandomNumber = function (Minimum, Maximum) {
		return parseInt(Math.random() * ((Maximum + 1) - Minimum) + Minimum);
	}

	/**
	 * Returns a random color.
	 * @return A random color.
	 * @see RandomNumber
	 */
	App.Utils.RandomColor = function() {
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
	App.Utils.CreateNewLight = function(XCoord, YCoord, ZCoord) {
		var Light = new THREE.SpotLight(0xFFFFFF);
		Light.castShadow = true;
		Light.shadowCameraNear = 20;
		Light.shadowCameraFar = 50;
		Light.shadowCameraFov = 40;
		Light.shadowMapBias = 0.1;
		Light.shadowMapDarkness = 0.7;
		Light.shadowMapWidth = 1024;
		Light.shadowMapHeight = 1024;
		Light.position.set(XCoord, YCoord, ZCoord);
		Light.target.position.set(XCoord, 0, ZCoord);
		return Light;
	}

	//========== START MESSENGER ==========

	App.Messenger.View = $('#update');
	/**
	 * Adds an update to the list for the player to see.
	 * @param Message The message to send.
	 * @param PopLast True if should remove last child, false if not.
	 */
	App.Messenger.Send = function(Message, PopLast) {
		if ((PopLast === undefined ? true : PopLast) && this.View.children().length > 5) {
			this.View.children().first().fadeOut(1000, function() {
				this.remove();
			});
		}
		this.View.append(Message).scrollTop(9999999999);
	}

	App.Data.Game.BallColors = {}; /**< Records colors of balls. */
	App.Data.Player.LastTimeKilled = 0; /**< Records the last time killed. */

	// Leaderboard stuff.
	var App.Data.Leaderboard = {}; /**< Records leaderboard data. */
	App.Data.Leaderboard.View = $('#leaderboard');
	App.Data.Leaderboard.Data = [];

	/**
	 * Re-creates the leaderboard with updated App.Data.Leaderboard.
	 */
	App.Data.Leaderboard.Update = function() {
		for (var iter_ = 0; iter_ < this.Data.length; iter_++) {
			for (var iter = 0; iter < this.Data.length - 1; iter++) {
				if (this.Data[iter].kills > this.Data[iter + 1].kills) {
					var tmp = this.Data[iter];
					this.Data[iter] = this.Data[iter + 1];
					this.Data[iter + 1] = tmp;
				}
			}
		}

		var final = '';
		for (var iter = this.Data.length - 1; iter >= 0; iter--) {
			final += '<tr' + (this.Data[iter].is_self ? ' style="color: orange;">' : '>') +
					 '<td>' + this.Data[iter].username + '</td>' +
					 '<td>' + this.Data[iter].kills + '</td>' +
					 '<td>' + this.Data[iter].deaths + '</td></tr>';
		}

		this.View.find('tr').slice(1).remove();
		this.View.find('table').append(final);
	};

	/**
	 * Adds a row.
	 * @param Data Data to add.
	 */
	App.Data.Leaderboard.AddRow = function(Data) {
		this.Data.push(Data);
	};

	/**
	 * Removes a specific row.
	 * @param Username Row with username to search and destroy.
	 */
	App.Data.Leaderboard.RemoveRow = function(Username) {
		for (var RowIterator = 0; RowIterator < this.Data.length; RowIterator++) {
			if (this.Data[RowIterator].Username === Username) {
				this.Data.splice(RowIterator, 1);
				break;
			}
		}
	};

	App.Connection = io.connect('/');

	App.Data.Game.SphereShape = null;

	var App.Data.Game.SphereShape, sphereBody, world, physicsMaterial, balls = [], ballMeshes = [], walls = [];

	const ONE_SECOND = 60, /**< Time for 1 second to go through. */
		  MAX_TIME_LIMIT = 3 * ONE_SECOND, /**< Seconds until balls disappear. */
		  MAX_USER_BALL_NUMBER = 10; /**< Number of balls allowed by the user. */

	var BALLS_OF_USER = 0; /**< Number of balls that the user owns. */

	var camera, scene, renderer, stats,
		geometry, material, mesh,
		loader, controls, time = Date.now();

	var lights = [], /**< Light data. */
		flashlight; /**< Player's flashlight. */

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
		App.Data.Game.SphereShape = new CANNON.Sphere(radius);
		sphereBody = new CANNON.RigidBody(mass, App.Data.Game.SphereShape, physicsMaterial);
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
		// Make loader.
		loader = new THREE.JSONLoader(__DEBUG__);

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
		scene.add(lights[0]);
		lights.push(createNewLight(-50, 60, 100));
		lights.push(createNewLight(-50, 60, -100));
		lights.push(createNewLight(100, 60, 0));
		for (var iter = 0; iter < lights.length; iter++) {
			scene.add(lights[iter]);
		}

		// Add flashlight.
		flashlight = new THREE.PointLight(0xFFFFFF, 0.7, 15);
		scene.add(flashlight);

		// Create controls.
		controls = new PointerLockControls(camera, sphereBody);
		scene.add(controls.getObject());

		// Add collision for balls and player.
		sphereBody.addEventListener('collide', function(e) {
			if (e.contact.bi.shape.type === CANNON.Shape.types.SPHERE && (e.contact.bi.userData && e.contact.bi.userData.name !== user_data.username) && Date.now() - App.Data.Player.LastTimeKilled > 500) {
				sphereBody.position.set(RandomNumber(5, 100), 10, RandomNumber(5, 100));

				App.Connection.emit('score::add', e.contact.bi.userData.name);

				if (toggle.allowsSound) {
					$('audio')[0].play();
				}

				App.Data.Player.LastTimeKilled = Date.now();

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
		for (var iter = 0; iter < 2; iter++) {
			walls.push({ plane: new CANNON.Plane() });
			walls[iter].body = new CANNON.RigidBody(0, walls[iter].plane, stone);
		}

		walls[0].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
		walls[0].body.position.set(-150, 0, 0);

		walls[1].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
		walls[1].body.position.set(150, 0, 0);

		// walls[2].body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
		// walls[2].body.position.set(0, -150, 0);

		// walls[3].body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
		// walls[3].body.position.set(0, 150, 0);

		for (var iter = 0; iter < 2; iter++) {
			world.add(walls[iter].body);
		}

		// // Create castle.
		// loader.load('/Meshes/CastleTower/CastleTower.js', function(geometry, materials) {
		// 	console.log(materials);

		// 	// window.castles = [,,,,];

		// 	// for (var iter = 0; iter < 4; iter++) {
		// 	// 	castles[iter] = new THREE.Mesh(geometry, material);
		// 	// 	castles[iter].scale.set(0.2, 0.2, 0.2);
		// 	// 	castles[iter].rotation.setX(-Math.PI/2);
		// 	// 	scene.add(castles[iter]);
		// 	// }

		// 	// castles[0].position.set(0, 0, 0);
		// 	// castles[1].position.set(-50, 0, 100);
		// 	// castles[2].position.set(-50, 0, -100);
		// 	// castles[3].position.set(100, 0, 0);

		// 	var castle = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial(materials));
		// 	castle.scale.set(0.2, 0.2, 0.2);
		// 	castle.rotation.setX(-Math.PI/2);
		// 	scene.add(castle);
		// });

		// Create sand level.
		loader.load('/Meshes/SandLevel/SandLevel.js', function(geometry, materials) {
			console.log(materials);

			var sand = new THREE.Mesh(geometry, /*new THREE.MeshLambertMaterial(*/materials);
			sand.position.set(0, 20.7, 0);
			scene.add(sand);
		});

		// // Create prisoner level.
		// loader.load('/Meshes/PrisonerLevel/PrisonerLevel.js', function(geometry) {
		// 	prisoner = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
		// 	prisoner.scale.set(3.0, 3.0, 3.0);
		// 	prisoner.rotation.set(-Math.PI/2, 0, 0)
		// 	prisoner.position.set(0, 2, 0);
		// 	scene.add(prisoner);
		// });

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

		// Set flashlight.
		flashlight.position = sphereBody.position;

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
			App.Connection.emit('ball::set', [[
					shootDirection.x * shootVelo,
					shootDirection.y * shootVelo,
					shootDirection.z * shootVelo
				], [
					sphereBody.position.x + shootDirection.x * (App.Data.Game.SphereShape.radius + ballShape.radius),
					sphereBody.position.y + shootDirection.y * (App.Data.Game.SphereShape.radius + ballShape.radius),
					sphereBody.position.z + shootDirection.z * (App.Data.Game.SphereShape.radius + ballShape.radius)
				]]);

			// if (__DEBUG__) {
			// 	console.debug('Ball::Set');
			// }
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
		// if (__DEBUG__) {
		// 	console.debug(e.keyCode);
		// }

		if (e.keyCode === 76) { // "L" was pressed.
			if (!toggle.isTalking) { // Make sure user is not typing a message.
				if (toggle.isInLeaderboard) { // Remove leaderboard if viewing leaderboard.
					App.Data.Leaderboard.View.animate({
						opacity: 0,
						right: '-=300'
					});
					toggle.isInLeaderboard = false;
				} else { // Show leaderboard if not viewing leaderboard.
					App.Data.Leaderboard.View.animate({
						opacity: 1,
						right: '+=300'
					});
					toggle.isInLeaderboard = true;
				}
			}
		} else if (e.keyCode === 80) { // "P" was pressed.
			if (!toggle.isTalking) { // Make sure user is not typing a message.
				if (toggle.isInPrintMode) { // Reset views if already in cinematic mode.
					App.Data.Leaderboard.View.fadeIn(0);
					$('#instructions').fadeIn(0);
					$('#userinfo').fadeIn(0);
					$($('.hair')[0]).fadeIn(0);
					$($('.hair')[1]).fadeIn(0);
					App.Messenger.View.fadeIn(0);
					$('#stats').fadeIn(0);
					// THREE.FullScreen.request(renderer.domElement);
					toggle.isInPrintMode = false;
				} else { // Hide views if not in cinematic mode.
					App.Data.Leaderboard.View.fadeOut(0);
					$('#instructions').fadeOut(0);
					$('#userinfo').fadeOut(0);
					$($('.hair')[0]).fadeOut(0);
					$($('.hair')[1]).fadeOut(0);
					App.Messenger.View.fadeOut(0);
					$('#stats').fadeOut(0);
					// THREE.FullScreen.cancel();
					toggle.isInPrintMode = true;
				}
			}
		} else if (e.keyCode === 84) { // "T" was pressed.
			if (!toggle.isTalking) { // If not talking, show the input.
				update('<input type="text" style="width: 250px; height: 20px; margin: 5px; color: black;" placeholder="Press \'ENTER\' to send.">', false);
				App.Messenger.View.find('input').focus();
				toggle.isTalking = true;
			}
		} else if (e.keyCode === 13) { // "ENTER" was pressed.
			if (toggle.isTalking) { // Send message to server if is talking and there is a message to send.
				var message = App.Messenger.View.find('input').val().replace(/[<>]/g, '');
				if (message.length !== 0) {
					App.Connection.emit('user::chat', message);
				}
				App.Messenger.View.find('input').remove();
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
	App.Connection.on('connect', function() {
		// Connected!
		update('<li style="color: green;">Connected!</li>');

		if (__DEBUG__) {
			console.debug('User::Authenticate (' + room_data.Name + ')');
		}

		// Authenticate user.
		App.Connection.emit('user::authenticate', room_data.Name);

		// Connecting.
		App.Connection.on('connecting', function() {
			update('<li style="color: green;">Connecting...</li>');
		});

		// Disconnected.
		App.Connection.on('disconnect', function() {
			update('<li style="color: red;">Disconnected!</li>');
		});

		// Connection failed.
		App.Connection.on('connect_failed', function() {
			update('<li style="color: red;">Connecting failed...</li>');
		});

		// An error occured.
		App.Connection.on('error', function(err) {
			update('<li style="color: red;">Error! Please wait while we try to fix it...</li>');
		});

		// Reconnection failed.
		App.Connection.on('reconnect_failed', function() {
			update('<li style="color: red;">Reconnection failed!</li>');
		});

		// Reconnected.
		App.Connection.on('reconnect', function() {
			update('<li style="color: green;">Reconnected!</li>');
		});

		// Reconnecting.
		App.Connection.on('reconnecting', function() {
			update('<li style="color: green;">Reconnecting...</li>');
		});

		// Forced to do this because of https://github.com/Automattic/socket.io/issues/430.
		//window.times = {'ball::set': {}, 'score::add': {}, 'user::create': {}, 'user::delete': {}};

		// A new ball must be created.
		App.Connection.on('ball::set', function(name, ballinfo) {
			/*if (!window.times['ball::set'][name]) {
				window.times['ball::set'][name] = Date.now();
			} else {
				var dateNow = Date.now();
				if (dateNow - window.times['ball::set'][name] < 40) {
					window.times['ball::set'][name] = dateNow;
					if (__DEBUG__) {
						console.debug('[ball::set] Double Event Blocked!');
					}
					return;
				}
				window.times['ball::set'][name] = dateNow;
			}*/

			if (__DEBUG__) {
				console.debug('Ball::Set (' + name + ').');
			}

			// Set the ball's distinct color.
			if (!App.Data.Game.BallColors[name]) {
				App.Data.Game.BallColors[name] = RandomColor();
			}

			// Create the ball.
			var tmp_material = new THREE.MeshLambertMaterial({ color: App.Data.Game.BallColors[name] });
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
		App.Connection.on('score::add', function(name, victim) {
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
					console.debug('[score::add] Double Event Blocked!');
				}
				return;
			}
			window.times['score::add'][name][victim] = dateNow;*/

			if (__DEBUG__) {
				console.debug('Score::Add (' + name + ', ' + victim + ').');
			}

			if (name === user_data.username) { // Update kills if player was killer.
				$('#score').html(parseInt($('#score').html()) + 1);
				update('<li style="color: orange;">You invisikilled ' + victim + '!</li>');
				App.Connection.emit('point::add');
			} else if (victim === user_data.username) { // Update deaths if player was killed.
				$('#death').html(parseInt($('#death').html()) + 1);
				update('<li style="color: orange;">' + name + ' invisikilled you!</li>');
			} else { // Other players were fighting, so add that.
				update('<li>' + name + ' invisikilled ' + victim + '!</li>');
			}

			var dfn = false, /**< Did find name. */
				dfv = false; /**< Did find victim. */
			// Add the point to the leaderboard data.
			for (var iter = 0; iter < App.Data.Leaderboard.Data.length; iter++) {
				if (dfn && dfv) {
					break;
				}

				if (App.Data.Leaderboard.Data[iter].username === name) {
					App.Data.Leaderboard.Data[iter].kills++;
					dfn = true;
				}

				if (App.Data.Leaderboard.Data[iter].username === victim) {
					App.Data.Leaderboard.Data[iter].deaths++;
					dfv = true;
				}
			}

			// Update the leaderboard.
			make_leaderboard();
		});

		// Authenicate user with password.
		App.Connection.on('user::authenticate', function(password) {
			if (password !== '') {
				var answer = prompt('This is a password-protected room.', 'Enter the password here.');
				if (answer !== password) {
					window.location.href = '/?Error=Incorrect password.';
					return;
				}
			}

			if (__DEBUG__) {
				console.debug('Room::Create (' + JSON.stringify(room_data) + ')');
			}

			// Create user.
			App.Connection.emit('user::create', room_data);
		});

		// A new user must be added.
		App.Connection.on('user::create', function(name) {
			/*if (!window.times['user::create'][name]) {
				window.times['user::create'][name] = Date.now();
			} else {
				var dateNow = Date.now();
				if (dateNow - window.times['user::create'][name] < 40) {
					window.times['user::create'][name] = dateNow;
					if (__DEBUG__) {
						console.debug('[user::create] Double Event Blocked!');
					}
					return;
				}
				window.times['user::create'][name] = dateNow;
			}*/

			if (__DEBUG__) {
				console.debug('User::Create (' + name + ').');
			}

			// Tell player that a new player joined.
			update(name === user_data.username ? '<li style="color: orange;">You joined!</li>' : '<li>' + name + ' joined!</li>');

			// Add this player to the leaderboard.
			App.Data.Leaderboard.AddRow({
				username: name,
				kills: 0,
				deaths: 0,
				is_self: name === user_data.username
			});

			// Update the leaderboard.
			make_leaderboard();

			// Disconnect socket when leaving.
			window.onbeforeunload = function() {
				App.Connection.disconnect();
				//return 'Unfortunately, our servers are too slow to realize that you are leaving. Therefore, we are forced to put this message here to let them know what\'s going on. Please disregard this message and continue invisisurfing the Invisiweb. :)';
			}

			// setInterval(function() {
			// 	App.Connection.emit('pos::set', [sphereBody.position.x, sphereBody.position.y, sphereBody.position.z]);
			// }, 1000 / 60);
		});

		// A user must be deleted.
		App.Connection.on('user::delete', function(name) {
			/*if (!window.times['user::delete'][name]) {
				window.times['user::delete'][name] = Date.now();
			} else {
				var dateNow = Date.now();
				if (dateNow - window.times['user::delete'][name] < 40) {
					window.times['user::delete'][name] = dateNow;
					if (__DEBUG__) {
						console.debug('[user::delete] Double Event Blocked!');
					}
					return;
				}
				window.times['user::delete'][name] = dateNow;
			}*/

			if (__DEBUG__) {
				console.debug('User::Delete (' + name + ').');
			}

			// Tell the player that a player left.
			update(name === user_data.username ? '<li style="color: orange;">You left.</li>' : '<li>' + name + ' left.</li>');

			// Remove player from leaderboard.
			App.Data.Leaderboard.RemoveRow(name);

			// Update the leaderboard.
			make_leaderboard();
		});

		// A chat message must be presented.
		App.Connection.on('user::chat', function(name, message) {
			// Tell the player the message and the author.
			update(user_data.username === name ? '<li style="color: orange;"><i>You: ' + message + '</i></li>' : '<li><i>' + name + ': ' + message + '</i></li>');
		});

		// The leaderboard must be initialized.
		App.Connection.on('leaderboard::get', function(data) {
			// Push new data to the leaderboard.
			for (var iter = 0; iter < data.length; iter++) {
				data.is_self = false;
				App.Data.Leaderboard.AddRow(data[iter]);
			}

			// Update the leaderboard.
			make_leaderboard();
		});

		// Maintenance.
		App.Connection.on('maintenance', function() {
			App.Connection.disconnect();
			window.location.href = '/Maintenance?FromGame=true';
		});
	});

	return App;
})('Invisiball');
