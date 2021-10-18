<script setup lang="ts">
//@ts-nocheck
import { ref, onMounted } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const predictions = ref<cocoSsd.DetectedObject[] | null>(null);
const width = ref(0);
const height = ref(0);

onMounted(async () => {
  // const devices = await navigator.mediaDevices.enumerateDevices();
  // console.log(devices);
  // const videoStream = await navigator.mediaDevices.getUserMedia({
  //   video: {
  //     deviceId:
  //       "4e51f67844f0d40aa0a002fe8d8413faf5230dd328d8235f6b9b87d9ad9dfb1c",
  //   },
  // });
  // videoRef.value.srcObject = videoStream;

  videoRef.value.addEventListener("loadedmetadata", (e) => {
    width.value = e.target.videoWidth;
    height.value = e.target.videoHeight;
  });

  const ctx = canvasRef.value.getContext("2d");

  const model = await cocoSsd.load();

  function center(bbox) {
    const cX = bbox[2] / 2 + bbox[0];
    const cY = bbox[3] / 2 + bbox[1];
    return [cX, cY];
  }

  async function step() {
    predictions.value = await model.detect(videoRef.value, 100, 0.1);
    ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);
    for (let i = 0; i < predictions.value.length; i++) {
      const cX =
        predictions.value[i].bbox[2] / 2 + predictions.value[i].bbox[0];
      const cY =
        predictions.value[i].bbox[3] / 2 + predictions.value[i].bbox[1];
      ctx.beginPath();
      ctx.rect(...predictions.value[i].bbox);
      if (i > 0) {
        ctx.moveTo(...center(predictions.value[i].bbox));
        ctx.lineTo(...center(predictions.value[i - 1].bbox));
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = "green";
      ctx.fillStyle = "green";
      ctx.rect(...[...center(predictions.value[i].bbox), 10, 10]);
      ctx.stroke();
      ctx.font = "50px Arial";
      ctx.fillText(
        `${predictions.value[i].class} ${predictions.value[i].score.toFixed(
          3
        )} `,
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
  <div style="transform: scale(1)">
    <p v-if="!predictions">Loading...</p>
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      style="width: 50vw"
    ></canvas>
    <video
      ref="videoRef"
      autoplay
      muted
      loop
      src="/sample1.mp4"
      style="width: 50vw"
    />
    <pre>{{ predictions }}</pre>
  </div>
</template>
