<script setup lang="ts">
import Human from "@vladmandic/human";

import { onMounted, ref } from "vue";
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const human = new Human({
  backend: "webgl",
  modelBasePath: "/models",
});

onMounted(async () => {
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: { frameRate: 10 },
  });
  // console.log(videoStream);
  // console.log(videoRef.value.srcObject);
  if (videoRef.value) {
    videoRef.value.srcObject = videoStream;
  }
  // navigator.mediaDevices
  //   .getUserMedia({ video: { frameRate: 10 } })
  //   .then((stream) => (videoRef.value.srcObject = stream))
  //   .catch((e) => console.log(e));

  // async function detectVideo() {
  //   const result = await human.detect(videoRef.value);
  //   human.draw.all(canvasRef.value, result);
  //   requestAnimationFrame(detectVideo);
  // }
  // detectVideo();
});
</script>

<template>
  <div>
    <video ref="videoRef" autoplay playsinline></video>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
