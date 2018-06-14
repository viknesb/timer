const {remote, ipcRenderer, systemPreferences} = require('electron');
const app = remote.require("./main.js");
const path = require('path');
const JSONStream = require('JSONStream');
const fs = require('fs');

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const zeroPad = num => num < 10 ? `0${num}` : num.toString();
const displayTime = (timeInMillisecs = 0) => {
    const timeInSecs = timeInMillisecs / 1000;
    const secs = timeInSecs % 60;
    const mins = Math.floor(timeInSecs / 60);
    const hours = Math.floor(mins / 60);
    const secsStr = zeroPad(secs);
    const minsStr = zeroPad(mins % 60);
    const hoursStr = zeroPad(hours % 24);
    const timeHtml = [
        ...(hours ? [...renderNumStr(hoursStr), renderImage('colon', 'colon')] : []),
        ...renderNumStr(minsStr),
        renderImage('colon', 'colon'),
        ...renderNumStr(secsStr)
    ];
    document.querySelector('#time-holder').innerHTML = timeHtml.join('');
};

const renderImage = (filename, classname) => `<div class="${classname}" style="background-image: url(${path.join(__dirname, 'images', filename)}.png)"></div>`

const renderNumStr = str => {
    const parts = str.split('');
    return parts.map(num => renderImage(num, 'number-str'))
}

const startTime = 20 * 60 * 1000;
let intervalPromise;
const runInterval = time => {
    displayTime(time);
    let newTime = time;
    intervalPromise = setInterval(() => {
        newTime -= 1000;
        displayTime(newTime);
        if (!newTime) {
            clearInterval(intervalPromise);
            app.focus();
            playAlarmSound();
        }
    }, 1000);
}

ipcRenderer.on('system-sleep', () => {
    clearInterval(intervalPromise);
    displayTime();
});

ipcRenderer.on('system-wakeup', () => {  
    clearInterval(intervalPromise);
    runInterval(startTime);
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#play-button').addEventListener('click', function () {
        document.querySelector('#pause-button').style.display = 'block';
        document.querySelector('#play-button').style.display = 'none';
    });

    document.querySelector('#pause-button').addEventListener('click', function () {
        document.querySelector('#play-button').style.display = 'block';
        document.querySelector('#pause-button').style.display = 'none';
    });

    document.querySelector('#reset-button').addEventListener('click', () => {
        clearInterval(intervalPromise);
        runInterval(startTime);
    });

    document.querySelector('#stop-button').addEventListener('click', () => {
        clearInterval(intervalPromise);
        displayTime();
    });

    document.body.addEventListener('click', () => {
        stopAlarmSound();
    });
});

const appendAudioElement = () => {
    const audio = document.createElement('audio');
    audio.setAttribute('id', 'alarm-sound');
    audio.setAttribute('src', path.join(__dirname, 'alarm-clock.mp3'));
    document.body.appendChild(audio);
};

const playAlarmSound = () => {
    const alarmElement = document.getElementById('alarm-sound');
    alarmElement.play();
};

const resetAlarmSound = () => {
    const alarmElement = document.getElementById('alarm-sound');
    alarmElement.currentTime = 0;
};

const pauseAlarmSound = () => {
    const alarmElement = document.getElementById('alarm-sound');
    alarmElement.pause();
};

const stopAlarmSound = () => {
    pauseAlarmSound();
    resetAlarmSound();
};

appendAudioElement();
runInterval(startTime);
