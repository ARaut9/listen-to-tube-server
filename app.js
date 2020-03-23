const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const ytsr = require('ytsr');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.get('/search', (req, res, next) => {
  // String specifying the query to search for
  const { q } = req.query;

  /*  * String specifying the type to filter results based on
      * 'playlist' is the only valid option for now,
      * in all other cases results are filtered based on video as type  */
  const { type } = req.query;

  /*  * performs a search based on the search query
      * and then applies either the video filter
      * or the playlist filter, if the request contains a type of playlist  */
  ytsr.getFilters(q, (err, filters) => {
    if (err) {
      next(err);
    } else {
      const filter = type === 'playlist'
        ? filters.get('Type').find((o) => o.name === 'Playlist')
        : filters.get('Type').find((o) => o.name === 'Video');

      const options = {
        nextpageRef: filter.ref,
      };

      ytsr(null, options, (err, searchResult) => (err ? next(err) : res.json(searchResult)));
    }
  });
});

app.get('/video', (req, res, next) => {
  const videoURL = req.query.url;
  const isValidURL = ytdl.validateURL(videoURL);

  if (isValidURL) {
    const videoID = ytdl.getURLVideoID(videoURL);

    ytdl.getInfo(videoID, (err, info) => {
      if (err) {
        next(err);
      } else {
        const { videoDetails } = info.player_response;
        // filter the formats array to only include audio formats
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const relatedVideos = info.related_videos;

        res.json({
          videoDetails,
          audioFormats,
          relatedVideos,
        });
      }
    });
  } else {
    next(Error('Invalid URL!'));
  }
});

app.get('/playlist', (req, res, next) => {
  const playlistURL = req.query.url;
  const isValidURL = ytpl.validateURL(playlistURL);

  if (isValidURL) {
    const playlistID = ytpl.getPlaylistID(playlistURL, (err, id) => (err ? next(err) : id));
    ytpl(playlistID, (err, result) => (err ? next(err) : res.json(result)));
  } else {
    next(Error('Invalid URL!'));
  }
});

// unknown endpoint handler
app.use((req, res, next) => {
  const err = new Error('404 Not Found!');
  err.status = 404;
  next(err);
});

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500);
  res.json({
    err: {
      message: err.message,
    },
  });
});

module.exports = app;
