window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const firebase = require('firebase');
const dbChild = 'patients_info';
//File limit size of 500 KiloBytes
const sizeLimit = 1024 * 500;
let imageSelected = false;

function firebaseAdminInit() {
    let key = require('../assets/firebase-admin-private-key.json');

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(key),
            databaseURL: 'https://medical-gateway-296507.firebaseio.com/'
        });
    }
}

/**
 * Initializes Firebase Settings
 */
function firebaseInit() {

    require('firebase/auth');
    require('firebase/database');
    require('firebase/functions');
    require('firebase/storage');


    const firebaseConfig = {
        //DO NOT CHANGE
        apiKey: "AIzaSyBo4fQjML7eJWQjBHYHP1Sy6OIT35DuuDo",
        authDomain: "medical-gateway-296507.firebaseapp.com",
        databaseURL: "https://medical-gateway-296507.firebaseio.com",
        projectId: "medical-gateway-296507",
        storageBucket: "medical-gateway-296507.appspot.com",
        messagingSenderId: "139008948636",
        appId: "1:139008948636:web:fe2fac7fca006a616a3059",
        measurementId: "G-F17P54B7N4"
    };

    if (firebase.apps.length === 0)
        firebase.initializeApp(firebaseConfig);
}

function init() {
    firebaseAdminInit();
    firebaseInit();
    fetchTodayList();
    fillCurrentDoc();

    //TODO add max date to today in datepicker
    document.querySelector('#register')
        .addEventListener('click', (() => {
            let isValid = document.querySelector('#inputForm')
                .checkValidity();
            if (isValid === true) {
                submitForm();
            } else {
                showToast("Kindly fill the form completely");
                //TODO add some possible exceptions here
            }
        }));

    document.querySelector('#reset')
        .addEventListener('click', () => {
            resetForm();
        });

    let inputElement = document.querySelector('#uploadImg');
    inputElement.onchange = function () {
        let selectedFile = inputElement.files[0];

        if (selectedFile.size < sizeLimit) {
            imageSelected = true;
            document.querySelector('#output')
                .classList
                .remove('hide');
            document.querySelector('#output').src = URL.createObjectURL(selectedFile);
        } else {
            showToast("Selected File Exceeds the File Limit of " + sizeLimit / 1024 + " KB");
        }
    };

    window.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            document.querySelector('#register')
                .click();
        }
    });

}

function fillCurrentDoc() {
    const list = document.querySelector('#currentDoc');

    admin.database()
        .ref('doctors_info')
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((snap) => {
                    let opt = document.createElement("option");
                    opt.text = snap.child('name')
                        .val();
                    list.add(opt);
                });
            }
        });
}

function submitForm() {
    showToast("Registering");

    const patientDetails = getPatientDetails();

    addPatient(patientDetails);

    function getPatientDetails() {
        return {
            displayName: retrieveTextFromID('pName'),
            phoneNum: retrieveTextFromID('pMobNum'),
            //TODO  photoURL: document.querySelector('#camera')
            email: retrieveTextFromID('pEmailAddress'),
            address: retrieveTextFromID('pAddress'),
            dob: retrieveTextFromID('pDOB'),
            id: generatePatientID(),
            currentDoc: retrieveTextFromID('currentDoc'),
        }
    }
}

function resetForm() {
    document.querySelector('#inputForm')
        .reset();
    document.querySelector('#output').src = '';
    document.querySelector('#output')
        .classList
        .add('hide');


}

function checkLengthAndAddZero(string, length) {
    if (string.length === length) {
        return '0' + string;
    }
    return string;
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
 * Method that retrieves data of patients that are registered today
 */
function fetchTodayList() {
    clearTable();

    const rootRef = admin.database()
        .ref();

    const today = generatePatientID()
        .substring(0, 8);

    rootRef.child('patients_info')
        .orderByChild('patientID')
        .startAt(today)
        .endAt(today + '\uf8ff')
        .limitToLast(5)
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((snap) => {
                    addDataToTable(snap.val());
                });
            } else {
                //No User Registered Today

            }
        })
        .catch(() => {

        });

    function clearTable() {
        const todayTable = document.querySelector('#todayTableTBody');
        todayTable.innerHTML = '';
    }

    function addDataToTable(val) {
        const todayTable = document.querySelector('#todayTableTBody');

        let row = todayTable.insertRow(-1);
        row.insertCell(0).innerHTML = val.patientID;
        row.insertCell(1).innerHTML = val.name;
        row.insertCell(2).innerHTML = val.phone;
        row.insertCell(3).innerHTML = val.residentialAddress;
    }
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

/**
 * Adds Patient to the Firebase Auth as well as Realtime DB using Firebase Admin SDK
 */
function addPatient(details) {
    //Performs Email Check
    admin.database()
        .ref(dbChild)
        .orderByChild('emailAddress')
        .equalTo(details.email)
        .once('value')
        .then((snapshot) => {
                if (snapshot.exists()) {
                    showToast("Email ID Already Registered");
                } else {
                    admin.auth()
                        .createUser({
                            email: details.email,
                            phoneNumber: "+91" + details.phoneNum,
                            displayName: details.displayName,
                        })
                        .then((user) => {
                            const imgURL = uploadImg(user.uid);
                            if (imgURL !== null) {
                                user.photoURL = imgURL;
                            }


                            addIntoDatabase(details, user.uid);
                        })
                        .catch((error) => {
                            switch (error.code) {
                                case "auth/email-already-exists":
                                    showToast("Email ID Already Registered");
                                    break;
                                case "auth/phone-number-already-exists":
                                    showToast("Mobile Number Already Registered");
                                    break;
                                case "auth/invalid-phone-number":
                                    showToast("Kindly recheck the Mobile Number");
                                    break;
                                case "auth/invalid-email":
                                    showToast("Kindly recheck the Email Address");
                                    break;
                                default:
                                    showToast("Something has gone wrong. Contact Support");
                                    break;
                            }
                        });
                }
            }
        )
        .catch(() => {
            showToast("Some error occurred. Contact Support for more info");
        });

}

function uploadImg(uid) {
    let inputElement = document.querySelector('#uploadImg');
    const filePath = inputElement.files[0].path;

    if (filePath !== null) {
        const fs = require('fs');

        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.log("error in fs");
            } else {
                const strRef = firebase.storage()
                    .ref()
                    .child(uid)
                    .child('profile_pic.jpg');

                const metaData = {
                    contentType: 'image/jpeg'
                };

                strRef.put(data)
                    .then(() => {

                        strRef.updateMetadata(metaData)
                            .then(() => {
                                console.log('updated');
                            });

                        //Add photo url to DB for fetching in the android app
                        strRef.getDownloadURL()
                            .then((snap) => {
                                console.log("url");
                                console.log(snap);

                                admin.auth()
                                    .updateUser(uid, {photoURL: snap,})
                                    .then(() => {
                                        console.log("user updated success");
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                        console.log("error in update");
                                    });

                                return snap;
                            })
                            .catch(() => {
                            });

                        console.log("File Uploaded Successfully");
                    })
                    .catch(() => {
                        console.log("Error");
                    });


            }
        });
    }

    return null;

}

/**
 * Adds the sent data into Firebase Realtime Database
 * @param {any} data The Personal Details of the user
 * @param {string }uid The UID generated by Firebase Auth
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
        .ref(dbChild);

    const snap = dbRef.child(uid)
        .set(obj);
    // Adds the obj to the Firebase Realtime Database
    snap.then(() => {
        showToast("Patient Added Successfully");
        fetchTodayList();
    })
        .catch(() => {
            showToast("Some error occurred. Contact Support for more info");
        })

}

/**
 * Method to retrieve text from an HTML Element using its ID
 * @param {string} id The ID of the HTML element whose text is to be fetched
 * @return {string} The Fetched Text
 */
function retrieveTextFromID(id) {
    return document.querySelector('#' + id)
        .value;
}
