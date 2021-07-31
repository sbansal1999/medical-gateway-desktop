window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const firebase = require('firebase');
const dbChild = 'patients_info';
//File limit size of 500 KiloBytes
const sizeLimit = 1024 * 500;

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
}

/**
 * Method that retrieves data of patients that are registered today
 */
function fetchTodayList() {
    showToast("Fetching Patient Data");

    const rootRef = admin.database()
        .ref();

    const today = generatePatientID()
        .substring(0, 8);

    rootRef.child('patients_info')
        .orderByChild('patientID')
        .startAt(today)
        .endAt(today + '\uf8ff')
        .limitToLast(40)
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((snap) => {
                    addDataToTable(snap.val());
                });
            } else {
                //No User Registered Today
                showToast("No Patients Have Registered Today");

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
