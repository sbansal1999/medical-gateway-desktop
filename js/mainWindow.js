window.addEventListener('message', (evt) => {
        const userName = evt.data.userName;
        const email = evt.data.email;

        loginMessageReceived(userName, email);
    }
);

function loginMessageReceived(userName, email) {
    clearNavMenu();
    addLinkInNavMenu('Patients');
    addLinkInNavMenu('Doctors');
    addLinkInNavMenu('Staff');
    addLinkInNavMenu('Profile');

    document.querySelector('#helloTitle').innerHTML += ' ' + userName;
    document.querySelector('#helloTitle')
            .classList
            .remove('invisible');
    document.querySelector('#helloTitle')
            .classList
            .add('visible');
}

function addLinkInNavMenu(title) {
    document.querySelector('#navigationMenu').innerHTML +=
        '<a class="mdl-navigation__link"  target="main-content">' + title + '</a>'

}

function clearNavMenu() {
    document.querySelector('#navigationMenu').innerHTML = '';
}





