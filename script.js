const audioFileInput = document.getElementById("audioFile");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const volumeSlider = document.getElementById("volumeSlider");
const speedSlider = document.getElementById("speedSlider");
const reverseBtn = document.getElementById("reverseBtn");
const echoBtn = document.getElementById("echoBtn");
const startTrimInput = document.getElementById("startTrim");
const endTrimInput = document.getElementById("endTrim");
const trimBtn = document.getElementById("trimBtn");
const soundBar = document.getElementById("soundBar");
const soundTimeline = document.getElementById("soundTimeline");
let audioPlayer;
let audioCtx;
let analyser;
let rafId;

audioFileInput.addEventListener("change", () => {
  const file = audioFileInput.files[0];
  if (file) {
    const audioURL = URL.createObjectURL(file);
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer = null;
    }
    audioPlayer = new Audio(audioURL);
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioPlayer);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    createSoundBar();
  }
});

playBtn.addEventListener("click", () => {
  if (audioPlayer) {
    audioPlayer.play();
  }
});

pauseBtn.addEventListener("click", () => {
  if (audioPlayer) {
    audioPlayer.pause();
  }
});

stopBtn.addEventListener("click", () => {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
});

volumeSlider.addEventListener("input", () => {
  if (audioPlayer) {
    audioPlayer.volume = volumeSlider.value;
  }
});

speedSlider.addEventListener("input", () => {
  if (audioPlayer) {
    audioPlayer.playbackRate = speedSlider.value;
  }
});

reverseBtn.addEventListener("click", () => {
  if (audioPlayer) {
    const speed = speedSlider.value;
    const audioBuffer = audioCtx.createBuffer(2, audioCtx.sampleRate * speed, audioCtx.sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    const len = audioPlayer.buffered.length;
    const start = audioPlayer.buffered.start(len - 1);
    const end = audioPlayer.buffered.end(len - 1);
    const audioData = audioCtx.createBuffer(2, end - start, audioCtx.sampleRate);
    const channelDataL = audioData.getChannelData(0);
    const channelDataR = audioData.getChannelData(1);

    audioCtx.decodeAudioData(audioPlayer.response).then((buffer) => {
      for (let i = 0; i < audioData.length; i++) {
        const idx = Math.floor(i / speed);
        channelDataL[i] = buffer.getChannelData(0)[idx];
        channelDataR[i] = buffer.getChannelData(1)[idx];
      }
      source.buffer = audioData;
      audioPlayer.play();
    });
  }
});

echoBtn.addEventListener("click", () => {
  if (audioPlayer) {
    const echoDelay = 0.3; // Echo delay in seconds
    const echoGain = 0.6; // Echo gain (volume)

    const echoNode = audioCtx.createDelay();
    const echoGainNode = audioCtx.createGain();
    const source = audioCtx.createMediaElementSource(audioPlayer);

    echoNode.delayTime.setValueAtTime(echoDelay, audioCtx.currentTime);
    echoGainNode.gain.setValueAtTime(echoGain, audioCtx.currentTime);

    source.connect(echoNode);
    source.connect(audioCtx.destination);
    echoNode.connect(echoGainNode);
    echoGainNode.connect(audioCtx.destination);
  }
});

trimBtn.addEventListener("click", () => {
  if (audioPlayer && startTrimInput.value && endTrimInput.value) {
    const startTrim = parseFloat(startTrimInput.value);
    const endTrim = parseFloat(endTrimInput.value);
    if (startTrim >= 0 && endTrim > startTrim && endTrim <= audioPlayer.duration) {
      audioPlayer.currentTime = startTrim;
      audioPlayer.play();

      audioPlayer.addEventListener("timeupdate", () => {
        if (audioPlayer.currentTime >= endTrim) {
          audioPlayer.pause();
          audioPlayer.currentTime = startTrim;
        }
      });
    }
  }
});

function createSoundBar() {
  if (audioPlayer && analyser) {
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const barWidth = (100 / bufferLength) * 2.5;
    const barMargin = (100 / bufferLength) * 1.5;

    soundBar.innerHTML = "";
    for (let i = 0; i < bufferLength; i++) {
      const bar = document.createElement("div");
      bar.style.width = `${barWidth}%`;
      bar.style.marginRight = `${barMargin}%`;
      soundBar.appendChild(bar);
    }

    function drawSoundBar() {
      rafId = requestAnimationFrame(drawSoundBar);
      analyser.getByteFrequencyData(dataArray);

      soundBar.childNodes.forEach((bar, i) => {
        bar.style.height = `${dataArray[i]}px`;
      });
    }

    drawSoundBar();
  }
}

function updateSoundTimeline() {
  if (audioPlayer) {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    soundTimeline.querySelector(".progress").style.width = `${progress}%`;
  }
  rafId = requestAnimationFrame(updateSoundTimeline);
}

function initSoundTimeline() {
  const progressBar = document.createElement("div");
  progressBar.classList.add("progress");
  soundTimeline.appendChild(progressBar);

  updateSoundTimeline();
}

initSoundTimeline();
// ... Existing code for other functionalities ...

function createSoundTimeline() {
    soundTimeline.addEventListener("click", (event) => {
      if (audioPlayer) {
        const timelineWidth = soundTimeline.clientWidth;
        const clickPosition = event.offsetX;
        const seekPosition = clickPosition / timelineWidth;
  
        audioPlayer.currentTime = audioPlayer.duration * seekPosition;
      }
    });
  }
  
  function updateSoundTimeline() {
    if (audioPlayer) {
      const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      soundTimeline.querySelector(".progress").style.width = `${progress}%`;
  
      const seekerPosition = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      soundTimeline.querySelector(".seeker").style.left = `${seekerPosition}%`;
    }
    rafId = requestAnimationFrame(updateSoundTimeline);
  }
  
  function initSoundTimeline() {
    const progressBar = document.createElement("div");
    progressBar.classList.add("progress");
    soundTimeline.appendChild(progressBar);
  
    const seeker = document.createElement("div");
    seeker.classList.add("seeker");
    soundTimeline.appendChild(seeker);
  
    createSoundTimeline();
    updateSoundTimeline();
  }
  
  initSoundTimeline();
  var sound = document.getElementById("my-sound");
var progressBar = document.getElementById("my-progress-bar");

sound.addEventListener("timeupdate", function() {
  progressBar.value = sound.currentTime;
});
// Existing code...

const lofiBtn = document.getElementById("lofiBtn");

// Existing event listeners...

lofiBtn.addEventListener("click", () => {
  if (audioPlayer) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioPlayer);
    const lofiFilter = audioCtx.createBiquadFilter();

    // Apply "lofi" effect by reducing the quality and frequencies
    lofiFilter.type = "lowpass";
    lofiFilter.frequency.value = 1000;
    lofiFilter.Q.value = 1;

    // Connect the nodes and play the audio
    source.connect(lofiFilter);
    lofiFilter.connect(audioCtx.destination);
    audioPlayer.play();
  }
});
