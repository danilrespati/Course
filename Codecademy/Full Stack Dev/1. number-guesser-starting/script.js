let humanScore = 0;
let computerScore = 0;
let currentRoundNumber = 1;

// Write your code below:
const generateTarget = () => Math.floor(Math.random() * 10);

function compareGuesses(humanChoice, computerChoice, targetNumber) {
  if (humanChoice < 0 || humanChoice > 10) {
    alert('Value range is 0-10');
  }
  const deltaHuman = Math.abs(targetNumber - humanChoice);
  const deltaComputer = Math.abs(targetNumber - computerChoice);
  return (deltaHuman <= deltaComputer ? true : false);
}

function updateScore(winner) {
  winner === 'human' ? (humanScore += 1) : (computerScore += 1);
}

const advanceRound = () => currentRoundNumber++;

