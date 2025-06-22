<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import { Articolo } from '../types';
import '../style.css';

export default defineComponent({
  data() {
    return {
      datiArticoli: [] as Articolo[],
      selectedArticolo: null as Articolo | null,
      form: {
        NomeArt: '',
        DescArtBreve: '',
        DescArtLunga: '',
        Udm: 'pezzi',
        PrezzoStandard: 0,
      } as Omit<Articolo, 'Articolo'>,
      currentPage: 1,
      perPage: 18,
      errorMessage: '',
      successMessage: '',
    };
  },
  computed: {
    totalPages(): number {
      return Math.ceil(this.datiArticoli.length / this.perPage);
    },
    articoliPaginati(): Articolo[] {
      const start = (this.currentPage - 1) * this.perPage;
      return this.datiArticoli.slice(start, start + this.perPage);
    },
  },
  methods: {
    getArticoli() {
      axios
        .get('/api/VisualizzazioneArticoli')
        .then((response) => {
          this.datiArticoli = response.data;
        })
        .catch((error) => {
          console.error('Errore nel recupero degli articoli', error);
          this.errorMessage = 'Errore nel recupero degli articoli.';
        });
    },
    deleteArticolo(articoloID: number) {
        axios.delete(`/api/CancellaArticoli/${articoloID}`)
          .then(() => {
            this.getArticoli();
            this.successMessage = 'Articolo eliminato con successo.';
          })
          .catch((error) => {
            console.error("Errore nell'eliminazione", error);
            this.errorMessage = "Errore nell'eliminazione dell'articolo.";
          });
    },
    editArticolo(articolo: Articolo) {
      this.selectedArticolo = articolo;
      this.form = { ...articolo };
    },
    saveArticolo() {
      const requestData: Articolo = {
        ...this.form,
        ...(this.selectedArticolo ? { Articolo: this.selectedArticolo.Articolo } : {}),
      };

      const request = this.selectedArticolo
        ? axios.put(`/api/ModificaArticoli/${this.selectedArticolo.Articolo}`, requestData)
        : axios.post('/api/CreaArticoli', this.form);

      request
        .then(() => {
          this.selectedArticolo = null;
          this.getArticoli();
          this.successMessage = this.selectedArticolo
            ? 'Articolo aggiornato con successo.'
            : 'Articolo aggiunto con successo.';
          this.resetForm();
        })
        .catch((error) => {
          console.error('Errore nel salvataggio', error);
          this.errorMessage = 'Errore nel salvataggio dell\'articolo.';
        });
    },
    resetForm() {
      this.selectedArticolo = null;
      this.form = {
        NomeArt: '',
        DescArtBreve: '',
        DescArtLunga: '',
        Udm: 'pezzi',
        PrezzoStandard: 0,
      };
      this.errorMessage = ''; 
      this.successMessage = '';
    },
  },
  mounted() {
    this.getArticoli();
  },
});
</script>

<template>
  <div class="wider-container">
    <h1 class="mb-4 text-center">Anagrafiche Articoli</h1>

    <div class="row g-4">
      <!-- Form -->
      <div class="col-12 col-md-4">
        <h2 class="h5 mb-3">{{ selectedArticolo ? 'Modifica' : 'Aggiungi' }} Articolo</h2>

        <form @submit.prevent="saveArticolo" class="vstack gap-3">
          <div>
            <label for="nomeArt" class="form-label">Articolo *</label>
            <input id="nomeArt" v-model="form.NomeArt" type="text" class="form-control" required />
          </div>

          <div>
            <label for="descArtBreve" class="form-label">Descrizione Breve</label>
            <input id="descArtBreve" v-model="form.DescArtBreve" type="text" class="form-control" />
          </div>

          <div>
            <label for="descArtLunga" class="form-label">Descrizione Lunga</label>
            <textarea id="descArtLunga" v-model="form.DescArtLunga" class="form-control" rows="2" />
          </div>

          <div>
            <label for="udm" class="form-label">Unità *</label>
            <select id="udm" v-model="form.Udm" class="form-select" required>
              <option value="pezzi">Pezzi</option>
              <option value="litri">Litri</option>
              <option value="kg">Kg</option>
              <option value="metri">Metri</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <label for="prezzoStandard" class="form-label">Prezzo (€) </label>
            <input
              id="prezzoStandard"
              v-model="form.PrezzoStandard"
              type="number"
              class="form-control"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary">
              {{ selectedArticolo ? 'Aggiorna' : 'Aggiungi' }} Articolo
            </button>
            <button v-if="selectedArticolo" @click="resetForm" type="button" class="btn btn-secondary">
              Annulla modifica
            </button>
          </div>
        </form>
      </div>

      <!-- TAB Art -->
      <div class="col-12 col-md-8">
        <div v-if="errorMessage" class="alert alert-danger" role="alert" aria-live="polite">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success" role="alert" aria-live="polite">
          {{ successMessage }}
        </div>

        <div class="table-responsive mb-3" v-if="articoliPaginati.length > 0">
  <table class="table table-hover table-bordered align-middle text-center table-sm" aria-label="Elenco articoli">
    <thead class="table-dark">
      <tr>
        <th scope="col">Articolo</th>
        <th scope="col">Desc Breve</th>
        <th scope="col">Desc Completa</th>
        <th scope="col">Unità</th>
        <th scope="col">Prezzo</th>
        <th scope="col">Azioni</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="articolo in articoliPaginati"
        :key="articolo.Articolo"
        @click="editArticolo(articolo)"
        @keydown.enter.prevent="editArticolo(articolo)"
        @keydown.space.prevent="editArticolo(articolo)"
        style="cursor: pointer"
        :class="{ 'table-active': selectedArticolo?.Articolo === articolo.Articolo }"
        tabindex="0"
        role="button"
        :aria-label="`Seleziona articolo ${articolo.NomeArt}`"
      >
        <td>{{ articolo.NomeArt }}</td>
        <td>{{ articolo.DescArtBreve || 'N/A' }}</td>
        <td>{{ articolo.DescArtLunga || 'N/A' }}</td>
        <td>{{ articolo.Udm }}</td>
        <td>{{ articolo.PrezzoStandard }}€</td>
        <td>
          <button
            @click.stop="deleteArticolo(articolo.Articolo!)"
            class="btn btn-danger btn-sm"
            aria-label="Elimina articolo"
            title="Elimina"
          >
            <span aria-hidden="true">Canc</span>
            <span class="visually-hidden">Elimina</span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

        <!-- Paginazione -->
        <div class="d-flex justify-content-center gap-2" v-if="totalPages > 1">
          <button class="btn btn-outline-success btn-sm allarga" :disabled="currentPage===1" @click="currentPage--"> ⭠</button>
          <span class="align-self-center">Pagina {{ currentPage }} di {{ totalPages }}</span>
          <button class="btn btn-outline-success btn-sm allarga" :disabled="currentPage===totalPages" @click="currentPage++">⭢</button>
        </div>
      </div>
    </div>
  </div>
</template>




