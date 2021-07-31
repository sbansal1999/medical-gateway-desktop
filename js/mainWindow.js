window.addEventListener('load', init);
const fs = require('fs');
const path = require('path');

window.addEventListener('message', (evt) => {
        const userName = evt.data.userName;
        const email = evt.data.email;

        loginMessageReceived(userName, email);
    }
);

function init() {
    const dir = path.resolve();
    const filePath = path.join(dir + '/assets/login');

    const data = fs.readFileSync(filePath, {encoding: 'utf-8'});
    const index = data.indexOf("\n");

    loginMessageReceived(data.substring(0, index), data.substring(index, data.length));
}

function addLinkWithSubLinks(title, ...titleOfButtonsInside) {
    let htmlTagToAdd = "<details>";
    htmlTagToAdd += '<summary class="mdl-navigation__link\">' + title + '</summary>';
    titleOfButtonsInside.forEach((value => {
        htmlTagToAdd += '<a class="mdl-navigation__link " href="' + getHTMLFileName(value) + '.html" target="main-content">' + value + '</a>';
    }));
    htmlTagToAdd += "</details>";
    document.querySelector("#navigationMenu").innerHTML += htmlTagToAdd;
}

function getHTMLFileName(subLink) {
    // Copied From Here : https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
    return subLink.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function loginMessageReceived(userName, email) {
    //TODO maybe later add some kind of a welcome screen
    document.querySelector("#mainIframe")
        .setAttribute('src', 'about:blank');

    clearNavMenu();
    addLinkWithSubLinks("Patients", "Add Patients", "Patients Added Today", "Manage Patients", "Manage Appointments", "Upload Reports");
    addLinkWithSubLinks("Doctors", "Enroll Doctor");
    addLinkWithSubLinks("Pharmacy", "Add Medicines");
    // addLinkWithSubLinks("Doctors", "Enroll Doctor", "Manage Doctors");
    // addLinkWithSubLinks("Pharmacy", "Add Medicines", "Manage Medicines");
    // addLinkWithSubLinks("Staff", "Add Staff", "Modify Staff Details");

    let helloTitle = document.querySelector('#helloTitle');
    helloTitle.innerHTML += ' ' + userName;
    helloTitle.classList
        .remove('invisible');
    helloTitle.classList
        .add('visible');
}

function addLinkInNavMenu(title) {
    document.querySelector('#navigationMenu').innerHTML +=
        '<a class="mdl-navigation__link"  target="main-content">' + title + '</a>'

}

function clearNavMenu() {
    document.querySelector('#navigationMenu').innerHTML = '';
}





