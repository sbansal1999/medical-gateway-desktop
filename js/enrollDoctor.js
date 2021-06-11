// TODO Store Sunday as 0 Monday as 1...
window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const dbChild = 'doctors_info';
const firebase = require('firebase');

function init() {
    firebaseAdminInit();
    firebaseInit();

    document.querySelector('#enroll')
            .addEventListener('click', (() => {
                let isValid = document.querySelector('#inputForm')
                                      .checkValidity();
                if (isValid === true) {
                    submitForm();
                } else {
                    showToast("Form not filled completely");
                    //TODO add some possible exceptions here
                }
            }));

    let inputElement = document.querySelector('#uploadImg');
    inputElement.onchange = function (evt) {
        let fileList = inputElement.files;
        document.querySelector('#output').src = URL.createObjectURL(fileList[0]);

        console.log(fileList[0].name);

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
    showToast("Registering");

    const docDetails = getDocDetails();
    console.log(docDetails);

    addDoc(docDetails);

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

/**
 * Adds Doctor to the Firebase Auth as well as Realtime DB using Firebase Admin SDK
 * @param {any} details The object containing Doctor's Info
 */
function addDoc(details) {
    //Performs Email Check

    admin.database()
         .ref(dbChild)
         .orderByChild('emailAddress')
         .equalTo(details.email)
         .once('value')
         .then((snapshot) => {
                 if (snapshot.exists()) {
                     showToast("Email Already Registered 1");
                 } else {
                     admin.auth()
                          .createUser({
                              email: details.email,
                              phoneNumber: "+91" + details.phoneNum,
                              displayName: details.displayName,
                          })
                          .then((user) => {

                              // const imgURL = uploadImg(user.uid);
                              // if (imgURL !== null) {
                              //     user.photoURL = imgURL;
                              // }

                              addIntoDatabase(details, user.uid);
                              //TODO add photo url in DB entry as well
                          })
                          .catch((error) => {
                              switch (error.code) {
                                  case "auth/email-already-exists":
                                      showToast("Email Already Registered");
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
                                      console.log(error.code);
                                      break;
                              }
                          });
                 }
             }
         )
         .catch((error) => {
             showToast("Some Error Occurred");
         });
}

function uploadImg(uid) {
    let imgTag = document.querySelector('#output');

    fetch(imgTag.src)
    .then(res => res.blob())
    .then((image) => {
        console.log("size" + image.size);

        const strRef = firebase.storage()
                               .ref()
                               .child(uid)
                               .child('profile_pic.jpg');

        const metaData = {
            contentType: 'image/jpeg'
        };

        strRef.put(image)
              .then((snap) => {

                  strRef.updateMetadata(metaData)
                        .then(() => {
                            console.log('updated');
                        });

                  strRef.getDownloadURL()
                        .then((snap) => {
                            console.log("url");
                            console.log(snap);
                            return snap;
                        })
                        .catch((err) => {
                        });

                  console.log("File Uploaded Successfully");
              })
              .catch((err) => {
                  console.log("Error");
              });
    });

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
        "doctorID": data.id,
        "phone": data.phoneNum,
        "residentialAddress": data.address,
        "gender": data.gender,
        "speciality": data.speciality,
        "available": data.available,
    };

    const dbRef = admin.database()
                       .ref(dbChild);

    const snap = dbRef.child(uid)
                      .set(obj);

    snap.then(() => {
        showToast("Doctor Enrolled Successfully");
    })
        .catch((error) => {
            showToast("Some error occurred. Contact Support for more info");
        });
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

function resetForm() {
    document.querySelector('#inputForm')
            .reset();
}

function getAvailable() {
    let days = [];
    let index = 0;
    for (let i = 1; i <= 7; i++) {
        const id = '#switch-' + i;
        const elm = document.querySelector(id);

        if (elm.checked) {
            days[index] = i - 1;
            index++;
        }
    }

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

    return id;
}
