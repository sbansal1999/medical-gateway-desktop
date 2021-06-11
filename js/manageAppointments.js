window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const dbChildAppoint = 'appointment_info';
const dbChildPatients = 'patients_info';
const limitDB = 20;

function firebaseInit() {
    let key = require('../assets/firebase-admin-private-key.json');

    //Prevents Initializing of App more than once
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(key),
            databaseURL: 'https://medical-gateway-296507.firebaseio.com/'
        });
    }
}

function init() {
    firebaseInit();
    fillAppointments();

    document.querySelector("#searchButton")
            .addEventListener('click', searchPatients);

    document.querySelector("#refreshButton")
            .addEventListener('click', fillAppointments);

    window.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            searchPatients();
        }
    });
}

function fetchAppointByUID(uid) {
    const rootRef = admin.database()
                         .ref();

    rootRef.child(dbChildAppoint)
           .child(uid)
           .limitToLast(limitDB)
           .once('value')
           .then((snapshot) => {
               if (snapshot.exists()) {
                   snapshot.forEach((snap) => {
                       addDataToTable(snap.val());
                   });
               } else {
                   showToast("No Appointment Found");
               }
           });
}

function searchPatients() {
    clearTable();

    let category = document.querySelector('#searchBy').value;
    let query = document.querySelector('#searchQuery').value;

    if (query === '') {
        showToast("No Query Given");
        return;
    }

    query = query.trim();
    showToast("Searching");

    let key;
    switch (category) {
        case 'Patient ID':
            key = 'patientID';
            break;
        case 'Appointment Date':
            key = 'dateAppoint';
            break;
        case 'Preferred Doctor':
            key = 'prefDoctor';
            break;
        case 'Current Status':
            key = 'appointmentFulfilled';
            break;
        default:
            showToast("Some Error Occurred");
    }

    const rootRef = admin.database()
                         .ref();
    let uid;

    if (key === 'patientID') {
        rootRef.child(dbChildPatients)
               .orderByChild('patientID')
               .equalTo(query)
               .once('value')
               .then((snapshot) => {
                   if (snapshot.exists()) {
                       snapshot.forEach((snap) => {
                           uid = snap.key;
                           fetchAppointByUID(uid);
                       });
                   } else {
                       showToast("No Patient Found");
                   }
               });
    } else {
        rootRef.child(dbChildAppoint)
               .limitToLast(limitDB)
               .once('value')
               .then((snapshot) => {
                   snapshot.forEach((snap) => {
                       snap.ref.orderByChild(key)
                           .equalTo(query)
                           .limitToLast(limitDB)
                           .once('value')
                           .then((r) => {
                               r.forEach((e) => {
                                   addDataToTable(e.val());
                                   console.log(e.val());
                               });
                           });
                   });
               });
    }


}

function fillAppointments() {
    clearTable();
    showToast("Fetching Data");
    const rootRef = admin.database()
                         .ref();

    rootRef.child('appointment_info')
           .once('value', (snapshot) => {
               snapshot.forEach((snap) => {
                   snap.forEach((snapInside) => {
                       addDataToTable(snapInside.val());
                   });
               });
           });
}

function addDataToTable(val) {
    const table = document.querySelector('#todayTableTBody');

    const row = table.insertRow(-1);
    row.insertCell(0).innerHTML = val.patientID;
    row.insertCell(1).innerHTML = val.dateAppoint;
    row.insertCell(2).innerHTML = val.prefDoctor;

    let currentStat = val.appointmentFulfilled;

    let dataInsert;
    if (currentStat === true) {
        dataInsert = "Appointment Fulfilled";
    } else {
        dataInsert = "Not Fulfilled Yet";
    }
    row.insertCell(3).innerHTML = dataInsert;
}

function clearTable() {
    document.querySelector('#todayTableTBody').innerHTML = "";
}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message,
        }
    );
}
