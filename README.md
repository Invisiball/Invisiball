# Invisiball [![Dependency Status](https://img.shields.io/david/Invisiball/Invisiball.svg)](https://david-dm.org/Invisiball/Invisiball) [![Issue Status](https://img.shields.io/github/issues/Invisiball/Invisiball.svg)](https://github.com/Invisiball/Invisiball/issues)
A multiplayer game using ThreeJS, CannonJS, and NodeJS + Socket.io called Invisiball.

## How To Play
This is just another 1st-person shooter game, but with a twist: All players are invisible. Players must use their opponents' shots to calculate where the opponent is likely to be.
<br>
Instructions and tutorials will be added eventually.

## How To Run
+ Install dependancies with: `npm install --local`.
+ Copy [lib/config.example.js](./lib/config.example.js) to [lib/config.js](./lib/config.js) and fill in your hostname, email information, OAuth keys / secrets, and MongoDB URL.
+ Run `node main` in Administrator Mode (or `sudo`).
+ The server will take over `process.env.PORT` (or if not set, port 80).

## Todos
+ [X] Update all libaries.
+ [X] Switch to Mongoose.
+ [ ] Fix any old or deprecated code.
+ [ ] Run engine on server side for security.

## Features
+ [X] View player stats by going to `/profile/[:username]`.
+ [X] View leaderboard by going to `/leaderboard`.
+ [X] Killcount and deathcount (now global as well as local).
+ [X] Rooms + simple chat.
+ [X] Updates on who killed who, who joined, and who left.
+ [X] Checks for valid and unique usernames.
+ [X] Google, Facebook, and Twitter authentication.
+ [X] I believe that this setup is able to hold up to ~100 users at one time (with [free dynos](https://www.heroku.com/pricing) only).
+ [X] Completely modularized code.
+ [ ] Maps and game modes.
+ [ ] In-game store for weapons, armor, etc...
+ [ ] Logs... Lots and lots of logs.
+ [ ] Tutorials, gameplay, guides.
+ [ ] Build a better game UI (like if player does not move for a certain amount of time, a tutorial pops up).
+ [ ] Target mobile.
+ [ ] Multiple servers (user's choice).

## License
[![License Status](https://img.shields.io/github/license/Invisiball/Invisiball.svg)](https://github.com/Invisiball/Invisiball/blob/master/LICENSE)

## Social
[![Twitter Status](https://img.shields.io/twitter/url/http/invisiball.herokuapp.com.svg?style=social)](https://twitter.com/intent/tweet?text=Invisiball,%20the%20FPS%20with%20a%20twist!:&url=http%3A%2F%2Finvisiball.herokuapp.com)
