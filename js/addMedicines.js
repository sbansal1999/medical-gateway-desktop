window.addEventListener('load', init);
const require = parent.require;
const {dialog} = require('electron');
const admin = require('firebase-admin');
const firebase = require('firebase');
const {ipcRenderer} = require('electron');
const dbChild = 'medicine_info';

function init() {
    firebaseAdminInit();
    firebaseInit();

    // (async () => {
    //     const test = await ipcRenderer.invoke('show-dialog', {
    //         type: 'warning',
    //         title: 'Proceed?',
    //         message: 'No Image has been uploaded are you sure you want to proceed?',
    //         buttons: ["Yes", "No"],
    //     });
    //     console.log(test);
    // })();

    document.querySelector('#addMedicine')
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

    let inputElement = document.querySelector('#uploadImg');
    inputElement.onchange = function (evt) {
        let fileList = inputElement.files;
        document.querySelector('#output').src = URL.createObjectURL(fileList[0]);
    };

    document.querySelector('#reset')
            .addEventListener('click', () => {
                resetForm();
            });

}

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

function submitForm() {
    showToast("Adding Medicine");

    const medDetails = getMedDetails();
    console.log(medDetails);

    addMed(medDetails, retrieveTextFromID('medID'));

    function getMedDetails() {
        return {
            name: retrieveTextFromID('name'),
            unit: retrieveTextFromID('unit'),
            price: retrieveTextFromID('price'),
            mfgBy: retrieveTextFromID('mfgBy'),
            quantity: retrieveTextFromID('quantity'),
            category: retrieveTextFromID('category')
        }
    }

}

function addIntoDatabase(data, id) {
    const dbRef = admin.database()
                       .ref(dbChild);

    const snap = dbRef.child(id)
                      .set(data);

    snap.then(() => {
        showToast("Medicine Added Successfully");
    })
        .catch((err) => {
            showToast("Error Occurred");
        });


}

function addMed(medDetails, id) {

    admin.database()
         .ref(dbChild)
         .child(id)
         .once('value')
         .then((snap) => {
             if (snap.exists()) {
                 showToast("Medicine is Already Added");
             } else {
                 uploadImg(id);

                 addIntoDatabase(medDetails, id);
             }

         })
         .catch((err) => {
             console.log('err');
             console.log(err);
         });


}

function uploadImg(id) {
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
                                       .child('medicines')
                                       .child(id)
                                       .child('photo.jpg');

                const metaData = {
                    contentType: 'image/jpeg'
                };

                strRef.put(data)
                      .then(() => {

                          strRef.updateMetadata(metaData)
                                .then();

                          strRef.getDownloadURL()
                                .then((snap) => {
                                    const rootRef = firebase.database().ref();

                                    rootRef.child(dbChild)
                                           .child(id)
                                           .update({
                                               photoURL: snap,
                                           })
                                           .then();
                                });
                      });
            }
        });
    }
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

function resetForm() {
    document.querySelector('#inputForm')
            .reset();
}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message
        }
    );
}
