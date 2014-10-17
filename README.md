# Invisiball
A multiplayer game using ThreeJS, CannonJS, and NodeJS + Socket.io called Invisiball.

## How To Run
First, edit [Server.js](./Server.js) and fill in your email information and oauth keys / secrets.
<br>
Then, run `node Server.js` in Administrator Mode (or `sudo`).
<br>
The server will take over `process.env.PORT` (or if not set, port 80).

## How To Play
This is just another 1st-person shooter game, but with a twist: All players are invisible. Players must use their opponents' shots to calculate where the opponent is likely to be.
<br>
Instructions and tutorials will be added eventually.

## Features
+ [X] View player stats by going to `/Profile/[:username]`.
+ [X] View leaderboard by going to `/Leaderboard`.
+ [X] Killcount and deathcount (now global as well as local).
+ [X] Rooms + simple chat.
+ [X] Updates on who killed who, who joined, and who left.
+ [X] Checks for valid and unique usernames.
+ [X] Google & Facebook authentication.
+ [X] I believe that this setup is able to hold up to ~50 - ~100 users at one time.
+ [X] Completely modularized code.
+ [ ] Logs... Lots and lots of logs.
+ [ ] Maps and modes.
+ [ ] Tutorials, GamePlay, Guides.
+ [ ] Build a better game UI (like if player does not move for a certain amount of time, a tutorial pops up).
+ [ ] Target mobile.
+ [ ] Multiple servers (user's choice).
