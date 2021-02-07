const btn = document.getElementById('btn');
const container = document.getElementById('container');
const popupBtn = document.getElementById('popup-btn');
btn.addEventListener('click', () => {
    container.classList.add('active');
})
popupBtn.addEventListener('click', () => {
    container.classList.remove('active');
})