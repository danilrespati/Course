const btn = document.getElementById('btn');

btn.addEventListener('click', () => darkModeToggle());

function darkModeToggle() {
    document.body.classList.toggle('dark');
    btn.classList.toggle('dark');
}