const btn = document.getElementById('btn');
const notificationContainer = document.getElementById('notification-container');
btn.addEventListener('click', () => {
    createToastNotification();
})

function createToastNotification() {
    const notification = document.createElement('div');
    notification.classList.add('toast');
    notification.innerText = "Toast notification is working properly!";

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000)
}