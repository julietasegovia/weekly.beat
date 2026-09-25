# What Will I Make?

This is an app where the user links their Last.fm profile so the app can read their scrobbles. Once a week the app recommends a list of new tracks based on that week's activity.

## How Will I Make It?

I'll use the Last.fm API (`user.getrecenttracks`) with a public API key. Scrobbles are public, so the user only needs to enter their Last.fm username — no OAuth. From those scrobbles we derive top artists for the week.

Now for the recommendations. To find smaller yet good artists I'll make a scraper bot that will research music magazines and forums to find some niche tracks. I also have to figure out how to store this data.

After I have both this things I'll make a sorting algorithm and choose the top tracks from the scraper based on how similar they are to the user's weekly activity.

## Last.fm Linking

The landing page asks for a Last.fm username. That value is stored in `localStorage` and passed to `lastfmActivity.js`, which pages through recent tracks for the last 7 days and summarizes top artists. Those artists are POSTed to `/api/recs/weekly` for Bandcamp matching.