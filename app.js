const cors = require("cors");
const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = 8443;
const options = {
  key: fs.readFileSync("ssl/mattburseth.com.key"),
  cert: fs.readFileSync("ssl/mattburseth.com.pem"),
};

//SPOTIFY INFORMATION
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://192.168.0.7:443/callback";
const GITHUB_REDIRECT = "https://mattburseth1221.github.io";
const LOCALHOST = "http://localhost:5502";
const MAIN_SITE_REDIRECT = LOCALHOST;

var state;
var accessCode;
var codeVerifier;

var accessToken = null;
var refreshToken = null;

const BASE_API_CALL = "https://api.spotify.com.";
const SPOTIFY_SEARCH_CALL = "https://api.spotify.com/v1/search?";
const SPOTIFY_API_TOKEN = "https://accounts.spotify.com/api/token";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

http.createServer(app).listen(8443);
https.createServer(options, app).listen(443);

const testJSON = {
  name: "name",
  data: [1, 2, 3],
  number: 9,
};

//First route in all spotify api calls from frontend
//Makes sure access token is present and can be used in further routes
//TODO: Find a way to make sure access token is still valid - if not, refresh the token
app.get("/spotify-api/*", async (req, res, next) => {
  console.log("Validating tokens...");

  if (accessToken !== null && refreshToken !== null) {
    const testResult = await getProfileInfo();

    next("route");
  } else if (accessToken === null && refreshToken === null) {
    console.log("send her back");
    res.send({ error: "User not signed in" });
  }
});

//Test route to return a simple JSON formatted object
app.get("/request-files", (req, res) => {
  res.send(testJSON);
});

//this receives the value for the encoded code verifier that was used to get access code from front end
//If successful, send back 200 status?
//CHECK STATUSES
app.post("/verifier-code", (req, res) => {
  console.log(req.body);

  if (req.body !== null) {
    codeVerifier = req.body.code_verifier;

    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

//I don't think this is still being used, this is now handled client side?
//Apparently CORS protocol does not allow for multiple redirects, was getting cross origin error
app.get("/spotify-api/get-access-code", (req, res) => {
  state = generateRandomString(16);

  let authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${SCOPES.join("%20")}&state=${state}`;

  res.redirect(authUrl);
});

//this is called after the client side authorization to receive the access code is called
//this is redirected immediately after user authenticates in spotify window
//takes access code from URL parameters and then requests an access/refresh token
app.get("/callback", async (req, res) => {
  let urlParams = new URLSearchParams(req.url);
  let urlState = urlParams.get("state");
  accessCode = urlParams.get("/callback?code");

  //This if statement was supposed to be for verifying "state" parameter?
  //May still be needed, although this is optional in spotify api documentation
  if (true) {
    var encode = new Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString(
      "base64"
    );

    const tokenResponse = await fetch(SPOTIFY_API_TOKEN, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + encode,
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code: accessCode,
        code_verifier: codeVerifier,
      }),
    }).then((response) => response.json());

    accessToken = tokenResponse.access_token;
    refreshToken = tokenResponse.refresh_token;

    res.redirect(MAIN_SITE_REDIRECT);
  } else {
    res.redirect(MAIN_SITE_REDIRECT + "?error=state-mismatch");
  }
});

//listens for requests related to searching for an artist
//artist name is taken from url parameters under name "artist"
app.get("/spotify-api/:artist", async (req, res) => {
  let artist = req.params.artist;

  console.log(artist);
  console.log(accessToken);

  if (artist !== null) {
    res.send(await searchArtist(artist));
  } else {
    res.sendStatus(400);
  }
});

app.get("/spotify-api/profile", (req, res) => {});

//called if access token is expired (past 'expires_in' time)
//TODO: find a way to see if a token is still within expiration period
async function refreshAccessToken() {
  console.log("Refreshing Access Token...");

  const tokenResponse = fetch(SPOTIFY_API_TOKEN, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }).then((response) => response.json());
}

//OLD LISTEN CONFIG
// app.listen(port, "192.168.0.7");

//This is called from /spotify-api/:artist endpoint
//Takes in the name of an artist (should be enforced to be String (TS))
//Fetches artist search information from spotify api
//Currently limited to 8, this can be another passed parameter in the future
async function searchArtist(artistName) {
  var url = new URL(SPOTIFY_SEARCH_CALL);

  const params = {
    q: artistName,
    type: "artist",
    limit: 8,
  };

  url.search = new URLSearchParams(params).toString();

  const result = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => response.json());

  console.log(result.artists);
  return result.artists;
}

//This is not used anymore, old frontend code
function loginToSpotify() {
  // Generate the Spotify authentication URL
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${SCOPES.join("%20")}`;
  // Open the authentication URL in a new window
  window.open(authUrl, "_self");
}

function loginToSpotifyAccessCode() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${SCOPES.join("%20")}`;
  // Open the authentication URL in a new window
  window.open(authUrl, "_self");
}

//Generates random string for code verifier
//This isn't used here on backend, was supposed to be used for state verification
//TODO: Implement state verification???
function generateRandomString(length) {
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var randomString = "";

  for (var i = 0; i < length; i++) {
    var character = characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
    randomString += character;
  }

  return randomString;
}

async function getProfileInfo() {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => response.json());

  return result;
}
