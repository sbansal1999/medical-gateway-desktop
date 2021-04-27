window.addEventListener('load', init);
const require = parent.require;
const ipc = require('electron').ipcRenderer;
const firebase = require('firebase');

/**
 * Method to add an account as admin. Data is stored in root/admin_info
 */
function addAdmin() {
    const email = 'admin123@gmail.com';
    const password = 'Admin@123';
    const userId = 'mainAdmin';
    firebase.auth()
            .createUserWithEmailAndPassword(email, password)
            .then((userCred) => {
                userCred.user.updateProfile({
                    displayName: 'Admin Sharma'
                });

                firebase.database()
                        .ref()
                        .child("admin_info")
                        .child(userCred.user.uid)
                        .set({
                                userId: userId,
                                email: email
                            }
                        )
                        .catch((error) => {
                            console.log(error.message);
                        });
            });
}

function init() {



    firebaseInit();

    document.querySelector('#loginButton')
            .addEventListener('click', doLogin);

    window.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
            document.querySelector('#loginButton')
                    .click();
        }
    });
}

function doLogin() {
    setLoadingVisible(true);

    const userId = document.querySelector('#loginID').value;
    const password = document.querySelector('#password').value;
    if (document.querySelector('#admin').checked === true) {
        //User has selected Admin
        loginAsAdmin(userId, password);
    } else {
        //User has selected Staff
        loginAsStaff(userId, password);
    }
}

function loginAsAdmin(id, password) {
    const rootRef = firebase.database()
                            .ref();
    let email;

    rootRef.child('admin_info')
           .orderByChild('userId')
           .equalTo(id)
           .once('value')
           .then((snapshot) => {
               if (snapshot.exists()) {
                   setWrongCredVisible(false);

                   snapshot.forEach((snap) => {
                       email = snap.child('email')
                                   .val();

                       loginUserWithFirebase(email, password);
                   });
               } else {
                   setLoadingVisible(false);
                   setWrongCredVisible(true);
               }
           })
           .catch((error) => {
               console.log(error);
           });

}

function loginUserWithFirebase(email, password) {
    firebase.auth()
            .signInWithEmailAndPassword(email, password)
            .then((userCred) => {
                setLoadingVisible(false);
                loginSuccessful(userCred.user.displayName, email);
            })
            .catch((error) => {
                let code = error.code;
                if (code === 'auth/wrong-password') {
                    setWrongCredVisible(true);
                    setLoadingVisible(false);
                } else {
                    console.log(code);
                }
            });
}

function loginSuccessful(name, email) {
    window.top.postMessage({
            userName: name,
            email: email
        }
        , '*');

}

function loginAsStaff(id, password) {

}

/**
 * Initializes Firebase Settings
 */
function firebaseInit() {
    require('firebase/auth');
    require('firebase/database');

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

    firebase.initializeApp(firebaseConfig);
}

function setWrongCredVisible(visibility) {
    let wrongCred = document.querySelector('#wrongCred').style;
    if (visibility === true) {
        wrongCred.visibility = 'visible';
    } else {
        wrongCred.visibility = 'hidden';
    }
}

function setLoadingVisible(visibility) {
    let loading = document.querySelector('#loading');
    if (visibility === true) {
        loading.classList.add('is-active');
    } else {
        loading.classList.remove('is-active')
    }
}

