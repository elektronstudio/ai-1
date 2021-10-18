<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  Holistic,
  POSE_CONNECTIONS,
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
} from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const videoRef = ref<HTMLVideoElement>();
const canvasRef = ref<HTMLCanvasElement>();
const r = ref(null);

onMounted(async () => {
  const videoStream = await navigator.mediaDevices.getUserMedia({
    video: {},
  });
  if (videoRef.value) {
    videoRef.value.srcObject = videoStream;
  }
  let ctx: CanvasRenderingContext2D | null = null;
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d");
  }

  function onResults(results) {
    r.value = results;
    if (canvasRef.value && ctx) {
      ctx.save();
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      ctx.drawImage(
        results.segmentationMask,
        0,
        0,
        canvasRef.value.width,
        canvasRef.value.height
      );

      // Only overwrite existing pixels.
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);

      // Only overwrite missing pixels.
      ctx.globalCompositeOperation = "destination-atop";
      ctx.drawImage(
        results.image,
        0,
        0,
        canvasRef.value.width,
        canvasRef.value.height
      );

      ctx.globalCompositeOperation = "source-over";
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 4,
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
      drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
        color: "#C0C0C070",
        lineWidth: 1,
      });
      drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
        color: "#CC0000",
        lineWidth: 5,
      });
      drawLandmarks(ctx, results.leftHandLandmarks, {
        color: "#00FF00",
        lineWidth: 2,
      });
      drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
        color: "#00CC00",
        lineWidth: 5,
      });
      drawLandmarks(ctx, results.rightHandLandmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
      ctx.restore();
    }
  }

  const holistic = new Holistic({
    locateFile: (file) => {
      return `/holistic/${file}`;
    },
  });
  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  holistic.onResults(onResults);

  const camera = new Camera(videoRef.value, {
    onFrame: async () => {
      await holistic.send({ image: videoRef.value });
    },
    width: 640,
    height: 480,
  });
  camera.start();
});
</script>

<template>
  <p v-if="!r">Loading...</p>
  <canvas ref="canvasRef" width="640" height="480"></canvas>
  <video ref="videoRef" autoplay style="opacity: 1" />
  <pre>{{ r }}</pre>
</template>
