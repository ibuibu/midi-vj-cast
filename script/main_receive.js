let localStream;
let vjEvents = [];
let lastInputs;
let params = [];

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

const peer = new Peer({
  key: window.__SKYWAY_KEY__,
  debug: 1,
  config: {
    encodedInsertableStreams: true,
  },
});

peer.on("open", () => {
  const roomName = location.hash.slice(1);
  const room = peer.joinRoom(roomName, {
    mode: "mesh",
    stream: localStream,
  });
  room.on("stream", async (stream) => {
    document.getElementById("their-video").srcObject = stream;
    document.getElementById("their-video").play();

    const mediaConnection = Object.keys(room.connections).map((id) => {
      return room.connections[id][0];
    })[0];
    setTimeout(() => {
      const pc = mediaConnection.getPeerConnection();
      receiverTransform(pc);
    }, 1000);
  });
});


const receiverTransform = (pc) => {
  pc.getReceivers().forEach((receiver) => {
    const receiverStreams = receiver.createEncodedStreams();
    const readableStream = receiverStreams.readable;
    const writableStream = receiverStreams.writable;
    const transformStream = new TransformStream({
      transform: (encodedFrame, controller) => {
        if (receiver.track.kind === "video") {
          const mediaData = new Uint8Array(encodedFrame.data.slice(0, -1));
          const num = new Uint8Array(encodedFrame.data.slice(-10));
          // console.log(num);
          vjEvents = num.slice();
          lastInputs = num[0];
          encodedFrame.data = mediaData.buffer;
        }
        controller.enqueue(encodedFrame);
      },
    });
    readableStream.pipeThrough(transformStream).pipeTo(writableStream);
  });
};

const setOption = (name) => {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  return option;
};
