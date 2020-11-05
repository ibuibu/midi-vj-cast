let localStream;

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    const videoElm = document.getElementById("my-video");
    videoElm.srcObject = stream;
    videoElm.play();
    localStream = stream;
  })
  .catch((error) => {
    console.error("mediaDevice.getUserMedia() error:", error);
    return;
  });

navigator.mediaDevices
  .enumerateDevices()
  .then((devices) => {
    devices.forEach(function (device) {
      // console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
      var micList = document.getElementById("mic_list");
      if (device.kind === "audioinput") {
        var id = device.deviceId;
        var label = device.label || "microphone"; // label is available for https
        var option = document.createElement("option");
        option.setAttribute("value", id);
        option.innerHTML = label;
        micList.appendChild(option);
      } else if (device.kind === "videoinput") {
        // console.log("video input device:" + device.label);
      } else if (device.kind === "audiooutput") {
        // console.log("audio output device:" + device.label);
      } else {
        console.error("UNKNOWN Device kind:" + device.kind);
      }
    });
  })
  .catch(function (err) {
    console.error("enumerateDevide ERROR:", err);
  });

const getSelectedAudio = () => {
  var id = document.getElementById("mic_list").options[
    document.getElementById("mic_list").selectedIndex
  ].value;
  return id;
};

const rejoin = async () => {
  let audioId = getSelectedAudio();
  let newAudioTrack;
  let constraints = {
    audio: {
      deviceId: audioId,
      channelCount: 2,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: true,
  };

  //音声だけ取得
  let userStream = await navigator.mediaDevices.getUserMedia(constraints);
  newAudioTrack = userStream.getAudioTracks()[0];

  //displayの映像だけ取得
  let displayStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });

  //videoタグに埋め込み
  const videoElm = document.getElementById("my-video");
  videoElm.srcObject = displayStream;
  videoElm.play();

  displayStream.addTrack(newAudioTrack);
  localStream = displayStream;
};

document.getElementById("setting").addEventListener("click", () => {
  rejoin();
});

const peer = new Peer({
  key: window.__SKYWAY_KEY__,
  debug: 1,
  config: {
    encodedInsertableStreams: true,
  },
});

document.getElementById("join-room").onclick = () => {
  const roomName = document.getElementById("room-name").value;
  const room = peer.joinRoom(roomName, {
    mode: "mesh",
    stream: localStream,
  });
  room.once("open", () => {
    console.log("aa");
    const receiverLink = document.createElement("a");
    receiverLink.href = "/receiver.html#" + roomName;
    receiverLink.textContent = "配信用URLリンク";
    receiverLink.target = "_blank";
    document.getElementById("receiver-link").appendChild(receiverLink);
  });
  room.on("stream", async (stream) => {
    document.getElementById("their-video").srcObject = stream;
    document.getElementById("their-video").play();

    const mediaConnection = Object.keys(room.connections).map((id) => {
      return room.connections[id][0];
    })[0];
    setTimeout(() => {
      const pc = mediaConnection.getPeerConnection();
      senderTransform(pc);
    }, 1000);
  });
};

const senderTransform = (pc) => {
  pc.getSenders().forEach((sender) => {
    const senderStreams = sender.createEncodedStreams();
    const readableStream = senderStreams.readable;
    const writableStream = senderStreams.writable;
    const transformStream = new TransformStream({
      transform: (encodedFrame, controller) => {
        const len = encodedFrame.data.byteLength;
        if (sender.track.kind === "video") {
          const container = new Uint8Array(len + 10);
          container.set(new Uint8Array(encodedFrame.data), 0);
          const num = new Uint8Array(10);
          for (let i = 0; i < 10; i++) {
            if (vjEvents[i]) {
              num[i] = vjEvents[i];
            }
          }
          container.set(num, encodedFrame.data.byteLength);
          encodedFrame.data = container.buffer;
        }
        controller.enqueue(encodedFrame);
      },
    });
    readableStream.pipeThrough(transformStream).pipeTo(writableStream);
  });
};
