window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const firebase = require('firebase');
const dbChild = 'patients_info';
//File Size Limit of 20 Mega Bytes
const sizeLimit = 1024 * 1024 * 20;

function init() {
    showToast("message");
    firebaseAdminInit();
    firebaseInit();

    let inputElement = document.querySelector('#selectReport');
    let reportSelected = false;
    document.querySelector('#selectReport')
            .addEventListener('click', () => {
                inputElement.click();
            });

    inputElement.onchange = function () {
        let selectedFile = inputElement.files[0];

        if (selectedFile.size < sizeLimit) {
            reportSelected = true;
            document.querySelector('#heading')
                    .classList
                    .add('hide');
            document.querySelector('#pdfHolder').src = selectedFile.path;
        } else {
            showToast("Selected File Exceeds the File Limit of " + sizeLimit / (1024 * 1024) + " MB");
        }
    };

    document.querySelector('#uploadReport')
            .addEventListener('click', () => {
                console.log(reportSelected);
                uploadReport(reportSelected);
            });

}

function uploadReport(fileSelected) {
    if (fileSelected === true) {
        showToast("Uploading Report");
        const patientID = document.querySelector('#patientID')
                                  .value
                                  .trim();
        const date = document.querySelector('#reportDate').value;

        if (patientID !== '' && date !== '') {
            let inputElement = document.querySelector('#selectReport');
            const filePath = inputElement.files[0].path;

            if (filePath !== null) {
                const fs = require('fs');

                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.log("err in fs");
                        console.log(err);
                    } else {
                        const rootRef = firebase.database()
                                                .ref();

                        rootRef.child(dbChild)
                               .orderByChild('patientID')
                               .equalTo(patientID)
                               .once('value')
                               .then((snapshot) => {
                                   if (snapshot.exists()) {
                                       let uid;

                                       snapshot.forEach((snap) => {
                                           uid = snap.key;
                                       });

                                       let childNum = snapshot.child(uid)
                                                              .child('reports')
                                                              .numChildren();

                                       console.log(childNum);

                                           const strRef = firebase.storage()
                                                                  .ref()
                                                                  .child(uid)
                                                                  .child('reports')
                                                                  .child(childNum + '.pdf');

                                           const metaData = {contentType: 'application/pdf'};


                                           strRef.put(data)
                                                 .then(() => {
                                                     strRef.updateMetadata(metaData)
                                                           .then();

                                                     strRef.getDownloadURL()
                                                           .then((snap) => {
                                                               rootRef.child(dbChild)
                                                                      .child(uid)
                                                                      .child('reports')
                                                                      .child(childNum + '')
                                                                      .update({
                                                                          reportDate: date,
                                                                          reportURL: snap
                                                                      })
                                                                      .then(() => {
                                                                          showToast("Reported Added Successfully");
                                                                      });
                                                           });
                                                 });
                                       } else {
                                           showToast("Kindly Recheck the Patient ID");
                                   }

                               });


                    }
                });
            }

        } else if (patientID === '') {
            showToast("Kindly Enter the ID of the patient");
        } else {
            showToast("Kindly Enter the Report Date");
        }
    } else {
        showToast("Kindly Select a Report First");
    }

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

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message,
        }
    );
}


