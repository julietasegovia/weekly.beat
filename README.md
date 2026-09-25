# weekly.beat
## Introduction 
This is probably my most ambitious project. It started out as a practice because I wanted to learn how scraper bots work and it ended up having a whole algorithm implemented and Last.fm linking.

The main idea is simple: the user enters their Last.fm username and the app pulls the tracks they scrobbled this week. Then it uses MusicBrainz to put tags on those artists. Those tags get compared to the bandcamp tags from the database where I store what the bot scraped.

The app then serves the user a recommendation of a small artist, an album and a list of 5 songs found on bandcamp.

![](./readme-imgs/Screenshot%20From%202026-09-22%2016-58-29.png)

## Why did I make this?
I felt like I hadn't listened to new music in forever and Spotify itself makes it impossible to do so (check `documentation/INVESTIGATION.md` for more details on that). 

Straight up scrolling on bandcamp.com works but it can be a bit overwhelming. So I tried to find a middle ground with this project, new music but not totally different from what you're used to.

## Setup
1. Get a Last.fm API key at https://www.last.fm/api/account/create
2. Put it in `weekly.beat/.env` as `VITE_LASTFM_API_KEY=...`
3. Run the recs backend and the Vite frontend

## Architecture
The project consists of 3 parts, the bot, the backend and the frontend;

### The bot
A recluter, builds a list of song candidates from bandcamp with (most importantly) it's genre and tags.

I scripted this bot using Python and made sure that it followed bandcamp's policies on robots (`robots_check.py`) given that it uses bandcamp internal discover API.

The extracted and classified data gets storaged in `candidates.db`, an sqlite file that is later used in the backend. This database gets reset at the end of each week so that the tracks are always hot and fresh (`weekly.py`).

### The backend
The comparator and judge of which of the many songs stored in `candidates.db` will make it to the top 5 (same with artist and album).

### The frontend
Asks for a Last.fm username, fetches the last 7 days of scrobbles via the Last.fm API, sends the top artists to the backend, and shows the weekly picks.
