const fs = require('fs');

// Read csv file
fs.readFile('quotes.csv',function (err,data) {
  // Error check
  if (err) throw err;
  // Split individual (divided by newline) item into an array
  const quoteArr = data.toString().split('\n');
  // Pick one random quote
  const randomQuote = quoteArr[Math.floor(Math.random() * (quoteArr.length - 1)) + 1];
  extractQuote(randomQuote);
});

function extractQuote(str) {
  // Remove the first and last \" from string using slice, then split it
  const splitted = str.slice(1, -2).split('","')
  const author = splitted[0];
  const quote = splitted[1];
  console.log(`${author}\n${quote}`);
}