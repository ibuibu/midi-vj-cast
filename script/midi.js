let num = new Uint8Array(3);
const dataList = document.querySelector("#midi-data ul");
let midiDevices = [];
let deviceNotes = [];

//for sketch
let vjEvents = [];
let lastInputs;
let params = [];

const onMIDISuccess = (midiData) => {
  console.log("MIDI connect success!!!");
  const allInputs = midiData.inputs.values();
  const midiSelect = document.getElementById("midi-select");
  for (const input of allInputs) {
    const opt = document.createElement("option");
    opt.value = input.id;
    opt.textContent = input.name;
    midiSelect.appendChild(opt);
    midiDevices.push(input);
  }
};

document.getElementById("midi-setting").onclick = () => {
  const idx = document.getElementById("midi-select").selectedIndex - 1;
  const midiDevice = midiDevices[idx];
  midiDevice.onmidimessage = gotMIDImessage;
  const paramNum = document.getElementById("param-select").selectedIndex - 1;
  deviceNotes.push({ id: midiDevice.id, notes: [], paramNum: paramNum });
  //midiデバイス名をDOMに挿入
  const elm = document.createElement("p");
  elm.id = midiDevice.id;
  elm.innerHTML = midiDevice.name;
  document.getElementById("midi-data").appendChild(elm);
};

const onMIDIFailure = () => {
  console.warn("Not recognising MIDI controller");
};

const gotMIDImessage = (msg) => {
  const status = msg.data[0];
  const note = msg.data[1];
  const velocity = msg.data[2];
  const deviceId = msg.currentTarget.id;
  const deviceName = msg.currentTarget.name;
  document.getElementById("num1").value = status;
  document.getElementById("num2").value = note;
  document.getElementById("num3").value = velocity;
  document.getElementById("device").value = deviceName;
  // Pushed
  if (status === 144) {
    lastInputs = [status, note];
    for (const device of deviceNotes) {
      const notes = device.notes;
      const idx = notes.indexOf(note);
      if (device.id === deviceId) {
        if (idx === -1) {
          notes.push(note);
          const newItem = document.createElement("li");
          newItem.appendChild(document.createTextNode(note));
          const selection = document.createElement("select");
          selection.id = "sel" + device.id + note;
          selection.appendChild(setOption(""));
          for (const param of params[device.paramNum]) {
            selection.appendChild(setOption(param));
          }
          selection.selectedIndex = notes.length;
          newItem.appendChild(selection);
          const dataList = document.getElementById(deviceId);
          dataList.appendChild(newItem);
        }
        vjEvents.push(+document.getElementById("sel" + device.id + note).value);
      }
    }
  } else {
    // Released
    for (const device of deviceNotes) {
      if (device.id === deviceId) {
        vjEvents = vjEvents.filter(
          (n) => n !== +document.getElementById("sel" + device.id + note).value
        );
      }
    }
  }
};
const setOption = (name) => {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  return option;
};

if (navigator.requestMIDIAccess) {
  navigator
    .requestMIDIAccess({
      sysex: false,
    })
    .then(onMIDISuccess, onMIDIFailure);
} else {
  console.warn("No MIDI support in your browser");
}
