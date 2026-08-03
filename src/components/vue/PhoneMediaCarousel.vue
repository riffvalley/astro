<script setup lang="ts">
import { ref } from 'vue';

export interface CarouselSlide {
  id: string;
  url: string;
  isVideo?: boolean;
}

const props = withDefaults(defineProps<{ slides: CarouselSlide[]; autoplaySingle?: boolean }>(), {
  autoplaySingle: true,
});

const activeIndex = ref(0);

function next() {
  activeIndex.value = (activeIndex.value + 1) % props.slides.length;
}

function prev() {
  activeIndex.value = (activeIndex.value - 1 + props.slides.length) % props.slides.length;
}

let dragStartX = 0;

function onPointerDown(event: PointerEvent) {
  dragStartX = event.clientX;
}

function onPointerUp(event: PointerEvent) {
  const delta = event.clientX - dragStartX;
  if (Math.abs(delta) < 40) return;
  if (delta < 0) next();
  else prev();
}
</script>

<template>
  <div class="carousel">
    <div
      class="carousel-track"
      :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
    >
      <div v-for="slide in slides" :key="slide.id" class="carousel-slide">
        <video
          v-if="slide.isVideo"
          :src="slide.url"
          class="carousel-media"
          controls
          playsinline
          loop
          :autoplay="autoplaySingle && slides.length === 1"
        ></video>
        <img v-else :src="slide.url" alt="" class="carousel-media" />
      </div>
    </div>

    <template v-if="slides.length > 1">
      <button type="button" class="carousel-nav carousel-nav--prev" aria-label="Foto anterior" @click="prev">‹</button>
      <button type="button" class="carousel-nav carousel-nav--next" aria-label="Foto siguiente" @click="next">›</button>
      <div class="carousel-dots" role="tablist">
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          type="button"
          class="carousel-dot"
          :class="{ 'carousel-dot--active': i === activeIndex }"
          role="tab"
          :aria-selected="i === activeIndex"
          :aria-label="`Foto ${i + 1} de ${slides.length}`"
          @click="activeIndex = i"
        ></button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-paper-3);
  touch-action: pan-y;
}

.carousel-track {
  display: flex;
  transition: transform 220ms var(--ease-out, ease);
}

.carousel-slide {
  flex: 0 0 100%;
  min-width: 0;
}

.carousel-media {
  width: 100%;
  max-height: 20rem;
  display: block;
  object-fit: contain;
  background: var(--color-paper-3);
}

.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 9999px;
  background: color-mix(in srgb, black 45%, transparent);
  color: white;
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
}

.carousel-nav--prev {
  left: 0.4rem;
}

.carousel-nav--next {
  right: 0.4rem;
}

.carousel-dots {
  position: absolute;
  bottom: 0.5rem;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.carousel-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  border: none;
  padding: 0;
  background: color-mix(in srgb, white 50%, transparent);
  cursor: pointer;
}

.carousel-dot--active {
  background: white;
}
</style>
