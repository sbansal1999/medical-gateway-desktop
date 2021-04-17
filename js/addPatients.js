window.addEventListener('load', init);

function attachCamera() {
    Webcam.set({
        width: 400,
        height: 250,
        image_format: 'jpeg',
        jpeg_quality: 100
    });

    Webcam.attach('#camera');
    Webcam.on('error', () => {
        console.log("Loading");
    });
}

function init() {
    attachCamera();

    document.querySelector("#captureImage")
            .addEventListener('click', captureImage);

    document.querySelector('#retakeImage')
            .addEventListener('click', attachCamera);


}

function captureImage() {
    Webcam.snap((data_uri) => {
        console.log("here");
        Webcam.reset('#camera');
        // document.querySelector('#placeHolder')
        //         .setAttribute('src', data_uri);
        document.querySelector('#camera').innerHTML += '<img alt="Error" src="' + data_uri + '"/>';


    });
}
