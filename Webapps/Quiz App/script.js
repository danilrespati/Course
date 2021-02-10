const quizData = [
    {
        question: 'How many Earths could fit inside the sun?',
        a: '3',
        b: '1.300',
        c: '1.3 million',
        d: '2 billion',
        ans: 'c'
    }, {
        question: 'Which country consumes the most chocolate per capita?',
        a: 'Switzerland',
        b: 'Indonesia',
        c: 'Mexico',
        d: 'U.S',
        ans: 'a'
    }, {
        question: 'In which country was the largest-known Tyrannosaurus rex skeleton found?',
        a: 'Finland',
        b: 'Cuba',
        c: 'Namibia',
        d: 'Canada',
        ans: 'd'
    }, {
        question: 'After Antarctica, what is the most sparsely populated continent?',
        a: 'Uruguay',
        b: 'Australia',
        c: 'Egypt',
        d: 'Laos',
        ans: 'b'
    }, {
        question: 'What is the smallest bone in the human body?',
        a: 'Pelvic',
        b: 'Femur',
        c: 'Stapes',
        d: 'Scapula',
        ans: 'c'
    }, {
        question: 'What is the loudest animal on Earth?',
        a: 'Sperm Whale',
        b: 'African Elephant',
        c: 'Owa Monkey',
        d: 'Bulldog Bat',
        ans: 'a'
    }, {
        question: 'How many trees are there on Earth?',
        a: '3 million',
        b: '3 billion',
        c: '3 trillion',
        d: '3 quadrillion',
        ans: 'c'
    }
];

const quizEl = document.getElementById('quiz')
const questionEl = document.getElementById('question');
const answerEls = document.getElementsByName('answer');
const a_text = document.getElementById('a_text');
const b_text = document.getElementById('b_text');
const c_text = document.getElementById('c_text');
const d_text = document.getElementById('d_text');
const submitBtn = document.getElementById('submit');

let currentQuiz = 0;
let score = 0;

function deselectAnswer() {
    answerEls.forEach((answerEl) => {
        answerEl.checked = false;
    })
}
function loadQuiz() {
    deselectAnswer();
    const currentQuizData = quizData[currentQuiz];

    questionEl.innerText = currentQuizData.question;
    a_text.innerText = currentQuizData.a;
    b_text.innerText = currentQuizData.b;
    c_text.innerText = currentQuizData.c;
    d_text.innerText = currentQuizData.d;
}

function getAnswer() {
    let answer = undefined;
    answerEls.forEach((answerEl) => {
        if(answerEl.checked) {
            answer = answerEl.id
        }
    })
    return answer;
}

loadQuiz();

submitBtn.addEventListener("click", () => {
    const answer = getAnswer();
    if(answer) {
        if(answer === quizData[currentQuiz].ans) {
            score++;
        }

        currentQuiz++;
        if(currentQuiz < quizData.length) {
            loadQuiz();
        } else {
            quizEl.innerHTML = 
            `<h2>You answered correctly at ${score}/${quizData.length} question</h2>
            <button onclick=location.reload();>Reload</button>`
        }
    }
    if(!answer) {
        alert("You need to choose an answer!")
    }
})