window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const firebase = require('firebase');
const dbChildAppoint = 'appointment_info';
const dbChildPatients = 'patients_info';
const limitDB = 20;

function firebaseAdminInit() {
    let key = require('../assets/firebase-admin-private-key.json');

    //Prevents Initializing of App more than once
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
    fillAppointments();

    document.querySelector('#searchBy').onchange = () => {
        if (document.querySelector('#searchBy').value === 'Current Status') {
            showToast("Enter true to search for Completed Appointments");
        }
        if (document.querySelector('#searchBy').value === 'Appointment Date') {
            showToast("Enter Date in DD/MM/YYYY format");
        }
    };

    document.querySelector("#searchButton")
            .addEventListener('click', searchPatients);

    document.querySelector("#refreshButton")
            .addEventListener('click', fillAppointments);

    document.querySelector('#changeStatus')
            .addEventListener('click', changeStatus);

    const allCheckBox = document.querySelector('#selectAllCheckBox');
    allCheckBox.addEventListener('click', () => {
        if (allCheckBox.checked) {
            setAllCheckBoxes(true);
        } else {
            setAllCheckBoxes(false);
        }
    });

    window.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            searchPatients();
        }
    });

}

function setAllCheckBoxes(state) {
    const tableBody = document.querySelector('#todayTableTBody');
    const rowNum = tableBody.rows.length;

    for (let i = 1; i <= rowNum; i++) {
        document.querySelector('#checkboxRow' + i).checked = state;
    }
}

function changeStatus() {
    const selectedCheckBoxes = getSelectedCheckBoxes();

    if (selectedCheckBoxes.length === 0) {
        showToast("No Patient Selected");
    } else {
        let idArray = [];
        showToast("Changing Status");

        selectedCheckBoxes.forEach((index) => {
            const elm = document.querySelector('#pId' + index);
            idArray.push(elm.innerHTML);
        });

        const rootRef = firebase.database()
                                .ref();

        idArray.forEach((index) => {
            rootRef.child(dbChildPatients)
                   .orderByChild('patientID')
                   .equalTo(index)
                   .once('value')
                   .then((snapshot) => {
                       snapshot.forEach((snap) => {
                           let uid = snap.key;

                           rootRef.child(dbChildAppoint)
                                  .child(uid)
                                  .once('value')
                                  .then((snap) => {
                                      snap.forEach((rec) => {
                                          rec.ref.update({'appointmentFulfilled': true})
                                             .then(() => {
                                             });
                                      });
                                  });
                       });

                   });
        });

        showToast("Operation Performed Successfully");
    }
}

function getSelectedCheckBoxes() {
    let selectedArray = [];
    const tableBody = document.querySelector('#todayTableTBody');
    const rowNum = tableBody.rows.length;

    for (let i = 1; i <= rowNum; i++) {
        if (document.querySelector('#checkboxRow' + i).checked === true) {
            selectedArray.push(i);
        }
    }
    return selectedArray;
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
            if (query === 'true' || query === 'false') {
                query = (query === 'true');
            } else {
                showToast("Wrong Query Given");
            }
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
           .once('value')
           .then((snapshot) => {
               snapshot.forEach((snap) => {
                   snap.forEach((snapInside) => {
                       addDataToTable(snapInside.val());
                   });
               });
           });
}

function addDataToTable(val) {
    const table = document.querySelector('#todayTableTBody');

    let rowNum = table.rows.length + 1;

    const row = table.insertRow(-1);
    row.insertCell(0).innerHTML = '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="checkboxRow' + rowNum + '" >\n' +
        '            <input type="checkbox" id="checkboxRow' + rowNum + '" class="mdl-checkbox__input" />\n' +
        '          </label>';
    row.insertCell(1).innerHTML = rowNum + '';
    row.insertCell(2).innerHTML = val.patientID;
    row.cells.item(2).id = 'pId' + rowNum;
    row.insertCell(3).innerHTML = val.dateAppoint;
    row.insertCell(4).innerHTML = val.prefDoctor;

    let currentStat = val.appointmentFulfilled;

    let dataInsert;
    if (currentStat === true) {
        dataInsert = "\u2714";
    } else {
        dataInsert = "\u26cc";
    }
    row.insertCell(5).innerHTML = dataInsert;
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
