# What Will I Make?

This is an app where the user connect their spotify account to start tracking their streaming activity. Once a week the app will recommend a list of new tracks based on that week's activity.

## How Will I Make It?

I'll use the spotify web API for the user to authenticate and link their account with the app (https://developer.spotify.com/documentation/web-api/howtos/web-app-profile). With this I can easily access the user's Spotify information, including favorite artists, tracks, listening history, etc. I'll store this on a database (that I still have to figure out).

Now for the recommendations. To find smaller yet good artists I'll make a scraper bot that will research music magazines and forums to find some niche tracks. I also have to figure out how to store this data.

After I have both this things I'll make a sorting algorithm and choose the top tracks from the scraper based on how similar they are to the user's weekly activity.

NME FADER KERRANG! MIXMAG THEQUIETUS BANDCAMP 