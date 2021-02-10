let userScore = 0;
let computerScore = 0;
const userScore_span = document.getElementById("user-score");
const computerScore_span = document.getElementById("computer-score");
const scoreBoard_div = document.querySelector(".score-board");
const result_p = document.querySelector(".result > p");
const rock_div = document.getElementById("r");
const paper_div = document.getElementById("p");
const scissors_div = document.getElementById("s");
const choices = {
    'r': 'Rock',
    'p': 'Paper',
    's': 'Scissors',
}

function getComputerChoice() {
    const keys = Object.keys(choices);
    return keys[Math.floor(Math.random() * 3)];
}

function win(userChoice, computerChoice) {
    const userChoice_div = document.getElementById(userChoice);
    const glow = 'green-glow';
    userScore++;
    userScore_span.innerHTML = userScore;
    result_p.innerHTML = `😃${choices[userChoice]} beats ${choices[computerChoice]}🤖`;
    scoreBoard_div.classList.add(glow);
    userChoice_div.classList.add(glow);
    setTimeout(() => {
        scoreBoard_div.classList.remove(glow);
        userChoice_div.classList.remove(glow);
    }, 300)
}

function lose(userChoice, computerChoice) {
    const userChoice_div = document.getElementById(userChoice);
    const glow = 'red-glow';
    computerScore++;
    computerScore_span.innerHTML = computerScore;
    result_p.innerHTML = `😠${choices[userChoice]} lose to ${choices[computerChoice]}🤖`;
    scoreBoard_div.classList.add(glow);
    userChoice_div.classList.add(glow);
    setTimeout(() => {
        scoreBoard_div.classList.remove(glow);
        userChoice_div.classList.remove(glow);
    }, 300)
}

function draw(userChoice, computerChoice) {
    const userChoice_div = document.getElementById(userChoice);
    const glow = 'gray-glow';
    result_p.innerHTML = `😐${choices[userChoice]} draws ${choices[computerChoice]}🤖`;
    scoreBoard_div.classList.add(glow);
    userChoice_div.classList.add(glow);
    setTimeout(() => {
        scoreBoard_div.classList.remove(glow);
        userChoice_div.classList.remove(glow);
    }, 300)
}

function game(userChoice) {
    const computerChoice = getComputerChoice()
    switch (userChoice + computerChoice) {
        case "rs":
        case "pr":
        case "sp":
            win(userChoice, computerChoice);
            break;
        case "rp":
        case "ps":
        case "sr":
            lose(userChoice, computerChoice);
            break;
        case "rr":
        case "pp":
        case "ss":
            draw(userChoice, computerChoice);
            break;
    }
}

function main() {
    rock_div.addEventListener('click', () => game('r'));
    paper_div.addEventListener('click', () => game('p'));
    scissors_div.addEventListener('click', () => game('s'));
}

main();