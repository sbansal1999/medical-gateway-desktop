window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const {ipcRenderer} = require('electron');
const firebase = require('firebase');
let imageCaptured = false;

function firebaseInit() {
    let key = require('../assets/firebase-admin-private-key.json');

    admin.initializeApp({
        credential: admin.credential.cert(key),
        databaseURL: 'https://medical-gateway-296507.firebaseio.com/'
    });
}

function init() {
    attachCamera();
    firebaseInit();


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
    setSpinnerState(true);

    const patientDetails = getPatientDetails();

    addPatient(patientDetails);

    console.log("details are");
    console.log(patientDetails);

    function getPatientDetails() {
        return {
            displayName: retrieveTextFromID('pName'),
            phoneNum: retrieveTextFromID('pMobNum'),
            //TODO  photoURL: document.querySelector('#camera')
            email: retrieveTextFromID('pEmailAddress'),
            address: retrieveTextFromID('pAddress'),
            dob: retrieveTextFromID('pDOB'),
            id: generatePatientID(),

        }
    }
}

/**
 * Adds Patient to the Firebase Auth as well as Realtime DB using Firebase Functions
 */
function addPatient(details) {
    let email;
    let toCreate = true;

    //Performs Email Check
    admin.database()
         .ref("patients_info")
         .orderByChild('emailAddress')
         .equalTo(details.email)
         .once('value')
         .then((snapshot) => {
                 if (snapshot.exists()) {
                     showToast("Email Already Registered 1"+ toCreate);
                     toCreate = false;
                     console.log(toCreate);
                 }
             }
         )
         .catch((error) => {
             console.log(error);
         });

    if (toCreate === true) {
        admin.auth()
             .createUser({
                 email: details.email,
                 phoneNumber: "+91" + details.phoneNum,
                 displayName: details.pName,
             })
             .then((user) => {
                 addIntoDatabase(details, user.uid);
                 console.log("User Created" + user.uid);
             })
             .catch((error) => {
                 if (error.code === "auth/email-already-exists") {
                     showToast("Email Already Registered");
                 } else if (error.code === "auth/phone-number-already-exists") {
                     showToast("Mobile Number Already Registered");
                 } else {
                     showToast("Something has gone wrong. Contact Support");
                 }
             });
        setSpinnerState(false);
    }

}

function uploadImage() {

}

/**
 * Method that generates patientID, that is later stored in the Realtime Database.
 * @return {string} The generated ID
 */
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

/**
 * Adds the sent data into Firebase Realtime Database
 * @param {any} data The Personal Details of the user
 * @param {string }uid The UID created by Firebase Auth
 */
function addIntoDatabase(data, uid) {
    // Creates the Desired OBJ from the sent data
    const date = data.dob;
    const newDate = date.substring(8) +
        "-" + date.substring(5, 7) +
        "-" + date.substring(0, 4);

    const obj = {
        "dob": newDate,
        "emailAddress": data.email,
        "name": data.displayName,
        "patientID": data.id,
        "phone": data.phoneNum,
        "residentialAddress": data.address,
    };

    const dbRef = admin.database()
                       .ref("patients_info");

    const snap = dbRef.child(uid)
                      .set(obj);
    // Adds the obj to the Firebase Realtime Database
    snap.then(() => {
        console.log("Data Inserted");
        showToast("Patient Added Successfully");
    })
        .catch((error) => {
            console.log("error" + error);
        })

}

/**
 * Method that modifies the state of the spinner according to the given
 * @param state either true or false
 */
function setSpinnerState(state) {
    const prg = document.querySelector('#registerProgressBar');
    if (state === true) {
        prg.classList.add('is-active');
    } else {
        prg.classList.remove('is-active');
    }

}
