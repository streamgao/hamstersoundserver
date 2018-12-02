const scale = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};




let oscillators = [];
let bassFreq = 32;
for (let i = 0; i < 8; i++){
    oscillators.push(new Tone.FatOscillator({
        "frequency" : bassFreq * i,
        "type" :  "square8",
        "volume" : -Infinity,
        "detune" : Math.random() * 30 - 15,
        'modulationFrequency': 0.4
    }).start().toMaster());
}
/* --- --- update --- --- */
const updateBaseOscFre = value => {
    let fValue;
    oscillators.forEach((osc, i) => {
        fValue = bassFreq * i * value.toFixed(2);
        osc.frequency.rampTo(fValue, 0.4);
    });
    document.querySelector('#baseOsc p').textContent = 'Base frequency: ' + fValue;
    // [60, 600]
};
/* --- --- update --- --- */

Interface.Slider({
    name: "harmony",
    parent : $("#baseOsc"),
    min: 0.1,
    max: 1,
    value: 0.4,
    drag: value => {
        updateBaseOscFre(value);
    }
});
Interface.Slider({
    name: "volume",
    parent : $("#baseOsc"),
    min: -60,
    max: 20,
    value: 0,
    drag: value => {
        oscillators.forEach(osc => {
            osc.volume.rampTo(value, 0);
        });
    }
});
Interface.Button({
    text: 'Unmute Base',
    parent : $("#baseOsc"),
    activeText: 'Mute Base',
    type: 'toggle',
    key: 32, //spacebar
    start: () => {
        oscillators.forEach(osc => {
            osc.volume.rampTo(-20, 0);
        });
    },
    end: () => {
        oscillators.forEach(osc => {
            osc.volume.rampTo(-Infinity, 0);
        });
    }
});








/* --------------- Base Phase ------------------- */
// set the bpm and time signature first
Tone.Transport.timeSignature = [6, 2];
Tone.Transport.bpm.value = 70;

// L/R channel merging
const mergeBasePhase = new Tone.Merge();
// a little reverb
const reverbBasePhase = new Tone.Freeverb({
    "roomSize" : 0.5,
    "wet" : 0.7
});
var delay = new Tone.FeedbackDelay({ delayTime: '4t', feedback: 0.5, wet: 0.5 });
var reverbC = new Tone.Convolver({ url: 'doubleclick.mp3', wet: 0.75 });
var limiter = new Tone.Limiter();
var panner = new Tone.Panner(0.5);
mergeBasePhase.chain(delay, reverbBasePhase, reverbC, limiter, panner, Tone.Master);

let duosetting = {
    vibratoAmount: .1,
    vibratoRate: .5,
    harmonicity: 1.2,
    voice0: {
        volume: -10,
        portamento: 0,
        oscillator: {
            type: 'sine',
            partials: [2, 1, 2, 2],
            detune: -20
        },
        filterEnvelope: {
            attack: 0.01,
            decay: 3,
            sustain: 12,
            release: 0.05
        },
        envelope: {
            attack: 0.01,
            decay: 12,
            sustain: 120,
            release: 0.01
        }
    },
    voice1: {
        volume: -10,
        portamento: 1,
        oscillator: {
            type: 'square',
            detune: -20
        },
        envelope: {
            attack: 0.01,
            decay: 12,
            sustain: 120,
            release: 0.05
        }
    }
};

// left and right synthesizers
const synthLBase = new Tone.FMSynth().connect(mergeBasePhase.left);
const synthRBase = new Tone.DuoSynth(duosetting).connect(mergeBasePhase.right);

// the two Tone.Sequences
const partLBase = new Tone.Sequence((time, note) => {
    synthLBase.triggerAttackRelease(note, '8n', time.toFixed(2), 0.5);
}, ["E4", "F#4", "B4", "C#5"], "8n").start();

const partRBase = new Tone.Sequence((time, note) => {
    synthRBase.triggerAttackRelease(note, "8n", time.toFixed(2));
}, ["C5"], "8n").start('1m');

// const partRBase = new Tone.Sequence((time, note) => {
//     polySynth2.triggerAttackRelease(note, "8n", time.toFixed(2));
// }, ["E4", "F#4", "B4", "C#5", "D5", "F#4", "E4", "C#5", "B4", "F#4", "D5", "C#5"], "8n").start('100m');

/* --- --- update --- --- */
const updateLeftBasePLRate = value => {
    const lRate = value.toFixed(2);
    partLBase.playbackRate = lRate;
    document.querySelector('#leftphase p').textContent = 'L Piano rate: ' + lRate;
};
const updateRightBasePLRate = value => {
    const rRate = value.toFixed(2);
    partRBase.playbackRate = rRate;
    document.querySelector('#rightphase p').textContent = 'R Piano rate: ' + rRate;
};
/* --- --- update --- --- */
synthLBase.set('volume', -50);
synthRBase.set('volume', -50);
Interface.Slider({
    name: "LB Rate",
    parent: $("#leftphase"),
    min: 0.1,
    max: 2,
    value: 0.5,
    drag: value => {
        updateLeftBasePLRate(value);
    }
});
Interface.Slider({
    name: "RB Rate",
    parent: $("#rightphase"),
    min: 0.1,
    max: 2,
    value: 0.12,
    drag: value => {
        updateRightBasePLRate(value);
    }
});
Interface.Slider({
    name: "LB Volume",
    parent: $("#leftphase"),
    min: -50,
    max: 20,
    value: 1,
    drag: value => {
        synthLBase.set('volume', value);
    }
});
Interface.Slider({
    name: "RB Volume",
    parent: $("#rightphase"),
    min: -50,
    max: 20,
    value: 1,
    drag: function(value){
        synthRBase.set('volume', value);
    }
});
Interface.Button({
    parent: $('#basePhase'),
    key: 32,
    type: "toggle",
    text: "Unmute Base Phase",
    activeText : "Mute Base Phase",
    start: () => {
        // Tone.Transport.start("+0.1");
        synthLBase.set('volume', 10);
        synthRBase.set('volume', 10);
    },
    end: () => {
        // Tone.Transport.stop();
        synthLBase.set('volume', -100);
        synthRBase.set('volume', -100);
    }
});









/* --------------- Piano Phase ------------------- */
// set the bpm and time signature first
Tone.Transport.timeSignature = [6, 2];
Tone.Transport.bpm.value = 100;

// L/R channel merging
const merge = new Tone.Merge();
const reverb = new Tone.Freeverb({
    "roomSize" : 0.5,
    "wet" : 0.4
});
merge.chain(reverb, Tone.Master);

let synthSettingsL = {
    "oscillator": {
        "detune": 0,
        "type": "custom",
        "partials" : [2, 1, 2, 2],
        "phase": 0,
        "volume": 40
    },
    "envelope": {
        "attack": 0.1,
        "decay": 0.8,
        "sustain": 15,
        "release": 1,
    },
    "portamento": 0.5,
    "volume": 10
};
let synthSettingsR = {
    "oscillator": {
        "detune": 0,
        "type": "custom",
        "partials" : [2, 1, 2, 2],
        "phase": 0,
        "volume": 0
    },
    "envelope": {
        "attack": 0.005,
        "decay": 0.02,
        "sustain": 0.02,
        "release": 1,
    },
    "portamento": 0.01,
    "volume": 10
};

// left and right synthesizers
const synthL = new Tone.PolySynth(synthSettingsL).connect(merge.left);
const synthR = new Tone.PolySynth(synthSettingsR).connect(merge.right);

// the two Tone.Sequences
const partL = new Tone.Sequence((time, note) => {
    synthL.triggerAttackRelease(note, "8n", time.toFixed(2));
}, ["E4", "F#4", "B4", 'C#5', "D5", "F#4", "E4", "C#5", "B4", "F#4", "D5", "C#5"], "8n").start();

const partR = new Tone.Sequence((time, note) => {
    synthR.triggerAttackRelease(note, "8n", time.toFixed(2));
}, ["E4", "F#4", "B4", "C#5", "D5", "F#4", "E4", "C#5", "B4", "F#4", "D5", "C#5"], "8n").start('1m');

/* --- --- update --- --- */
const updateLeftPianoPLRate = value => {
    const lRate = value.toFixed(2);
    partL.playbackRate = lRate;
    document.querySelector('#leftpiano p').textContent = 'L Piano rate: ' + lRate;
};

const updateRightPianoPLRate = value => {
    const rRate = value.toFixed(2);
    partR.playbackRate = rRate;
    document.querySelector('#rightpiano p').textContent = 'R Piano rate: ' + rRate;
};
/* --- --- update --- --- */

partL.playbackRate = 0.5; // start slow
Interface.Slider({
    name: "LP Rate",
    parent: $("#leftpiano"),
    min: 0.1,
    max: 2,
    value: 0.5,
    drag: value => {
        updateLeftPianoPLRate(value);
    }
});
Interface.Slider({
    name: "RP Rate",
    parent: $("#rightpiano"),
    min: 0.1,
    max: 2,
    value: 1,
    drag: value => {
        updateRightPianoPLRate(value);
    }
});
Interface.Slider({
    name: "LP Volume",
    parent: $("#leftpiano"),
    min: -50,
    max: 20,
    value: -50,
    drag: value => {
        synthL.set('volume', value);
    }
});
Interface.Slider({
    name: "RP Volume",
    parent: $("#rightpiano"),
    min: -50,
    max: 20,
    value: -50,
    drag: function(value){
        synthR.set('volume', value);
    }
});
Interface.Button({
    parent: $('#pianophase'),
    key: 32,
    type: "toggle",
    text: "Start Piano Phase",
    activeText : "Stop Piano Phase",
    start: () => {
        Tone.Transport.start("+0.1");
    },
    end: () => {
        Tone.Transport.stop();
    }
});





/* ---  socket and control  --- */
let GLOBAL_SPEED = 10;
let GLOBAL_SPEED_SETTINGS = {
    baseOsc: {
        shouldListenOnGlobal: false,
        speed: GLOBAL_SPEED
    },
    basePhase: {
        shouldListenOnGlobal: false,
        speed: GLOBAL_SPEED
    },
    pianoPhase: {
        shouldListenOnGlobal: false,
        speed: GLOBAL_SPEED
    }
};
Interface.Button({
    parent: $('#baseOsc'),
    key: 32,
    type: "toggle",
    text: "Listen to Socket Data",
    activeText : "Stop and use Slider",
    start: () => {
        GLOBAL_SPEED_SETTINGS.baseOsc.shouldListenOnGlobal = true;
    },
    end: () => {
        GLOBAL_SPEED_SETTINGS.baseOsc.shouldListenOnGlobal = false;
    }
});
Interface.Button({
    parent: $('#basePhase'),
    key: 32,
    type: "toggle",
    text: "Listen to Socket Data",
    activeText : "Stop and use Slider",
    start: () => {
        GLOBAL_SPEED_SETTINGS.basePhase.shouldListenOnGlobal = true;
    },
    end: () => {
        GLOBAL_SPEED_SETTINGS.basePhase.shouldListenOnGlobal = false;
    }
});
Interface.Button({
    parent: $('#pianophase'),
    key: 32,
    type: "toggle",
    text: "Listen to Socket Data",
    activeText : "Stop and use Slider",
    start: () => {
        GLOBAL_SPEED_SETTINGS.pianoPhase.shouldListenOnGlobal = true;
    },
    end: () => {
        GLOBAL_SPEED_SETTINGS.pianoPhase.shouldListenOnGlobal = false;
    }
});
function updateOnSpeed() {
    console.log('on update');
    // 0.1 - 1
    if (GLOBAL_SPEED <= 0) {
        return;
    }

    if (GLOBAL_SPEED_SETTINGS.baseOsc.shouldListenOnGlobal) {
        const baseFre = GLOBAL_SPEED.map(0, 50, 0.2, 1);
        console.log('global', GLOBAL_SPEED, baseFre);
        updateBaseOscFre(baseFre);
    }

    if (GLOBAL_SPEED_SETTINGS.basePhase.shouldListenOnGlobal) {
        // 0.1 - 2
        const basePhaseRate = GLOBAL_SPEED.map(0, 50, 0.2, 2);
        updateLeftBasePLRate(basePhaseRate * 0.5);
        updateRightBasePLRate(basePhaseRate);
    }

    if (GLOBAL_SPEED_SETTINGS.pianoPhase.shouldListenOnGlobal) {
        const basePianoRate = GLOBAL_SPEED.map(0, 50, 0.2, 2);
        updateLeftPianoPLRate(basePianoRate * 0.5);
        updateRightPianoPLRate(basePianoRate);
    }
};

let updateOnInterval; // = setInterval(updateOnSpeed, 3000);




const hostlight = '172.16.80.163:8080';
const socket= new WebSocket('ws://' + hostlight);
socket.onopen = function() {
    console.log('hi on socket connect');
    updateOnInterval = setInterval(updateOnSpeed, 5000);
};
socket.onclose = () => {
    clearInterval(updateOnInterval);
    console.log('Connection is closed...');
};
socket.onmessage = evt => {
    let msg;
    try {
        msg = JSON.parse(evt.data);
        console.log('on message receiving data..');
        const { speed = 10 } = msg;
        if ( speed > 0 ) {
            GLOBAL_SPEED = speed;
            // // 0.1 - 1
            // const baseFre = speed.map(0, 50, 0.1, 1);
            // updateBaseOscFre(baseFre);
            //
            // console.log('hi spee', baseFre);
            // // 0.1 - 2
            // const basePhaseRate = speed.map(0, 50, 0.1, 2);
            // updateLeftBasePLRate(basePhaseRate * 0.1);
            // updateRightBasePLRate(basePhaseRate);
            //
            // const basePianoRate = speed.map(0, 50, 0.1, 2);
            // updateLeftPianoPLRate(value * 0.1);
            // updateRightPianoPLRate(basePianoRate);
        }
    } catch (e) {
        console.log('..something wrong here..', evt.data, e);
    }
};
