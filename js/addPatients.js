window.addEventListener('load', init);
const require = parent.require;
const {ipcRenderer} = require('electron');
const admin = require('firebase-admin');
let imageCaptured = false;
const CHILD_NAME = 'patients_info'

function firebaseInit() {
    //Can create new service accounts from https://console.cloud.google.com/iam-admin/serviceaccounts?authuser=1&project=medical-gateway-296507

    let key = require('../assets/firebase-admin-private-key.json');

    admin.initializeApp({
        credential: admin.credential.cert(key),
        databaseURL: 'https://medical-gateway-296507.firebaseio.com/'
    });

}

function init() {
    firebaseInit();

    attachCamera();

    let captureImageButton = document.querySelector("#captureImage");
    captureImageButton.addEventListener('click', captureImage);
    captureImage('first');

    let retakeImage = document.querySelector('#retakeImage');
    retakeImage.addEventListener('click', (e) => {
        attachCamera();
        retakeImage.disabled = true;
        captureImageButton.disabled = false;
        imageCaptured = false;
    });
    retakeImage.disabled = true;

    document.querySelector('#register')
            .addEventListener('click', (evt => {
                let isValid = document.querySelector('#inputForm')
                                      .checkValidity();
                if (isValid === true) {
                    submitForm();
                } else {
                    showToast("Form not filled completely");
                    //TODO add some possible exceptions here
                }
            }));
}

function submitForm() {
    const patientDetails = getPatientDetails();

    console.log(patientDetails);

    //Adding User into Firebase Auth
    admin.auth()
         .createUser(patientDetails)
         .then((userRecord) => {
             console.log('success' + userRecord.uid);
             addIntoDatabase(patientDetails, userRecord.uid);
         })
         .catch((error) => {
             console.log('oops' + error);
         });

    //Adds Data of the Patient in the Firebase Realtime-Database
    function addIntoDatabase(patientDetails, uid) {
        const rootRef = admin.database()
                             .ref();
        const childRef = rootRef.child(CHILD_NAME)
                                .child(uid);

        childRef.set(patientDetails)
                .then(r => {

                });
    }

    function getPatientDetails() {
        return {
            name: retrieveTextFromID('pName'),
            phoneNum: retrieveTextFromID('pMobNum'),
            // photoURL: document.querySelector('#camera')
            email: retrieveTextFromID('pEmailAddress')
        }
    }
}

function generatePatientID() {
    let id = '';
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

    let sec = now.getUTCSeconds();
    sec = checkLengthAndAddZero(sec.toString(), 1);
    id += sec;

    let mSec = now.getUTCMilliseconds();
    mSec = checkLengthAndAddZero(mSec.toString(), 1);
    id += mSec;

    return id;

}

function checkLengthAndAddZero(string, length) {
    if (string.length === length) {
        console.log('added' + string);
        return '0' + string;
    }
    return string;
}

function retrieveTextFromID(id) {
    return document.querySelector('#' + id)
        .value;
}

function attachCamera() {
    Webcam.set({
        width: 400,
        height: 250,
        image_format: 'jpeg',
        jpeg_quality: 100
    });

    Webcam.attach('#camera');
    Webcam.on('error', () => {
        console.log("Loading");
        //TODO add a loading image while the camera is still loading, image is in assets folder
    });
}

function captureImage(msg) {
    Webcam.snap((data_uri) => {
        //Disables Camera and sets the Captured Image instead of it
        console.log("here");
        Webcam.reset('#camera');

        document.querySelector('#camera').innerHTML += '<img alt="Error" src="' + data_uri + '"/>';
    });

    if (msg !== 'first') {
        document.querySelector("#captureImage").disabled = true;
        imageCaptured = true;
    }
    document.querySelector('#retakeImage').disabled = false;
}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message
        }
    );
}
