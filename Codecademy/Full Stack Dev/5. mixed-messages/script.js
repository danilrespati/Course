const fs = require('fs');

const quote_p = document.getElementById('quote');
const author_span = document.getElementById('author');

// Read csv file
fs.readFile('./quotes.csv',function (err,data) {
  // Error check
  if (err) throw err;
  // Split individual (divided by newline) item into an array
  const quoteArr = data.toString().split('\n');
  // Pick one random quote
  let randomIndex = Math.floor(Math.random() * (quoteArr.length - 1)) + 1;
  const randomQuote = quoteArr[randomIndex];
  console.log(randomQuote);

  // Remove the first and last \" from string using slice, then split it
  let splitted = randomQuote.slice(1, -2).split('","');
  // let quote = '“ ' + splitted[1] + ' ”';
  let quote = splitted[1];
  let author = '—' + splitted[0];
  while(!author) {
    randomIndex--;
    splitted = quoteArr[randomIndex].slice(1, -2).split('","');
    author = splitted[0];
  }
  quote_p.innerText = quote;
  author_span.innerText = author;
  console.log(`${author}\n${quote}`);
});