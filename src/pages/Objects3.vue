<script setup lang="ts">
//@ts-nocheck
import { ref, onMounted, computed } from "vue";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useRafFn } from "@vueuse/core";
import { buffer } from "@tensorflow/tfjs-core";
import standardDeviation from "just-standard-deviation";
import { line, curveCatmullRomClosed } from "d3-shape";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const predictions = ref<cocoSsd.DetectedObject[] | null>(null);
const width = ref(0);
const height = ref(0);

const objects = ref([]);

function center(bbox) {
  const cX = bbox[2] / 2 + bbox[0];
  const cY = bbox[3] / 2 + bbox[1];
  return [cX, cY];
}

const distance = (x1, y1, x2, y2) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

const linepoint = (x1, y1, x2, y2, d) => {
  const dis = distance(x1, y1, x2, y2);
  const x3 = x1 + (d / dis) * (x2 - x1);
  const y3 = y1 + (d / dis) * (y2 - y1);
  return [x3, y3];
};

function pointInsideCircle(x, y, cx, cy, radius) {
  const distancesquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  return distancesquared <= radius * radius;
}

const buf = ref([]);
const status = ref("");
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

  // videoRef.value.addEventListener("loadeddata", (e) => {
  //   playing.value = true;
  // });

  videoRef.value.addEventListener("seeking", (e) => {
    playing.value = false;
  });

  const statuses =
    "abort canplay canplaythrough durationchange emptied encrypted ended error interruptbegin interruptend loadeddata loadedmetadata loadstart mozaudioavailable pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(
      " "
    );

  statuses.forEach((s) => {
    videoRef.value.addEventListener(s, (e) => {
      console.log(s);
    });
  });

  const ctx = canvasRef.value.getContext("2d");

  const model = await cocoSsd.load();

  let count = 0;
  let prevCenter = [0, 0];
  let drawableCenter = [0, 0];
  const limit = 60;
  const bufferSize = 20;

  useRafFn(async () => {
    if (playing.value) {
      predictions.value = await model.detect(videoRef.value, 100, 0.4);

      predictions.value
        .map((p) => {
          p.center = center(p.bbox);
          return p;
        })
        .filter((p) => p.class === "person")
        .forEach((p, i) => {
          const objectIndex = objects.value.findIndex((o) =>
            pointInsideCircle(...p.center, ...o.center, 150)
          );
          if (objectIndex > -1) {
            objects.value[objectIndex].currentCenter = p.center;
            if (objects.value[objectIndex].buffer.length > bufferSize - 1) {
              objects.value[objectIndex].buffer.shift();
            }
            objects.value[objectIndex].buffer.push(p.center);
            objects.value[objectIndex].xDev = standardDeviation(
              objects.value[objectIndex].buffer.map(([x, y]) => x)
            );
            objects.value[objectIndex].yDev = standardDeviation(
              objects.value[objectIndex].buffer.map(([x, y]) => y)
            );
            objects.value[objectIndex].still =
              objects.value[objectIndex].xDev < 5;
          } else {
            objects.value.forEach((_, i) => (objects.value[i].updated = false));
            objects.value.push({
              ...p,
              currentCenter: p.center,
              updated: true,
              buffer: [p.center],
              still: false,
            });
            //console.log("new");
          }
        });

      ctx.drawImage(videoRef.value, 0, 0, width.value, height.value);
      ctx.font = "20px Arial";
      objects.value.forEach((o, i) => {
        o.buffer.forEach((b, j) => {
          ctx.fillStyle = `hsl(${i * 30},100%,50%,1)`;
          ctx.beginPath();
          ctx.strokeStyle = "red";
          ctx.arc(b[0], b[1], 30 + j, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();
        });
        if (o.still) {
          ctx.lineWidth = 5;
          ctx.arc(...o.currentCenter, 50, 0, 2 * Math.PI);
          ctx.stroke();
          //ctx.closePath();
          // objects.value
          //   .filter((oo) => oo.still)
          //   .forEach((oo, i) => {
          //     ctx.beginPath();
          //     line().context(ctx)([o.currentCenter, oo.currentCenter]);
          //     ctx.stroke();
          //     ctx.closePath();
          //   });
        }
        ctx.lineWidth = 50;
        ctx.strokeStyle = "rgba(255,255,0,0.1)";
        line().curve(curveCatmullRomClosed.alpha(1)).context(ctx)(
          objects.value.filter((oo) => oo.still).map((oo) => oo.currentCenter)
        );
        ctx.stroke();
        ctx.closePath();
      });

      if (count > limit) {
        objects.value = [];
        count = 0;
      } else {
        count++;
      }
      if (videoRef.value.currentTime > 2) {
        videoRef.value.currentTime = 0;
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
      style="width: 100vw"
    ></canvas>
    <video
      ref="videoRef"
      autoplay
      muted
      loop
      src="/sample2.mp4"
      style="width: 100vw"
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
