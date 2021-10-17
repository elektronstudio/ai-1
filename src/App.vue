<script setup lang="ts">
import { ref, onMounted } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const imgRef = ref<HTMLImageElement | null>(null);
const predictions = ref<cocoSsd.DetectedObject[]>([]);

onMounted(async () => {
  const model = await cocoSsd.load();
  if (imgRef.value) {
    predictions.value = await model.detect(imgRef.value);
  }
});

const data = [
  {
    bbox: [
      352.39471435546875, 98.01229476928711, 1115.8493041992188,
      932.5198745727539,
    ],
    class: "car",
    score: 0.7384861707687378,
  },
  {
    bbox: [
      507.1244430541992, 526.9650435447693, 251.62731170654297,
      276.28345012664795,
    ],
    class: "car",
    score: 0.5097262263298035,
  },
];
</script>

<template>
  <div>Hello world</div>
  <pre>{{ predictions }}</pre>
  <img ref="imgRef" src="/example1.jpg" />
</template>
