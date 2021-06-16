window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const firebase = require('firebase');
const {ipcRenderer} = require('electron');
const dbChild = 'medicine_info';

//File limit size of 500 KiloBytes
const sizeLimit = 1024 * 500;
let imageSelected = false;

function init() {
    firebaseAdminInit();
    firebaseInit();
    fetchList();

    document.querySelector('#addMedicine')
            .addEventListener('click', (() => {
                let isValid = document.querySelector('#inputForm')
                                      .checkValidity();
                if (isValid === true && imageSelected === true) {
                    submitForm();
                } else if (imageSelected !== true) {
                    showToast("Kindly Upload an Image First")
                } else {
                    showToast("Kindly fill the form completely");
                    //TODO add some possible exceptions here
                }
            }));

    let inputElement = document.querySelector('#uploadImg');
    inputElement.onchange = function (evt) {
        let selectedFile = inputElement.files[0];

        //Restricts the size of image that can be selected
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

function fetchList() {
    clearTable();

    const rootRef = admin.database()
                         .ref();

    rootRef.child(dbChild)
           .limitToLast(5)
           .once('value')
           .then((snapshot) => {
               if (snapshot.exists()) {
                   snapshot.forEach((snap) => {
                       addDataToTable(snap.key, snap.val());
                   });
               } else {
                   //No Medicines are Currently Registered
               }
           })
           .catch((err) => {
               console.log(err);
           });

    function clearTable() {
        const table = document.querySelector('#medTableTBody');
        table.innerHTML = '';
    }

    function addDataToTable(id, val) {
        const table = document.querySelector('#medTableTBody');

        let row = table.insertRow(-1);
        row.insertCell(0).innerHTML = id;
        row.insertCell(1).innerHTML = val.name;
        row.insertCell(2).innerHTML = val.category;
        row.insertCell(3).innerHTML = val.price;
    }
}

function submitForm() {
    showToast("Adding Medicine");

    const medDetails = getMedDetails();
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
                 showToast("Medicine with Same ID is Already Added");
             } else {
                 uploadImg(id);
                 addIntoDatabase(medDetails, id);
             }

         })
         .catch((err) => {
             console.log('err');
             console.log(err);
         });

    // function showImageNotSelectedWindow() {
    //     if (imageSelected === true) {
    //         uploadImg(id);
    //     } else {
    //         //Makes a call to ipcMain defined in main.js to show a dialog seeking confirmation
    //         (async () => {
    //             let response = await ipcRenderer.invoke('show-dialog', {
    //                 type: 'warning',
    //                 title: 'Proceed?',
    //                 message: 'No Image has been uploaded are you sure you want to proceed?',
    //                 buttons: ["Yes", "No"],
    //             });
    //             gotResponse(response);
    //         })();
    //     }
    //
    // }

}

/**
 * Uploads the image to the Firebase Storage as well as adds the reference to the Entry in the Database
 * @param id ID of the medicine
 */
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
                                    const rootRef = firebase.database()
                                                            .ref();

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
    if (id === 'medID') {
        return 'M' + document.querySelector('#' + id)
            .value
    }
    return document.querySelector('#' + id)
        .value;
}

function resetForm() {
    document.querySelector('#inputForm')
            .reset();
    document.querySelector('#output').src = '';
    document.querySelector('#output')
            .classList
            .add('hide');
}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message
        }
    );
}
