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

module.exports = { generateRandomString };
