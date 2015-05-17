# Invisiball 0.4
A quirky multiplayer game using ThreeJS, CannonJS, and NodeJS + Socket.io called Invisiball.

## How To Run
First, customize [configs.js](./configs.js).
<br>
Then, run `node invisiball`.
<br>
The server will take over `process.env.PORT` or the specified port (default: 3000).

## How To Play
This is just another 1st-person shooter game, but with a twist: All players are invisible. Players must use their opponents' shots to calculate where the opponent is likely to be.

## Features
+ [X] Authentication
+ [ ] Checks for valid and unique usernames.
+ [X] View player stats by going to `/profile/[:username]`.
+ [X] View leaderboard by going to `/leaderboard`.
+ [ ] Rooms + simple chat.
+ [ ] Killcount and deathcount (now global as well as local).
+ [ ] Updates on who killed who, who joined, and who left.
+ [ ] Maps and game modes.
+ [ ] In-game store for weapons, armor, etc.
+ [ ] Multiple servers (user's choice).
+ [ ] Target mobile.
