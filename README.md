__Note: This is an upload of what I was hoping to be the next version of Invisiball... However, I think the setup is getting unmanageable, so I will not be reusing this setup.__
# Invisiball V3
A multiplayer game using ThreeJS, CannonJS, and NodeJS + Socket.io called Invisiball.

## How To Run
First, edit [Server/Configs.js](./Server/Configs.js) and fill in your email information, OAuth keys / secrets, and MongoDB URL.
<br>
Then, run `node Server.js` in Administrator Mode (or `sudo`).
<br>
The server will take over `process.env.PORT` (or if not set, port 80).

## How To Play
This is just another 1st-person shooter game, but with a twist: All players are invisible. Players must use their opponents' shots to calculate where the opponent is likely to be.
<br>
Instructions and tutorials will be added eventually.

## Todos
+ [ ] Update all libaries.
+ [ ] Fix any old or deprecated code.
+ [ ] Run engine on server side for security.

## Features
+ [X] View player stats by going to `/Profile/[:username]`.
+ [X] View leaderboard by going to `/Leaderboard`.
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
