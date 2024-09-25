export function playHitSound() {
    const hitSound = document.getElementById('hit-sound');
    missSound.currentTime = 0;
    hitSound.play();
}

export function playMissSound() {
    const missSound = document.getElementById('miss-sound');
    missSound.currentTime = 0;
    missSound.play();
}

export function playKillSound() {
    const killSound = document.getElementById('kill-sound');
    missSound.currentTime = 0;
    killSound.play();
}
