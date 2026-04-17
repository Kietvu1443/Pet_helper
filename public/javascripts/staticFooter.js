function fallbackPetImage(img, id) {
    img.onerror = null;
    img.src = '/images/logo.svg';
}
