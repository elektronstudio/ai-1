<script setup lang="ts">
import * as Tone from "tone";
import { ref } from "vue";

const frame = ref(0);

const fps = 1;
const length = 50;

const synths = Array.from({ length }).map((_) =>
  new Tone.Synth().toDestination()
);

let values = [];

const onStart = () => {
  Tone.start().then(() => {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        frame.value = Math.floor((time * fps) % fps);
        values = Array.from({ length }).map((_) => 100 + Math.random() * 10);
        if (frame.value === 0) {
          values[10] = values[10] + 500 + Math.random() * 500;
        }
        values.forEach((freq, i) => {
          synths[i].triggerAttackRelease(freq, 1 / fps);
        });
      }, time);
    }, 1 / fps).start(0);
    Tone.Transport.start();
    //const osc = new Tone.Oscillator(440, "sine").toDestination().start();
  });
};

// const sampler = new Tone.Sampler({
//   urls: {
//     A1: "floaty01.mp3",
//   },
//   baseUrl: "https://elektron.fra1.digitaloceanspaces.com/assets/",
//   attack: 0.1,
//   decay: 0.2,
//   sustain: 1,
//   release: 1,
//   volume: 10,
//   onload: () => (samplerLoaded.value = true),
// })
//   .connect(new Tone.Reverb(1))
//   .toDestination();
</script>

<template>
  <div>
    <pre>{{ frame }}</pre>
    <button @click="onStart">Button</button>
  </div>
</template>
