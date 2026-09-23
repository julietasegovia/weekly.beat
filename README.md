# weekly.beat
## Introduction 
This is probably my most ambitious project. It started out as a practice because I wanted to learn how scraper bots work and it ended up having a whole algorithm implemented and a Spotify linking.

The main idea is simple, user logs in with spotify account and the app rquests the tracks the user listened to this week. Then, it uses MusicBrainz to put 'tags' to every single track. Those tags get compared to the bandcamp tags from the database where I store what the bot scraped.

The app then serves the user a recommendation of a small artist, an album and a list of 5 songs found on bandcamp.

![](./readme-imgs/Screenshot%20From%202026-09-22%2016-58-29.png)

## Why did I make this?
I felt like I hadn't listened to new music in forever and Spotify itself makes it impossible to do so (check `documentation/INVESTIGATION.md` for more details on that). 

Straight up scrolling on bandcamp.com works but it can be a bit overwhelming. So I tried to find a middle ground with this project, new music but not totally different from what you're used to.

## Architecture
The project consists of 3 parts, the bot, the backend and the frontend;

### The bot
A recluter, builds a list of song candidates from bandcamp with (most importantly) it's genre and tags.

I scripted this bot using Python and made sure that it followed bandcamp's policies on robots (`robots_check.py`) given that it uses bandcamp internal discover API.

The extracted and classified data gets storaged in `candidates.db`, an sqlite file that is later used in the backend. This database gets reset at the end of each week so that the tracks are always hot and fresh (`weekly.py`).

### The backend
The comparator and judge of which of the many songs stored in `candidates.db` will make it to the top 5 (same with artist and album). 

At first I wanted to collect the user's Spotify data directly using the Spotify Developer API but when deploying I run into the problem that that feature has been reduced since Febuary and now I can only use it on five users that I have to specifically put on a list of allowed users.

Since I want my app to be usable by everyone, I'll try redoing this backend with last.fm as it has no limitations to the ammount of users per app.

The logic itself is simple, I ask for the user's music history as soon as they log in (`services/weeklyActivity.js`), then I request the tags from MusicBrainz (`artistTags.js`). Once I have the user's activity summarized in tags I compare it to my database of candidates and get the best matches (`matchTracks.js`) based on tags, genre, and how confident the app is that the data was classified correctly (if a song on bandcamp doesn't have tags/genre the bot will assume that song's tags/genre is the same as the artist's and mark it as lower confidence). And that's essentially how the logic goes. 

I also have a couple of scripts to connect that logic to the frontend, like `spotifyCovers.js` that gets the artist's/album's image and exports it to the frontend.

### The frontend
Everything you can visually percieve was made using React + Vite for structure and the TailwindCSS framework for styling. I've worked with these frameworks before and I love them because they're quick, super simple, and easy to deploy.

I made it all in a single component (which is not usual for React) as it was a one-page, mostly static, simple design.

For the design I wanted something similar to the Spotify UI but with a twist. I'm pretty happy with how it turned out.

## AI usage declearation
I used Cursor Agent for most of the tag comparation system and ocassionaly to debug other features.