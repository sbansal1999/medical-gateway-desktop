// TODO Store Sunday as 0 Monday as 1...
window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');

function firebaseInit() {
    let key = require('../assets/firebase-admin-private-key.json');

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(key),
            databaseURL: 'https://medical-gateway-296507.firebaseio.com/'
        });
    }
}

function init() {
    firebaseInit();

    document.querySelector('#enroll')
            .addEventListener('click', (() => {
                generateDocID();
                let isValid = document.querySelector('#inputForm')
                                      .checkValidity();
                if (isValid === true) {
                    submitForm();
                } else {
                    showToast("Form not filled completely");
                    //TODO add some possible exceptions here
                }
            }));

    document.querySelector('#reset')
            .addEventListener('click', () => {
                resetForm();
            });
}

function submitForm() {
    showToast("Registering");

    const docDetails = getDocDetails();
    console.log(docDetails);

    // addDoc(docDetails);

    function getDocDetails() {
        return {
            displayName: retrieveTextFromID('name'),
            phoneNum: retrieveTextFromID('mobNum'),
            email: retrieveTextFromID('emailAddress'),
            address: retrieveTextFromID('address'),
            dob: retrieveTextFromID('DOB'),
            id: generateDocID(),
            gender: getGender(),
            speciality: getSpeciality(),
            available: getAvailable()

        }
    }
}

function getAvailable() {
    let days = [];
    let index = 0;
    for (let i = 1; i <= 7; i++) {
        const id = '#switch-' + i;
        const elm = document.querySelector(id);
        console.log(id);

        if (elm.checked) {
            days[index] = i - 1;
            index++;
        }
    }

    console.log(days);
    return days;
}

function getGender() {
    return document.querySelector('#gender').value;
}

function getSpeciality() {
    return document.querySelector('#speciality').value;
}

function generateDocID() {
    let id = 'DOC';
    const now = new Date();

    //Adds last 2 digits of the year
    id += now.getUTCFullYear()
             .toString()
             .substr(-2);

    //Month starts from 0
    let month = now.getUTCMonth() + 1;
    month = checkLengthAndAddZero(month.toString(), 1);
    id += month;

    let date = now.getDate();
    date = checkLengthAndAddZero(date.toString(), 1);
    id += date + '/';

    let hours = now.getUTCHours();
    hours = checkLengthAndAddZero(hours.toString(), 1);
    id += hours;

    let min = now.getUTCMinutes();
    min = checkLengthAndAddZero(min.toString(), 1);
    id += min;

    console.log(id);
}

function checkLengthAndAddZero(string, length) {
    if (string.length === length) {
        return '0' + string;
    }
    return string;
}

function retrieveTextFromID(id) {
    return document.querySelector('#' + id)
        .value;
}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message
        }
    );
}

function resetForm() {
    document.querySelector('#inputForm')
            .reset();
}