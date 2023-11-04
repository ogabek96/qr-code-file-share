document.addEventListener('DOMContentLoaded', function () {
    const textInput = document.getElementById('link');
    const qrCodeContainer = document.getElementById('qrcode');

    function generateQRCode(text) {
        const qrcode = new QRCode(qrCodeContainer, {
            text: text,
            width: 128,
            height: 128,
        });
    }
    const text = textInput.value;
    generateQRCode(text);
});
