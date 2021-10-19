<script setup lang="ts">
import * as Tone from "tone";
import { ref } from "vue";

const frame = ref(0);

const fps = 60;
const musicFps = 1;
const length = 5;
let values = [];

const synths = Array.from({ length }).map((_) =>
  new Tone.Synth({
    portamento: (1 / fps) * 0.5,
  }).toDestination()
);
const outlierSynth = new Tone.MonoSynth({
  portamento: (1 / fps) * 0.5,
}).toDestination();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const predictions = ref<cocoSsd.DetectedObject[] | null>(null);
const width = ref(0);
const height = ref(0);

const onStart = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log(devices);
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId:
        "4e51f67844f0d40aa0a002fe8d8413faf5230dd328d8235f6b9b87d9ad9dfb1c",
    },
  });
  if (videoRef.value && canvasRef.value) {
    videoRef.value.srcObject = videoStream;
    videoRef.value.addEventListener("loadedmetadata", (e) => {
      width.value = e?.target?.videoWidth;
      height.value = e?.target?.videoHeight;
    });
  }

  const ctx = canvasRef.value.getContext("2d");

  Tone.start().then(() => {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        frame.value = Math.floor((time * fps) % fps);

        // Video

        ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);

        // Sound

        if (frame.value % musicFps === 0) {
          values = Array.from({ length }).map((_) => 100 + Math.random() * 10);
          values.forEach((freq, i) => {
            synths[i].triggerAttackRelease(freq, 1 / fps);
          });
          // if (frame.value === 0) {
          //   outlierSynth.triggerAttackRelease(
          //     200 + Math.random() * 200 - 100,
          //     1 / fps
          //   );
          // }
        }
      }, time);
    }, 1 / fps).start(0);
    Tone.Transport.start();
  });
};
</script>

<template>
  <div>
    <pre>{{ frame }}</pre>
    <pre>{{ frame % musicFps === 0 ? "beat" : " " }}</pre>
    <button @click="onStart">Start</button>
    <div style="transform: scale(1)">
      <canvas
        ref="canvasRef"
        :width="width"
        :height="height"
        style="width: 75vw"
      ></canvas>
      <video ref="videoRef" autoplay muted loop style="width: 75vw" />
    </div>
  </div>
</template>
