var heavyModule = null;
var loader = null;
midioutPort = null;

window.addEventListener("load", function () {
    console.log("Loading Heavy module...");
    heavy_Module().then(loadedModule => {
        heavyModule = loadedModule;
        moduleLoaded();
    });
    // document.getElementById("transportButton").style.visibility = "hidden";
});

function moduleLoaded() {
    loader = new heavyModule.AudioLibLoader();
    // document.getElementById("transportButton").style.visibility = "visible";
}

function start() {
    if (!loader.webAudioContext) {
        loader.init({
            // optional: set audio processing block size, default is 2048
            blockSize: 2048,
            // optional: provide a callback handler for [print] messages
            printHook: onPrint,
            // optional: provide a callback handler for [s {sendName} @hv_param] messages
            // sendName "midiOutMessage" is reserved for MIDI output messages!
            sendHook: onSendMessage,
            // optional: pass an existing web audio context, otherwise a new one
            // will be constructed.
            webAudioContext: null
        }).then(() => {
            updateSlider_bass_amplify(1.284);
            updateSlider_bass_clip(0.443);
            updateSlider_bass_distort_drive(10.1);
            updateSlider_bass_gain(0.224);
            updateSlider_bass_lowpass(543.3);
            updateSlider_bass_mixer_gain(0.84);
            updateSlider_bass_octave_transpose(-3.0);
            updateSlider_beep_bpm(30.0);
            updateSlider_beep_delay_vol(0.7);
            updateSlider_beep_mixer_gain(0.68);
            updateSlider_beep_reverb_dry(0.4);
            updateSlider_beep_reverb_vol(0.2);
            updateSlider_beep_reverb_wet(15.8);
            updateSlider_beep_toggle(0.0);
            updateSlider_bpm(120.0);
            updateSlider_hihat_gain(0.461);
            updateSlider_hihat_mixer_gain(1.1);
            updateSlider_kick_gain(0.514);
            updateSlider_kick_mixer_gain(1.27);
            updateSlider_music_gain(0.7);
            updateSlider_music_reverb_dry(0.272);
            updateSlider_music_reverb_vol(0.27);
            updateSlider_music_reverb_wet(65.68);
            updateSlider_snare_gain(0.715);
            updateSlider_snare_mixer_gain(1.0);
            updateSlider_synth_delay(260.3);
            updateSlider_synth_delay_vol(0.461);
            updateSlider_synth_gain(0.5);
            updateSlider_synth_highpass(385.4);
            updateSlider_synth_lowpass(4264.95);
            updateSlider_synth_mixer_gain(1.66);
            updateSlider_synth_reverb_dry(0.514);
            updateSlider_synth_reverb_vol(0.63);
            updateSlider_synth_reverb_wet(50.88);
            // updateSlider_toggle_bang(0.0);
            updateSlider_toggle_highpass(223.0);
            updateSlider_toggle_lowpass(4982.87);
            updateSlider_toggle_mixer_gain(1.47);
        });
    }

    loader.start();
}

function stop() {
    loader.stop();
}

function toggleTransport(element) {
    (loader.isPlaying) ? stop() : start();
}

function onPrint(message) {
    console.log(message);
}



function onMidiOutMessage(message) {
    if (midioutPort !== null) {
        midioutPort.send(message);
    }
    else {
        console.error("No MIDI output port available.");
    }
}

function onSendMessage(sendName, message) {

    switch (sendName) {
        case "midiOutMessage":
            onMidiOutMessage(message);
            break;
        default:
            console.log(sendName, message);
    }
}


// randomizer
function randomiseParameters() {
    updateSlider_bass_amplify(Math.random());

    updateSlider_bass_clip(Math.random());

    updateSlider_bass_distort_drive(Math.random());

    updateSlider_bass_gain(Math.random());

    updateSlider_bass_lowpass(Math.random());

    updateSlider_bass_mixer_gain(Math.random());

    updateSlider_bass_octave_transpose(Math.random());

    updateSlider_beep_bpm(Math.random());

    updateSlider_beep_delay_vol(Math.random());

    updateSlider_beep_mixer_gain(Math.random());

    updateSlider_beep_reverb_dry(Math.random());

    updateSlider_beep_reverb_vol(Math.random());

    updateSlider_beep_reverb_wet(Math.random());

    updateSlider_beep_toggle(Math.random());

    updateSlider_bpm(Math.random());

    updateSlider_hihat_gain(Math.random());

    updateSlider_hihat_mixer_gain(Math.random());

    updateSlider_kick_gain(Math.random());

    updateSlider_kick_mixer_gain(Math.random());

    updateSlider_music_gain(Math.random());

    updateSlider_music_reverb_dry(Math.random());

    updateSlider_music_reverb_vol(Math.random());

    updateSlider_music_reverb_wet(Math.random());

    updateSlider_snare_gain(Math.random());

    updateSlider_snare_mixer_gain(Math.random());

    updateSlider_synth_delay(Math.random());

    updateSlider_synth_delay_vol(Math.random());

    updateSlider_synth_gain(Math.random());

    updateSlider_synth_highpass(Math.random());

    updateSlider_synth_lowpass(Math.random());

    updateSlider_synth_mixer_gain(Math.random());

    updateSlider_synth_reverb_dry(Math.random());

    updateSlider_synth_reverb_vol(Math.random());

    updateSlider_synth_reverb_wet(Math.random());

    updateSlider_toggle_bang(Math.random());

    updateSlider_toggle_highpass(Math.random());

    updateSlider_toggle_lowpass(Math.random());

    updateSlider_toggle_mixer_gain(Math.random());

}
// Generated Parameter Update Methods
function updateSlider_bass_amplify(value) {
    // document.getElementById("value_bass_amplify").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_amplify").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_amplify", value);
    } else {
        loader.audiolib.setFloatParameter("bass_amplify", value);
    }
}

function updateSlider_bass_clip(value) {
    // document.getElementById("value_bass_clip").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_clip").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_clip", value);
    } else {
        loader.audiolib.setFloatParameter("bass_clip", value);
    }
}

function updateSlider_bass_distort_drive(value) {
    // document.getElementById("value_bass_distort_drive").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_distort_drive").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_distort_drive", value);
    } else {
        loader.audiolib.setFloatParameter("bass_distort_drive", value);
    }
}

function updateSlider_bass_gain(value) {
    // document.getElementById("value_bass_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_gain", value);
    } else {
        loader.audiolib.setFloatParameter("bass_gain", value);
    }
}

function updateSlider_bass_lowpass(value) {
    // document.getElementById("value_bass_lowpass").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_lowpass").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_lowpass", value);
    } else {
        loader.audiolib.setFloatParameter("bass_lowpass", value);
    }
}

function updateSlider_bass_mixer_gain(value) {
    // document.getElementById("value_bass_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("bass_mixer_gain", value);
    }
}

function updateSlider_bass_octave_transpose(value) {
    // document.getElementById("value_bass_octave_transpose").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bass_octave_transpose").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bass_octave_transpose", value);
    } else {
        loader.audiolib.setFloatParameter("bass_octave_transpose", value);
    }
}

function updateSlider_beep_bpm(value) {
    // document.getElementById("value_beep_bpm").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_bpm").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_bpm", value);
    } else {
        loader.audiolib.setFloatParameter("beep_bpm", value);
    }
}

function updateSlider_beep_delay_vol(value) {
    // document.getElementById("value_beep_delay_vol").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_delay_vol").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_delay_vol", value);
    } else {
        loader.audiolib.setFloatParameter("beep_delay_vol", value);
    }
}

function updateSlider_beep_mixer_gain(value) {
    // document.getElementById("value_beep_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("beep_mixer_gain", value);
    }
}

function updateSlider_beep_reverb_dry(value) {
    // document.getElementById("value_beep_reverb_dry").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_reverb_dry").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_reverb_dry", value);
    } else {
        loader.audiolib.setFloatParameter("beep_reverb_dry", value);
    }
}

function updateSlider_beep_reverb_vol(value) {
    // document.getElementById("value_beep_reverb_vol").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_reverb_vol").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_reverb_vol", value);
    } else {
        loader.audiolib.setFloatParameter("beep_reverb_vol", value);
    }
}

function updateSlider_beep_reverb_wet(value) {
    // document.getElementById("value_beep_reverb_wet").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_reverb_wet").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_reverb_wet", value);
    } else {
        loader.audiolib.setFloatParameter("beep_reverb_wet", value);
    }
}

function updateSlider_beep_toggle(value) {
    // document.getElementById("value_beep_toggle").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_beep_toggle").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("beep_toggle", value);
    } else {
        loader.audiolib.setFloatParameter("beep_toggle", value);
    }
}

function updateSlider_bpm(value) {
    // document.getElementById("value_bpm").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_bpm").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("bpm", value);
    } else {
        loader.audiolib.setFloatParameter("bpm", value);
    }
}

function updateSlider_hihat_gain(value) {
    // document.getElementById("value_hihat_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_hihat_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("hihat_gain", value);
    } else {
        loader.audiolib.setFloatParameter("hihat_gain", value);
    }
}

function updateSlider_hihat_mixer_gain(value) {
    // document.getElementById("value_hihat_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_hihat_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("hihat_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("hihat_mixer_gain", value);
    }
}

function updateSlider_kick_gain(value) {
    // document.getElementById("value_kick_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_kick_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("kick_gain", value);
    } else {
        loader.audiolib.setFloatParameter("kick_gain", value);
    }
}

function updateSlider_kick_mixer_gain(value) {
    // document.getElementById("value_kick_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_kick_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("kick_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("kick_mixer_gain", value);
    }
}

function updateSlider_music_gain(value) {
    // document.getElementById("value_music_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_music_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("music_gain", value);
    } else {
        loader.audiolib.setFloatParameter("music_gain", value);
    }
}

function updateSlider_music_reverb_dry(value) {
    // document.getElementById("value_music_reverb_dry").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_music_reverb_dry").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("music_reverb_dry", value);
    } else {
        loader.audiolib.setFloatParameter("music_reverb_dry", value);
    }
}

function updateSlider_music_reverb_vol(value) {
    // document.getElementById("value_music_reverb_vol").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_music_reverb_vol").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("music_reverb_vol", value);
    } else {
        loader.audiolib.setFloatParameter("music_reverb_vol", value);
    }
}

function updateSlider_music_reverb_wet(value) {
    // document.getElementById("value_music_reverb_wet").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_music_reverb_wet").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("music_reverb_wet", value);
    } else {
        loader.audiolib.setFloatParameter("music_reverb_wet", value);
    }
}

function updateSlider_snare_gain(value) {
    // document.getElementById("value_snare_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_snare_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("snare_gain", value);
    } else {
        loader.audiolib.setFloatParameter("snare_gain", value);
    }
}

function updateSlider_snare_mixer_gain(value) {
    // document.getElementById("value_snare_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_snare_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("snare_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("snare_mixer_gain", value);
    }
}

function updateSlider_synth_delay(value) {
    // document.getElementById("value_synth_delay").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_delay").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_delay", value);
    } else {
        loader.audiolib.setFloatParameter("synth_delay", value);
    }
}

function updateSlider_synth_delay_vol(value) {
    // document.getElementById("value_synth_delay_vol").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_delay_vol").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_delay_vol", value);
    } else {
        loader.audiolib.setFloatParameter("synth_delay_vol", value);
    }
}

function updateSlider_synth_gain(value) {
    // document.getElementById("value_synth_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_gain", value);
    } else {
        loader.audiolib.setFloatParameter("synth_gain", value);
    }
}

function updateSlider_synth_highpass(value) {
    // document.getElementById("value_synth_highpass").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_highpass").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_highpass", value);
    } else {
        loader.audiolib.setFloatParameter("synth_highpass", value);
    }
}

function updateSlider_synth_lowpass(value) {
    // document.getElementById("value_synth_lowpass").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_lowpass").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_lowpass", value);
    } else {
        loader.audiolib.setFloatParameter("synth_lowpass", value);
    }
}

function updateSlider_synth_mixer_gain(value) {
    // document.getElementById("value_synth_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("synth_mixer_gain", value);
    }
}

function updateSlider_synth_reverb_dry(value) {
    // document.getElementById("value_synth_reverb_dry").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_reverb_dry").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_reverb_dry", value);
    } else {
        loader.audiolib.setFloatParameter("synth_reverb_dry", value);
    }
}

function updateSlider_synth_reverb_vol(value) {
    // document.getElementById("value_synth_reverb_vol").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_reverb_vol").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_reverb_vol", value);
    } else {
        loader.audiolib.setFloatParameter("synth_reverb_vol", value);
    }
}

function updateSlider_synth_reverb_wet(value) {
    // document.getElementById("value_synth_reverb_wet").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_synth_reverb_wet").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("synth_reverb_wet", value);
    } else {
        loader.audiolib.setFloatParameter("synth_reverb_wet", value);
    }
}

function updateSlider_toggle_bang(value) {
    // document.getElementById("value_toggle_bang").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_toggle_bang").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("toggle_bang", value);
    } else {
        loader.audiolib.setFloatParameter("toggle_bang", value);
    }
}

function updateSlider_toggle_highpass(value) {
    // document.getElementById("value_toggle_highpass").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_toggle_highpass").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("toggle_highpass", value);
    } else {
        loader.audiolib.setFloatParameter("toggle_highpass", value);
    }
}

function updateSlider_toggle_lowpass(value) {
    // document.getElementById("value_toggle_lowpass").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_toggle_lowpass").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("toggle_lowpass", value);
    } else {
        loader.audiolib.setFloatParameter("toggle_lowpass", value);
    }
}

function updateSlider_toggle_mixer_gain(value) {
    // document.getElementById("value_toggle_mixer_gain").textContent = Number(value).toFixed(2);
    // document.getElementById("parameter_toggle_mixer_gain").value = value;
    if (loader.webAudioWorklet) {
        loader.sendFloatParameterToWorklet("toggle_mixer_gain", value);
    } else {
        loader.audiolib.setFloatParameter("toggle_mixer_gain", value);
    }
}