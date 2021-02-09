const fs = require('fs');

const quote_p = document.getElementById('quote');
const author_span = document.getElementById('author');

function displayRandomQuote(quotesArr) {
  let randomIndex = Math.floor(Math.random() * (quotesArr.length - 1)) + 1;
  const randomQuoteStr = quotesArr[randomIndex];
  // console.log(randomQuoteStr);

  // Remove the first and last \" from string using slice, then split it
  let randomQuoteArr = randomQuoteStr.slice(1, -2).split('","');
  // let quote = '“ ' + randomQuoteArr[1] + ' ”';
  let author = randomQuoteArr[0];
  let quote = randomQuoteArr[1];
  while(!author) {
    randomIndex--;
    randomQuoteArr = quotesArr[randomIndex].slice(1, -2).split('","');
    author = randomQuoteArr[0];
  }
  author = '—' + author;

  quote_p.innerText = quote;
  author_span.innerText = author;
  quote_p.classList.remove('fade-out');
  author_span.classList.remove('fade-out');
  quote_p.classList.add('fade-in');
  author_span.classList.add('fade-in');
  setTimeout(() => {
    quote_p.classList.remove('fade-in');
    author_span.classList.remove('fade-in');
    quote_p.classList.add('fade-out');
    author_span.classList.add('fade-out');
  }, 9000);
  console.log(`${quote}\n${author}`);
}

function main() {
  // Read csv file
  fs.readFile('./quotes.csv',function (err,data) {
    // Error check
    if (err) throw err;
    // Split individual (divided by newline) item into an array
    const quotesArr = data.toString().split('\n');
    displayRandomQuote(quotesArr);
    setInterval(() => displayRandomQuote(quotesArr), 10000);
  });
}

main();