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
    <canvas ref="canvasRef" width="640" height="480"></canvas>
    <pre v-if="!res">Loading...</pre>
    <p>{{ res }}</p>
    <video
      ref="videoRef"
      autoplay
      playsinline
      style="position: fixed; top: 0; left: 0; opacity: 0; pointer-events: none"
    ></video>
  </div>
</template>
