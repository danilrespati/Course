const text = "🔥 I want to be a Fullstack Developer! 🔥";

let index = 0;
console.log(text);
function writeText()  {
    document.body.innerText = text.slice(0, index);
    index++;
    if (index > text.length) {
        setTimeout(() => index = 0, 1000)
    }
}

setInterval(writeText, 100);
