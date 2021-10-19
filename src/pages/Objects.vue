<script setup lang="ts">
//@ts-nocheck
import { ref, onMounted, computed } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useRafFn } from "@vueuse/core";

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

const buf = ref([]);

onMounted(async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log(devices);
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {
      fps: 10,
      //deviceId:
      //  "4e51f67844f0d40aa0a002fe8d8413faf5230dd328d8235f6b9b87d9ad9dfb1c",
    },
  });
  videoRef.value.srcObject = videoStream;

  videoRef.value.addEventListener("loadedmetadata", (e) => {
    width.value = e.target.videoWidth;
    height.value = e.target.videoHeight;
  });

  const ctx = canvasRef.value.getContext("2d");

  const model = await cocoSsd.load();

  let count = 0;
  let prevCenter = [0, 0];
  let drawableCenter = [0, 0];
  let objects = [];
  const limit = 100;

  useRafFn(async () => {
    predictions.value = await model.detect(videoRef.value, 100, 0.5);

    predictions.value
      .map((p) => {
        p.center = center(p.bbox);
        return p;
      })
      .forEach((p, i) => {
        const objectIndex = objects.findIndex((o) =>
          pointInsideCircle(...p.center, ...o.center, 300)
        );
        if (objectIndex > -1) {
          objects[objectIndex].currentCenter = p.center;
        } else {
          objects.forEach((_, i) => (objects[i].updated = false));
          objects.push({ ...p, currentCenter: p.center, updated: true });
          //console.log("new");
        }
      });

    //const center = [Math.random() * 100 + 200, Math.random() * 100 + 200];
    // const objectIndex = objects.findIndex((o) =>
    //   pointInsideCircle(...center, ...o.center, 100)
    // );
    // if (objectIndex > -1) {
    //   //      objects[objectIndex].updated = true;
    // } else {
    //   // objects.forEach((_, i) => (objects[i].updated = false));
    //   objects.push({ updated: true, center });
    //   //console.log("new");
    // }

    // if (!pointInsideCircle(...center, ...prevCenter, 5)) {
    //   console.log("in center");
    // }
    //prevCenter = center;
    // if (objectIndex > -1) {
    //   //objects[objectIndex] = center;
    //   console.log("old");
    // } else {
    //   // objects.push(center);
    //   console.log("new");
    // }

    ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);
    ctx.font = "20px Arial";
    ctx.fillStyle = "green";
    objects
      // .filter((o) => o.updated)
      .forEach((o) => {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "green";
        ctx.arc(...o.center, 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.strokeStyle = "red";
        ctx.arc(...o.currentCenter, 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(...o.center);
        ctx.lineTo(...o.currentCenter);
        ctx.stroke();
        ctx?.closePath();
        ctx.fillText(o.bbox[0], o.center[0] + 10, o.center[0] + 10);
      });
    ctx.fillText(count, 50, 50);
    //ctx.fillText(JSON.stringify(objects.filter((o) => o.updated)), 50, 150);
    // ctx.fillText(
    //   JSON.stringify(objects.filter((o) => !o.updated).length),
    //   50,
    //   200
    // );
    ctx.fillStyle = "red";
    // ctx.fillRect(...center, 10, 10);

    if (count > limit) {
      // objects = objects.map((o) => {
      //   o.updated = false;
      //   return o;
      // });
      objects.forEach((_, i) => (objects[i].updated = false));
      //objects = objects.filter((o) => o.updated);
      count = 0;
    } else {
      count++;
    }
  });

  // async function step() {
  //   if (videoRef.value) {
  //     predictions.value = await model.detect(videoRef.value, 100, 0.5);
  //     ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);
  //     predictions.value
  //       //.filter((p) => p.class === "person")
  //       .map((p) => {
  //         p.center = center(p.bbox);
  //         return p;
  //       })
  //       .forEach((p, i) => {
  //         ctx.beginPath();
  //         ctx.rect(...p.bbox);
  //         if (i > 0) {
  //           ctx.moveTo(...p.center);
  //           ctx.lineTo(...center(predictions.value[i - 1].bbox));
  //         }
  //         ctx.lineWidth = 7;
  //         ctx.strokeStyle = "green";
  //         ctx.fillStyle = "green";
  //         ctx.rect(...[p.center[0] - 25, p.center[1] - 25, 50, 50]);
  //         ctx.stroke();
  //         ctx.font = "50px Arial";
  //         ctx.fillText(
  //           `${p.class} ${p.score.toFixed(3)} `,
  //           p.bbox[0],
  //           p.bbox[1] > 10 ? p.bbox[1] - 5 : 10
  //         );
  //       });
  //   }
  //   requestAnimationFrame(step);
  // }
  // requestAnimationFrame(step);
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
    <!-- <video
      ref="videoRef"
      autoplay
      muted
      loop
      src="/sample1.mp4"
      style="width: 50vw"
    /> -->
    <video ref="videoRef" autoplay muted loop style="width: 50vw" />
    <pre>{{ predictions }}</pre>
  </div>
</template>
