const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = function(callback) {
  const url = "https://api.ipify.org?format=json";

  request(url, (error, response, body) => {
    if (error) {
      return callback(error, null);
    }

    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response ${body}`;
      return callback(Error(msg), null);
    }
    
    const ip = JSON.parse(body).ip;
    callback(null, ip);
  });
};

/**
 * Function accepts the IP from earlier function and returns the latitude and longitude for it
 * @param {string} ip
 * @param {function} callback
 * @returns Geo coordinates
 */
const fetchCoordsByIp = function(ip, callback) {
  const url = `http://ipwho.is/${ip}`;

  request(url, (error, response, body) => {
    if (error) {
      return callback(error, null);
    }

    const parsedBody = JSON.parse(body);

    if (!parsedBody.success) {
      const msg = `It didn't work! Error: Success status was ${parsedBody.success}. Server message says: ${parsedBody.message} when fetching for IP ${parsedBody.ip}`;
      return callback(Error(msg), null);
    }

    const longitude = parsedBody.longitude;
    const latitude = parsedBody.latitude;

    const geoLocation = {
      latitude,
      longitude
    };

    callback(null, geoLocation);
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  const url = `https://iss-flyover.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`;

  request(url, (error, response, body) => {
    if (error) {
      return callback(error, null);
    }

    if (body === "invalid coordinates" || response.statusCode !== 200) {
      const msg = `You have entered invalid coordinates ${body}, with status code ${response.statusCode}`;
      return callback(Error(msg), null);
    }

    const parsedBody = JSON.parse(body);
    const fliesOver = parsedBody.response;
    callback(null, fliesOver);
  });
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results.
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function(callback) {
  fetchMyIP((error, ip) => {
    if (error) {
      return callback(error, null);
    }

    fetchCoordsByIp(ip, (error, location) => {
      if (error) {
        return callback(error, null);
      }

      fetchISSFlyOverTimes(location, (error, flyOver) => {
        if (error) {
          return callback(error, null);
        }

        callback(null, flyOver);
      });
    });
  });
};

module.exports = { nextISSTimesForMyLocation };