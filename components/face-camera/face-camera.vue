<template>
  <camera class="cam" device-position="front" flash="off" @error="onErr" />
</template>

<script setup>
const emit = defineEmits(['error']);
const onErr = (e) => emit('error', e);
</script>

<style scoped>
.cam { width: 100%; height: 100%; display: block; }
</style>
