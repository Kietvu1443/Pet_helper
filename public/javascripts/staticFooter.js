function fallbackPetImage(img, id) {
    img.onerror = null;
    img.src = '/images/the_logo.jpg';
}
