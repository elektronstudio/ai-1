<script setup lang="ts">
//@ts-nocheck
import * as Tone from "tone";
import { ref } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const frame = ref(0);

const fps = 10;
const videoFps = 2;
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

function center(bbox) {
  const cX = bbox[2] / 2 + bbox[0];
  const cY = bbox[3] / 2 + bbox[1];
  return [cX, cY];
}

function pointInsideCircle(x, y, cx, cy, radius) {
  const distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  return distancesquared <= radius * radius;
}

const onStart = async () => {
  const model = await cocoSsd.load();
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId:
        "4e51f67844f0d40aa0a002fe8d8413faf5230dd328d8235f6b9b87d9ad9dfb1c",
    },
  });
  if (videoRef.value && canvasRef.value) {
    videoRef.value.srcObject = videoStream;
    videoRef.value.addEventListener("loadeddata", (e) => {
      width.value = e?.target?.videoWidth;
      height.value = e?.target?.videoHeight;
    });
  }

  const ctx = canvasRef.value.getContext("2d");

  let count = 0;
  let prevCenter = [0, 0];
  let drawableCenter = [0, 0];
  let objects = [];
  const limit = 5;

  Tone.start().then(() => {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(async () => {
        frame.value = Math.floor((time * fps) % fps);

        // Video

        if (frame.value % videoFps === 0) {
          if (width.value) {
            predictions.value = await model.detect(videoRef.value, 100, 0.5);
            ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);

            predictions.value
              .map((p) => {
                p.center = center(p.bbox);
                return p;
              })
              .filter((p) => p.class === "person")
              .forEach((p, i) => {
                const objectIndex = objects.findIndex((o) =>
                  pointInsideCircle(...p.center, ...o.center, 100)
                );
                if (objectIndex > -1) {
                  objects[objectIndex].currentCenter = p.center;
                } else {
                  objects.forEach((_, i) => (objects[i].updated = false));
                  objects.push({
                    ...p,
                    currentCenter: p.center,
                    updated: true,
                  });
                }
              });

            //

            ctx.font = "20px Arial";
            ctx.fillStyle = "green";

            objects.forEach((o) => {
              ctx.beginPath();
              ctx.lineWidth = 1;
              ctx.strokeStyle = "green";
              ctx.arc(...o.center, 100, 0, 2 * Math.PI);
              ctx.arc(...o.center, 10, 0, 2 * Math.PI);
              ctx.stroke();
              ctx.strokeStyle = "red";
              ctx.arc(...o.currentCenter, 10, 0, 2 * Math.PI);
              ctx.stroke();
              ctx.closePath();
            });

            if (frame.value === limit) {
              objects = [];
            }
          }
        }
        // Sound

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
      }, time);
    }, 1 / fps).start(0);
    Tone.Transport.start();
  });
};
</script>

<template>
  <div>
    <pre>{{ frame }}</pre>
    <pre>{{ frame % videoFps === 0 ? "beat" : " " }}</pre>
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
