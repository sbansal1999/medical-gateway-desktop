window.addEventListener('load', init);
const require = parent.require;
const admin = require('firebase-admin');
const dbChild = 'patients_info';

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
    fillData();

    document.querySelector("#searchButton")
            .addEventListener('click', searchPatients);

    document.querySelector("#refreshButton")
            .addEventListener('click', fillData);
    
    window.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            document.querySelector('#searchButton')
                    .click();
        }
    });

}

function searchPatients() {
    let category = document.querySelector('#searchBy').value;
    let query = document.querySelector('#searchQuery').value;

    if (query === '') {
        showToast("No Query Given");
        return;
    }

    showToast("Searching");

    let key;
    switch (category) {
        case 'Name':
            key = 'name';
            break;
        case 'Address':
            key = 'residentialAddress';
            break;
        case 'Mobile No.':
            key = 'phone';
            break;
        case 'ID':
            key = 'patientID';
            break;
        default:
            showToast("Some Error Occurred");
    }

    const rootRef = admin.database()
                         .ref();

    clearTable();

    if (key === 'name') {
        rootRef.child(dbChild)
               .orderByChild(key)
               .startAt(query)
               .endAt(query + '\uf8ff')
               .once('value')
               .then((snapshot) => {
                   if (snapshot.exists()) {
                       snapshot.forEach((snap) => {
                           addDataToTable(snap.val());
                       });
                   } else {
                       showToast("No Patient Found");
                   }
               })
               .catch((err) => {
                   console.log(err);
               });
    } else {
        rootRef.child(dbChild)
               .orderByChild(key)
               .equalTo(query)
               .once('value')
               .then((snapshot) => {
                   if (snapshot.exists()) {
                       snapshot.forEach((snap) => {
                           addDataToTable(snap.val());
                       });
                   } else {
                       showToast("No Patient Found");
                   }
               })
               .catch
               ((err) => {
                   console.log(err);
               });
    }


}


function fillData() {
    clearTable();

    const rootRef = admin.database()
                         .ref();

    rootRef.child('patients_info')
           .once('value')
           .then((snapshot) => {
               if (snapshot.exists()) {
                   snapshot.forEach((snap) => {
                       addDataToTable(snap.val());
                   });
               } else {
               }
           })
           .catch((err) => {

           });

}

function clearTable() {
    const todayTable = document.querySelector('#todayTableTBody');
    todayTable.innerHTML = '';
}

function addDataToTable(val) {
    const todayTable = document.querySelector('#todayTableTBody');

    todayTable.classList.remove('invisible');

    let row = todayTable.insertRow(-1);
    row.insertCell(0).innerHTML = val.patientID;
    row.insertCell(1).innerHTML = val.name;
    row.insertCell(2).innerHTML = val.phone;
    row.insertCell(3).innerHTML = val.residentialAddress;
}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message,
        }
    );
}