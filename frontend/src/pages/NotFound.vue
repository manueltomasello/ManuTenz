<template>
  <div class="not-found-wrapper">
    <div class="not-found-card text-center">
      <h1 class="display-1 fw-bold text-success"tabindex="0">404</h1>
      <p class="lead">Ciao! sembra che tu ti sia perso</p>
      <p>La pagina che cerchi potrebbe essere stata rimossa o non esiste.</p>
      <RouterLink to="/" class="btn btn-primary mt-3">Torna alla Home</RouterLink>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import '../style.css';

export default defineComponent({
  name: 'NotFound'
});
</script>

