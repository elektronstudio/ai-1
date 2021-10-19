<script setup lang="ts">
import * as Tone from "tone";
import { ref } from "vue";

const a = ref(0);

const synth = new Tone.Synth().toDestination();

const onStart = () => {
  Tone.start().then(() => {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        a.value = Math.floor((time * 60) % 60);
      }, time);
    }, 1 / 60).start(0);
    Tone.Transport.start();
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
    <div>{{ a }}</div>
    <button @click="onStart">Button</button>
  </div>
</template>
