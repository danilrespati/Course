const btn = document.getElementById('btn');

btn.addEventListener('click', () => changeBackgroundColor())

function changeBackgroundColor() {
    const hue = Math.floor(Math.random() * 360);
    document.body.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
}