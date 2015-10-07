(function(){
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
	function update_log(message, shouldRemove) {
		if ((shouldRemove === undefined ? true : shouldRemove) && $('#update').children().length > 5) {
			$('#update').children().first().fadeOut(1000);
			setTimeout(function() { $('#update').children().first().remove(); }, 1000);
		}
		$('#update').append(message).scrollTop(9999999999);
	}

	/**
	 * Updates ammo.
	 * @param val Value to add to BALLS_OF_USER.
	 */
	function update_ammo(val) {
		BALLS_OF_USER += val;

		if (BALLS_OF_USER < 0) {
			BALLS_OF_USER = 0;
		} else if (BALLS_OF_USER > MAX_USER_BALL_NUMBER) {
			BALLS_OF_USER = MAX_USER_BALL_NUMBER;
		}

		if (BALLS_OF_USER === MAX_USER_BALL_NUMBER) {
			$('#ammo').css('color', 'red');
		} else {
			$('#ammo').css('color', '');
		}

		$('#ammo').text(MAX_USER_BALL_NUMBER - BALLS_OF_USER);
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
					 '<td>' + leaderboardData[iter].username.replace(/\</g, '&lt;').replace(/\>/g, '&gt;') + '</td>' +
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

	var sphereShape, sphereBody, world, physicsMaterial, balls = [], ballMeshes = [];

	var ONE_SECOND = 60, /**< Time for 1 second to go through. */
		MAX_TIME_LIMIT = 1.75 * ONE_SECOND, /**< Seconds until balls disappear. */
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
				$('#body').html('(W, A, S, D = Move, SPACE = Jump, MOUSE = Look, CLICK/SHIFT/CRTL = Shoot, T = Talk, L = Toggle Leaderboard, C = Toggle Sound, P = Toggle Cinematic Mode, ESC = This Message)');

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
		sphereBody = new CANNON.Body({ mass: mass });
		sphereBody.addShape(sphereShape);
		sphereBody.position.set(RandomNumber(5, 23), 10, RandomNumber(5, 23));
		sphereBody.linearDamping = 0.9;
		world.add(sphereBody);
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
		// lights.push(createNewLight(-50, 60, 100));
		// lights.push(createNewLight(-50, 60, -100));
		// lights.push(createNewLight(100, 60, 0));
		// for (var iter = 0; iter < lights.length; iter++) {
		// 	scene.add(lights[iter]);
		// }

		// Add flashlight.
		flashlight = new THREE.PointLight(0xFFFFFF, 0.7, 15);
		scene.add(flashlight);

		// Create controls.
		controls = new PointerLockControls(camera, sphereBody);
		scene.add(controls.getObject());

		// Add collision for balls and player.
		sphereBody.addEventListener('collide', function(e) {
			if (e.contact.bi.type === CANNON.Shape.types.SPHERE && (e.contact.bi.userData && e.contact.bi.userData.name !== user_data.username) && Date.now() - lastTimeKilled > 500) {
				sphereBody.position.set(RandomNumber(5, 100), 10, RandomNumber(5, 100));

				socket.emit('score::add', e.contact.bi.userData.name);

				if (toggle.allowsSound) {
					$('audio')[0].play();
				}

				lastTimeKilled = Date.now();
			}
		});

		// Create a bottom-catcher.
		var bottomCatcherShape = new CANNON.Plane();
		var bottomCatcherBody = new CANNON.Body({ mass: 0 });
		bottomCatcherBody.addShape(bottomCatcherShape);
		bottomCatcherBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
		world.add(bottomCatcherBody);

		// var groundMatrix = [];
		// for (var i = 0; i < 4; i++) {
		// 	groundMatrix.push([]);
		// 	for (var j = 0; j < 4; j++) {
		// 		groundMatrix[i].push(Math.cos(i / 8 * Math.PI * 2) * Math.cos(j / 8 * Math.PI * 2));
		// 	}
		// }

		// // Create beautiful floor.
		// groundShape = new CANNON.Heightfield(groundMatrix, {
		// 	elementSize: 10
		// });

		// groundBody = new CANNON.Body({ mass: 0 });
		// groundBody.addShape(groundShape);
		// groundBody.position.set(0, 1, 0);
		// groundBody.quaternion.set(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
		// world.add(groundBody);

		// groundMesh = THREEUtils.Shape2Mesh(groundBody, new THREE.MeshLambertMaterial({ color: 0xDDDDDD }));
		// groundMesh.position.set(0, 1, 0);
		// groundMesh.rotation.x = -Math.PI / 2;
		// scene.add(groundMesh);

		// for (var i = 0; i < 4 - 1; i++) {
		// 	for (var j = 0; j < 4 - 1; j++) {
		// 		for (var k = 0; k < 2; k++) {
		// 			groundShape.getConvexTrianglePillar(i, j, !!k);
		// 			var convexBody = new CANNON.Body({ mass: 0 });
		// 			convexBody.addShape(groundShape.pillarConvex);
		// 			groundBody.pointToWorldFrame(groundShape.pillarOffset, convexBody.position);
		// 			world.add(convexBody);
		// 		}
		// 	}
		// }

		// Create floor geometry.
		geometry = new THREE.PlaneGeometry(50, 50, 50, 50);
		geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

		// Create floor material.
		material = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
		THREE.ColorConverter.setHSV(material.color, 0, 0, 0.9);

		// Create floor.
		mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Stone material.
		var stone = new CANNON.Material('stone');

		// ===== Walls ===== //

		// plane -x
		var planeShapeXmin = new CANNON.Plane();
		var planeXmin = new CANNON.Body({
			mass: 0,
			material: stone
		});
		planeXmin.addShape(planeShapeXmin);
		planeXmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
		planeXmin.position.set(-25, 0, 0);
		world.add(planeXmin);

		// Plane +x
		var planeShapeXmax = new CANNON.Plane();
		var planeXmax = new CANNON.Body({ mass: 0, material: stone });
		planeXmax.addShape(planeShapeXmax);
		planeXmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
		planeXmax.position.set(25, 0, 0);
		world.add(planeXmax);

		// Plane -z
		var planeShapeZmin = new CANNON.Plane();
		var planeZmin = new CANNON.Body({ mass: 0, material: stone });
		planeZmin.addShape(planeShapeZmin);
		planeZmin.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -Math.PI / 2);
		planeZmin.position.set(0, 0, -25);
		world.add(planeZmin);

		// Plane +z
		var planeShapeZmax = new CANNON.Plane();
		var planeZmax = new CANNON.Body({ mass: 0, material: stone });
		planeZmax.addShape(planeShapeZmax);
		planeZmax.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
		planeZmax.position.set(0, 0, 25);
		world.add(planeZmax);

		// ===== End Walls ===== //

		// Create building.
		$.getJSON('/meshes/building/building.json', function(data) {
			for (var k in data.objects) {
				var object_data = data.objects[k];

				var objectBody = new CANNON.Body({ mass: 0 });
				var objectShape = new CANNON.Box(new CANNON.Vec3(object_data.scale[0] * 2, object_data.scale[1] * 2, object_data.scale[2] * 2));
				objectBody.addShape(objectShape);
				objectBody.position.set(object_data.position[0] * 2, object_data.position[1] * 2, object_data.position[2] * 2);
				objectBody.quaternion.set(object_data.quaternion[0], object_data.quaternion[1], object_data.quaternion[2], object_data.quaternion[3]);
				world.add(objectBody);

				var objectMesh = THREEUtils.Shape2Mesh(objectBody, new THREE.MeshLambertMaterial({ color: 0xDDDDDD }));
				objectMesh.position.set(object_data.position[0] * 2, object_data.position[1] * 2, object_data.position[2] * 2);
				objectMesh.quaternion.set(object_data.quaternion[0], object_data.quaternion[1], object_data.quaternion[2], object_data.quaternion[3]);
				scene.add(objectMesh);
			}
		});

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
		world.step(1 / 60);

		// Update ball positions
		for(var i = 0; i < balls.length; i++) {
			if (balls[i][1] > MAX_TIME_LIMIT) { // Remove ball if it has existed for more than MAX_TIME_LIMIT.
				if (balls[i][0].userData.name === user_data.username && BALLS_OF_USER > 0) { // If is a user ball, decrement BALLS_OF_USER.
					update_ammo(-1);
				}

				// Remove the ball from the physics world and the scene.
				world.remove(balls[i][0]);
				scene.remove(ballMeshes[i]);

				// Remove the ball from ball data.
				balls.splice(i, 1);
				ballMeshes.splice(i, 1);
			} else {
				ballMeshes[i].position.copy(balls[i][0].position);
				ballMeshes[i].quaternion.copy(balls[i][0].quaternion);
				// balls[i][0].position.copy(ballMeshes[i].position);
				// balls[i][0].quaternion.copy(ballMeshes[i].quaternion);
				balls[i][1]++;
			}
		}

		// Set flashlight.
		flashlight.position = sphereBody.position;

		// Update controls, scene, camera, time, and stats
		controls.update(Date.now() - time);
		renderer.render(scene, camera);
		stats.update();
		time = Date.now();
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
		var ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize());
		targetVec.x = ray.direction.x;
		targetVec.y = ray.direction.y;
		targetVec.z = ray.direction.z;
	}

	function shoot() {
		if (controls.enabled) { // Make sure that controls are enabled.
			if (BALLS_OF_USER >= MAX_USER_BALL_NUMBER) { // If player-owned balls exceed the maximum number of balls, do nothing.
				return;
			}

			// Otherwise, increment user's ball counter.
			update_ammo(+1);

			// Play shooting sound if user has sound turned on.
			if (toggle.allowsSound) {
				$('audio')[1].play();
			}

			// Get shot direction.
			getShootDir(shootDirection);

			var pos_y = sphereBody.position.y + shootDirection.y * (sphereShape.radius + ballShape.radius + 1);

			// Send a message to the server about the new ball that should be added.
			socket.emit('ball::set', [[
				shootDirection.x * shootVelo,
				shootDirection.y * shootVelo,
				shootDirection.z * shootVelo
			], [
				sphereBody.position.x + shootDirection.x * (sphereShape.radius + ballShape.radius + 1),
				pos_y <= 0 ? 0.3 : pos_y,
				sphereBody.position.z + shootDirection.z * (sphereShape.radius + ballShape.radius + 1)
			]]);

			// if (__DEBUG__) {
			// 	console.debug('Ball::Set');
			// }
		}
	}

	// Add click (shot) event listener.
	window.addEventListener('click', function(e) {
		shoot();
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
		if (e.keyCode === 76 && !toggle.isTalking) { // "L" was pressed. Make sure user is not typing a message.
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
		} else if (e.keyCode === 80 && !toggle.isTalking) { // "P" was pressed. Make sure user is not typing a message.
			if (toggle.isInPrintMode) { // Reset views if already in cinematic mode.
				$('#leaderboard').fadeIn(0);
				$('#instructions').fadeIn(0);
				$('#userinfo').fadeIn(0);
				$($('.hair')[0]).fadeIn(0);
				$($('.hair')[1]).fadeIn(0);
				$('#update').fadeIn(0);
				$('#stats').fadeIn(0);
				THREE.FullScreen.request(renderer.domElement);
				toggle.isInPrintMode = false;
			} else { // Hide views if not in cinematic mode.
				$('#leaderboard').fadeOut(0);
				$('#instructions').fadeOut(0);
				$('#userinfo').fadeOut(0);
				$($('.hair')[0]).fadeOut(0);
				$($('.hair')[1]).fadeOut(0);
				$('#update').fadeOut(0);
				$('#stats').fadeOut(0);
				THREE.FullScreen.cancel();
				toggle.isInPrintMode = true;
			}
		} else if (e.keyCode === 84 && !toggle.isTalking) { // "T" was pressed. If not talking, show the input.
			update_log('<input type="text" style="width: 250px; height: 20px; margin: 5px; color: black;" placeholder="Press \'ENTER\' to send.">', false);
			$('#update').find('input').focus();
			toggle.isTalking = true;
		} else if (e.keyCode === 13 && toggle.isTalking) { // "ENTER" was pressed. Send message to server if is talking and there is a message to send.
			var message = $('#update').find('input').val().replace(/[<>]/g, '');
			if (message.length !== 0) {
				socket.emit('user::chat', message);
			}
			$('#update').find('input').remove();
			toggle.isTalking = false;
		} else if (e.keyCode === 67 && !toggle.isTalking) { // "C" was pressed. Toggle sound if not talking.
			toggle.allowsSound = !toggle.allowsSound;
		}
	});

	window.addEventListener('keydown', function(e) {
		if ((e.keyCode === 17 || e.keyCode === 16) && !toggle.isTalking) { // "CRTL or SHIFT" was pressed. Make sure the user is not talking.
			shoot();
		}
	});

	// Tell user to get ready.
	update_log('<li style="color: green;">You will be placed in a game soon.</li>');

	// Start connection to server.
	socket.on('connect', function() {
		// Connected!
		update_log('<li style="color: green;">Connected!</li>');

		if (__DEBUG__) {
			console.debug('User::Authenticate (' + room_data.name + ')');
		}

		// Authenticate user.
		socket.emit('user::authenticate', room_data.name);

		// Connecting.
		socket.on('connecting', function() {
			update_log('<li style="color: green;">Connecting...</li>');
		});

		// Disconnected.
		socket.on('disconnect', function() {
			update_log('<li style="color: red;">Disconnected!</li>');
		});

		// Connection failed.
		socket.on('connect_failed', function() {
			update_log('<li style="color: red;">Connecting failed...</li>');
		});

		// An error occured.
		socket.on('error', function(err) {
			update_log('<li style="color: red;">Error! Please wait while we try to fix it...</li>');
		});

		// Reconnection failed.
		socket.on('reconnect_failed', function() {
			update_log('<li style="color: red;">Reconnection failed!</li>');
		});

		// Reconnected.
		socket.on('reconnect', function() {
			update_log('<li style="color: green;">Reconnected!</li>');
		});

		// Reconnecting.
		socket.on('reconnecting', function() {
			update_log('<li style="color: green;">Reconnecting...</li>');
		});

		// A new ball must be created.
		socket.on('ball::set', function(name, ballinfo) {
			if (__DEBUG__) {
				console.debug('Ball::Set (' + name + ').');
			}

			// Set the ball's distinct color.
			if (!ballColors[name]) {
				ballColors[name] = RandomColor();
			}

			// Create the ball.
			var tmp_material = new THREE.MeshLambertMaterial({ color: ballColors[name] });
			THREE.ColorConverter.setHSV(tmp_material.color, 0, 0, 0.9);

			var ballBody = new CANNON.Body({ mass: 1 });
			ballBody.addShape(ballShape);
			ballBody.userData = { 'name': name };
			ballBody.velocity.set(ballinfo[0][0], ballinfo[0][1], ballinfo[0][2]);
			ballBody.position.set(ballinfo[1][0], ballinfo[1][1], ballinfo[1][2]);
			world.add(ballBody);

			var ballMesh = new THREE.Mesh(ballGeometry, tmp_material);
			ballMesh.castShadow = true;
			ballMesh.receiveShadow = true;
			ballMesh.position.set(ballinfo[1][0], ballinfo[1][1], ballinfo[1][2]);
			scene.add(ballMesh);

			balls.push([ballBody, 0]);
			ballMeshes.push(ballMesh);
		});

		// A point must be added.
		socket.on('score::add', function(name, victim) {
			if (__DEBUG__) {
				console.debug('Score::Add (' + name + ', ' + victim + ').');
			}

			if (name === user_data.username) { // Update kills if player was killer.
				$('#score').html(parseInt($('#score').html()) + 1);
				update_log('<li style="color: orange;">You invisikilled ' + victim + '!</li>');
				socket.emit('point::add');
			} else if (victim === user_data.username) { // Update deaths if player was killed.
				$('#death').html(parseInt($('#death').html()) + 1);
				update_log('<li style="color: orange;">' + name + ' invisikilled you!</li>');
			} else { // Other players were fighting, so add that.
				update_log('<li>' + name + ' invisikilled ' + victim + '!</li>');
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
				console.debug('Room::Create (' + JSON.stringify(room_data) + ')');
			}

			// Create user.
			socket.emit('user::create', room_data);
		});

		// A new user must be added.
		socket.on('user::create', function(name) {
			if (__DEBUG__) {
				console.debug('User::Create (' + name + ').');
			}

			// Tell player that a new player joined.
			update_log(name === user_data.username ? '<li style="color: orange;">You joined!</li>' : '<li>' + name + ' joined!</li>');

			// Make sure its not us.
			if (name !== user_data.username) {
				// Add this player to the leaderboard.
				leaderboardData.push({
					username: name,
					kills: 0,
					deaths: 0,
					Kills: 0,
					Deaths: 0,
					is_self: name === user_data.username
				});
			}

			// Update the leaderboard.
			make_leaderboard();

			// Disconnect socket when leaving.
			window.onbeforeunload = function() {
				socket.disconnect();

				// This will reconnect the socket if the user decides to stay.
				setTimeout(function() {
					socket.socket.connect();
				}, 1);

				return 'Are you sure you want to leave the game?';
			}
		});

		// A user must be deleted.
		socket.on('user::delete', function(name) {
			if (__DEBUG__) {
				console.debug('User::Delete (' + name + ').');
			}

			// Tell the player that a player left.
			update_log(name === user_data.username ? '<li style="color: orange;">You left.</li>' : '<li>' + name + ' left.</li>');

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
			update_log(user_data.username === name ? '<li style="color: orange;"><i>You: ' + message + '</i></li>' : '<li><i>' + name + ': ' + message + '</i></li>');
		});

		// The leaderboard must be initialized.
		socket.on('leaderboard::get', function(data) {
			// Push new data to the leaderboard.
			var keys = Object.keys(data);
			for (var iter = 0; iter < keys.length; iter++) {
				data[keys[iter]].username = keys[iter];
				data[keys[iter]].is_self = (user_data.username === keys[iter]);
				data[keys[iter]].kills = data[keys[iter]].kills;
				data[keys[iter]].deaths = data[keys[iter]].deaths;
				leaderboardData.push(data[keys[iter]]);
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
})();
