<script setup lang="ts">
//@ts-nocheck
import { ref, onMounted, computed } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useRafFn } from "@vueuse/core";
import { buffer } from "@tensorflow/tfjs-core";

import { draw } from "../utils/draw";
import { mapObject } from "../utils/objects";
import { center } from "../utils/utils";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const predictions = ref<cocoSsd.DetectedObject[] | null>(null);
const width = ref(0);
const height = ref(0);
const objects = ref([]);
const playing = ref(false);

onMounted(async () => {
  // const devices = await navigator.mediaDevices.enumerateDevices();
  // const videoStream = await navigator.mediaDevices.getUserMedia({
  //   video: {
  //     fps: 10,
  //     deviceId:
  //       "4e51f67844f0d40aa0a002fe8d8413faf5230dd328d8235f6b9b87d9ad9dfb1c",
  //   },
  // });
  // videoRef.value.srcObject = videoStream;

  videoRef.value.addEventListener("loadedmetadata", (e) => {
    width.value = e.target.videoWidth;
    height.value = e.target.videoHeight;
  });

  videoRef.value.addEventListener("playing", (e) => {
    playing.value = true;
  });

  videoRef.value.addEventListener("seeking", (e) => {
    playing.value = false;
  });

  const ctx = canvasRef.value.getContext("2d");

  const model = await cocoSsd.load();

  let frameCount = 0;
  const limit = 60;
  const HAVE_ENOUGH_DATA = 4;
  useRafFn(async () => {
    if (videoRef.value?.readyState === HAVE_ENOUGH_DATA) {
      predictions.value = await model.detect(videoRef.value, 100, 0.4);

      predictions.value
        .map((p) => {
          p.center = center(p.bbox);
          return p;
        })
        .filter((p) => p.class === "person")
        .map((p) => mapObject(p, objects));

      ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);
      draw(ctx, objects);

      if (frameCount > limit) {
        //objects.value = [];
        frameCount = 0;
      } else {
        frameCount++;
      }
      if (videoRef.value.currentTime > 2) {
        //videoRef.value.currentTime = 0;
      }
    }
  });
});
</script>

<template>
  <div>
    <p>Status: {{ playing ? "Playing" : "Not playing" }}</p>
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
      src="/sample4.mp4"
      style="width: 50vw"
    />
    <!-- <video ref="videoRef" autoplay muted loop style="width: 100vw" /> -->
    <div
      style="
        opacity: 0;
        position: fixed;
        top: 0;
        right: 0px;
        bottom: 0;
        width: 300px;
        padding: 10px;
        background: #000000dd;
        font-family: monospace;
        color: white;
        overflow: auto;
      "
    >
      {{ objects }}
    </div>
  </div>
</template>
