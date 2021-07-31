window.addEventListener('load', init);
const require = parent.require;
const firebase = require('firebase');
const admin = require('firebase-admin');
const dbChild = 'patients_info';
const limitDB = 20;

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
    fillData();

    document.querySelector('#searchBy').onchange = () => {
        if (document.querySelector('#searchBy').value === "In Date") {
            showToast("Kindly Enter the Date in DD/MM/YYYY");
        }
    };

    document.querySelector("#searchButton")
        .addEventListener('click', searchPatients);

    document.querySelector("#refreshButton")
        .addEventListener('click', fillData);

    document.querySelector('#dischargePatients')
        .addEventListener('click', dischargePatients);

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

function dischargePatients() {

    const selectedCheckBoxes = getSelectedCheckBoxes();

    if (selectedCheckBoxes.length === 0) {
        showToast("No Patient Selected");
    } else {
        let idArray = [];
        showToast("Discharging Patients...");

        selectedCheckBoxes.forEach((index) => {
            const elm = document.querySelector('#pId' + index);
            idArray.push(elm.innerHTML);
        });

        const date = new Date();
        const dischargeDate = date.getUTCDate() + '-' + date.getUTCMonth() + '-' + date.getUTCFullYear();

        const rootRef = firebase.database()
            .ref();

        let allDischarged = true;

        idArray.forEach(async (index) => {
            await rootRef.child(dbChild)
                .orderByChild('patientID')
                .equalTo(index)
                .once('value')
                .then((snapshot) => {
                    snapshot.forEach((snap) => {
                        if (!snap.hasChild('dischargeDate')) {
                            snap.ref.update({
                                dischargeDate: dischargeDate,
                            })
                                .then(() => {
                                });
                        } else {
                            allDischarged = false;
                        }
                    });
                });
        });

        if (allDischarged === true) {
            showToast("Patients have been discharged successfully");
        } else {
            showToast("Contact Support");
        }


        uncheckBoxes();
    }

    function uncheckBoxes() {
        const tableBody = document.querySelector('#todayTableTBody');
        const rowNum = tableBody.rows.length;

        for (let i = 1; i <= rowNum; i++) {
            document.querySelector('#checkboxRow' + i).checked = false;
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

}

function setAllCheckBoxes(state) {
    const tableBody = document.querySelector('#todayTableTBody');
    const rowNum = tableBody.rows.length;

    for (let i = 1; i <= rowNum; i++) {
        document.querySelector('#checkboxRow' + i).checked = state;
    }
}

function getIdFromDate(query) {
    const input = query.replaceAll('/', '');

    return input.substr(6, 2) + input.substr(2, 2) + input.substr(0, 2);
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
        case 'In Date':
            key = 'inDate';
            query = getIdFromDate(query);
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

    if (key === 'name' || key === 'inDate') {

        if (key === 'inDate') {
            key = 'patientID';
        }
        rootRef.child(dbChild)
            .orderByChild(key)
            .startAt(query)
            .endAt(query + '\uf8ff')
            .limitToFirst(limitDB)
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
            .limitToFirst(limitDB)
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
    showToast("Fetching Data");
    clearTable();

    const rootRef = admin.database()
        .ref();

    rootRef.child('patients_info')
        .limitToFirst(limitDB)
        .once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((snap) => {
                    let discharged = false;
                    if (snap.hasChild('dischargeDate')) {
                        discharged = true;
                    }
                    addDataToTable(snap.val(), discharged);
                });
            } else {
            }
        })
        .catch((err) => {
            showToast("Contact Support");
            console.log(err);
        });
}

function clearTable() {
    const todayTable = document.querySelector('#todayTableTBody');
    todayTable.innerHTML = '';
}

function addDataToTable(val, isDischarged) {
    const tableBody = document.querySelector('#todayTableTBody');

    tableBody.classList.remove('invisible');

    let rowNum = tableBody.rows.length + 1;

    let row = tableBody.insertRow(-1);
    row.insertCell(0).innerHTML = '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="checkboxRow' + rowNum + '" >\n' +
        '            <input type="checkbox" id="checkboxRow' + rowNum + '" class="mdl-checkbox__input" />\n' +
        '          </label>';
    row.insertCell(1).innerHTML = rowNum + '';
    row.insertCell(2).innerHTML = val.patientID;
    row.cells.item(2).id = 'pId' + rowNum;
    row.insertCell(3).innerHTML = val.name;
    row.insertCell(4).innerHTML = val.phone;
    row.insertCell(5).innerHTML = val.residentialAddress;

    let discharged = "\u26cc";

    if (isDischarged) {
        discharged = "\u2714";
        console.log(isDischarged);
    }
    row.insertCell(6).innerHTML = discharged;

}

function showToast(message) {
    let notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: message,
        }
    );
}
