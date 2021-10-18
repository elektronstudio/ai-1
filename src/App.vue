<template>
  <div>
    <div style="display: flex; margin-bottom: 16px; gap: 16px">
      <RouterLink to="/">CocoSSD object detection</RouterLink>
      <RouterLink to="/app2">Human.js human detection</RouterLink>
      <RouterLink to="/app3">TF Holistic human detection</RouterLink>
    </div>
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </div>
</template>
