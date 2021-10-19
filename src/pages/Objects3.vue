<script setup lang="ts">
//@ts-nocheck
import { ref, onMounted, computed } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useRafFn } from "@vueuse/core";
import { buffer } from "@tensorflow/tfjs-core";

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
  // const devices = await navigator.mediaDevices.enumerateDevices();
  // const videoStream = await navigator.mediaDevices.getUserMedia({
  //   video: {
  //     fps: 10,
  //     deviceId:
  //       "4e51f67844f0d40aa0a002fe8d8413faf5230dd328d8235f6b9b87d9ad9dfb1c",
  //   },
  // });
  //videoRef.value.srcObject = videoStream;

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
  const limit = 60;
  const bufferSize = 50;
  useRafFn(async () => {
    if (width.value) {
      predictions.value = await model.detect(videoRef.value, 100, 0.5);

      predictions.value
        .map((p) => {
          p.center = center(p.bbox);
          return p;
        })
        .filter((p) => p.class === "person")
        .forEach((p, i) => {
          const objectIndex = objects.findIndex((o) =>
            pointInsideCircle(...p.center, ...o.center, 150)
          );
          if (objectIndex > -1) {
            objects[objectIndex].currentCenter = p.center;
            if (objects[objectIndex].buffer.length > bufferSize - 1) {
              objects[objectIndex].buffer.shift();
            }
            objects[objectIndex].buffer.push(p.center);
          } else {
            objects.forEach((_, i) => (objects[i].updated = false));
            objects.push({
              ...p,
              currentCenter: p.center,
              updated: true,
              buffer: [p.center],
            });
            //console.log("new");
          }
        });

      ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);
      ctx.font = "20px Arial";
      objects.forEach((o, i) => {
        o.buffer.forEach((b, j) => {
          ctx.fillStyle = `hsl(${i * 30},100%,50%,0.05)`;
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "red";
          ctx.arc(b[0], b[1], 30 + j, 0, 2 * Math.PI);
          // ctx.arc(...o.center, 10, 0, 2 * Math.PI);
          // ctx.stroke();
          //ctx.arc(...o.currentCenter, 50, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();
        });
      });

      if (count > limit) {
        //objects = [];
        count = 0;
      } else {
        count++;
      }
      if (videoRef.value.currentTime > 3) {
        videoRef.value.currentTime = 0;
      }
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
    <div style="position: relative">
      <video
        ref="videoRef"
        autoplay
        muted
        loop
        src="/sample2.mp4"
        style="position: absolute; top: 0; left: 0; width: 100vw"
      />
      <canvas
        ref="canvasRef"
        :width="width"
        :height="height"
        style="position: absolute; top: 0; left: 0; width: 100vw"
      ></canvas>
    </div>
    <!-- <video ref="videoRef" autoplay muted loop style="width: 100vw" /> -->
  </div>
</template>
