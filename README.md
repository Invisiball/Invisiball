# Invisiball
A multiplayer game using ThreeJS, CannonJS, and NodeJS + Socket.io called Invisiball.

## How To Run
First, edit [server.js](./server.js) and fill in your Google OAuth2 client information (`OAuth2Client`). This will be used to authenticate and read Google accounts.
<br>
Then, run `node server.js` in Administrator Mode (or `sudo`).
<br>
The server will take over `process.env.PORT` (or if not set, port 80).

## How To Play
This is just another 1st-person shooter game, but with a twist: All players are invisible. Players must use their opponents' shots to calculate where the opponent is likely to be.
<br>
Instructions and tutorials will be added eventually.

## Features
+ View player stats by going to `/Profile/[:username]`.
+ View leaderboard by going to `/Leaderboard`.
+ Killcount and deathcount (now global as well as local).
+ Rooms + simple chat.
+ Updates on who killed who, who joined, and who left.
+ Checks for valid and unique usernames.
+ Google & Facebook authentication.
+ I believe that this setup is able to hold up to ~50 - ~100 users at one time.

## Will Add
+ Tutorials, GamePlay, Guides (VERY LIKELY).
+ Build a better game UI (like if player does not move for a certain amount of time, a tutorial pops up) (LIKELY).
+ Target mobile. (LIKELY)
+ Multiple servers (user's choice). (UNLIKELY)

## Fixes
+ Fixed multiple-connections bug (socket.io).
+ Found a new way to save information faster.

## Issues
+ Cannot rename folders to capitalize them. Errors about not finding directories / files are normal.
+ PointerLock.js only really works on Chrome. (On FireFox, screen glitches. On Internet Explorer, Safari, and mobile, says not supported.)
+ Also, PointerLock.js is really glitchy and left-click (on Windows 2-button trackpads) does not work. When shooting, right-click works best.
<br>
<i>Please feel free to add GitHub issues. I will try my best to fix them.</i>
