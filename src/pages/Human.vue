<script setup lang="ts">
import { onMounted, ref } from "vue";
import Human from "@vladmandic/human";
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const res = ref(null);
const human = new Human({
  backend: "webgl",
});

onMounted(async () => {
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {},
  });
  if (videoRef.value) {
    videoRef.value.srcObject = videoStream;
  }
  async function detectVideo() {
    if (videoRef.value) {
      const result = await human.detect(videoRef.value);
      const {
        face,
        body,
        hand,
        gesture,
        object,
        performance,
        canvas,
        timestamp,
        persons,
      } = result;
      human.draw.canvas(result.canvas, canvasRef.value);
      human.draw.all(canvasRef.value, result);
      res.value = { hand, gesture, object, persons, face };
    }
    requestAnimationFrame(detectVideo);
  }
  detectVideo();
});
</script>

<template>
  <div>
    <p v-if="!res">Loading...</p>
    <canvas ref="canvasRef" width="640" height="480"></canvas>
    <video ref="videoRef" autoplay playsinline></video>
    <pre>{{ res }}</pre>
  </div>
</template>
