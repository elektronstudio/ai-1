<script setup lang="ts">
//@ts-nocheck
import { ref, onMounted } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const predictions = ref<cocoSsd.DetectedObject[] | null>(null);

onMounted(async () => {
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {},
  });
  videoRef.value.srcObject = videoStream;
  const ctx = canvasRef.value.getContext("2d");

  const model = await cocoSsd.load();

  //videoRef.value.addEventListener("play", async () => {
  async function step() {
    predictions.value = await model.detect(videoRef.value);
    ctx.drawImage(videoRef.value, 0, 0, 640, 480);
    for (let i = 0; i < predictions.value.length; i++) {
      ctx.beginPath();
      ctx.rect(...predictions.value[i].bbox);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "green";
      ctx.fillStyle = "green";
      ctx.stroke();
      ctx.fillText(
        predictions.value[i].score.toFixed(3) +
          " " +
          predictions.value[i].class,
        predictions.value[i].bbox[0],
        predictions.value[i].bbox[1] > 10
          ? predictions.value[i].bbox[1] - 5
          : 10
      );
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
});
</script>

<template>
  <p v-if="!predictions">Loading...</p>
  <canvas ref="canvasRef" width="640" height="480"></canvas>
  <video ref="videoRef" autoplay />
  <pre>{{ predictions }}</pre>
</template>
