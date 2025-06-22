<script lang="ts">
  import { defineComponent } from 'vue';
  import axios from 'axios';
  import { Fornitore } from '../types';
  import '../style.css';
  
  export default defineComponent({
    data() {
      return {
        fornitori: [] as Fornitore[],
        selectedFornitore: null as Fornitore | null,
        form: {
          IdFornitore: '',
          RagSoc: '',
        } as Fornitore,
        currentPage: 1,       
        perPage: 12,  
        errorMessage: '',
        successMessage: '',
      };
    },
    computed: {
    totalPages(): number {
      return Math.ceil(this.fornitori.length / this.perPage);
    },
    FornitoriPaginati(): Fornitore[] {
      const start = (this.currentPage - 1) * this.perPage;
      return this.fornitori.slice(start, start + this.perPage);
    },
  },
    methods: {
      fetchFornitori() {
        axios
          .get('/api/VisualizzaFornitore')
          .then((res) => {
            this.fornitori = res.data;
          })
          .catch(() => {
            this.errorMessage = 'Errore durante il caricamento dei fornitori.';
          });
      },
      saveFornitore() {
        const data: Fornitore = {
          ...this.form,
          ...(this.selectedFornitore ? { IdFornitore: this.selectedFornitore.IdFornitore } : {}),
        };
  
        const request = this.selectedFornitore 
          ? axios.put(`/api/ModificaFornitore/${data.IdFornitore}`, data)
          : axios.post('/api/CreaFornitore', data);
  
        request
          .then(() => {
            this.successMessage = this.selectedFornitore
              ? 'Fornitore aggiornato con successo.'
              : 'Fornitore aggiunto con successo.';
            this.resetForm();
            this.fetchFornitori();
          })
          .catch(() => {
            this.errorMessage = 'Errore durante il salvataggio.';
          });
      },
      editFornitore(f: Fornitore) {
        this.selectedFornitore = f;
        this.form = { ...f };
      },
      deleteFornitore(id: string) {
          axios.delete(`/api/CancellaFornitore/${id}`)
            .then(() => {
              this.successMessage = 'Fornitore eliminato.';
              this.fetchFornitori();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            })
            .catch(() => {
              this.errorMessage = 'Errore durante l\'eliminazione.';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
      },
      resetForm() {
        this.selectedFornitore = null;
        this.form = {
          IdFornitore: '',
          RagSoc: '',
         };
         this.errorMessage = ''; 
         this.successMessage = '';
      },
    },
    mounted() {
      this.fetchFornitori();
    },
  });
</script>
<template>
    <div class="wider-container">
      <h1 class="mb-4 text-center">Gestione Fornitori</h1>
      <div class="row g-4">
        <!-- FORM -->
        <div class="col-12 col-md-4">
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
              {{ selectedFornitore ? 'Modifica Fornitore' : 'Nuovo Fornitore' }}
            </div>
            <div class="card-body">
              <form @submit.prevent="saveFornitore" class="vstack gap-2">
                <div>
                  <label for="IdFornitore" class="form-label">ID Fornitore</label>
                  <input type="text" v-model="form.IdFornitore" class="form-control" placeholder="ID Fornitore" required />
                </div>
                <div>
                  <label for="RagSoc" class="form-label">Ragione Sociale</label>
                  <input type="text" v-model="form.RagSoc" class="form-control" placeholder="Ragione Sociale" required />
                </div>
                <div class="d-grid gap-2 mt-3">
                  <button type="submit" class="btn btn-primary">
                    {{ selectedFornitore ? 'Salva Modifiche' : 'Aggiungi Fornitore' }}
                  </button>
                  <button v-if="selectedFornitore" @click="resetForm" type="button" class="btn btn-secondary">
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
  
        <!-- TABELLA -->
        <div class="col-12 col-md-8">
          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
          <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
  
          <div class="table-responsive">
  <table class="table table-hover table-bordered align-middle text-center table-sm" aria-label="Elenco fornitori">
    <thead class="table-dark">
      <tr>
        <th scope="col">ID Fornitore</th>
        <th scope="col">Ragione Sociale</th>
        <th scope="col">Azioni</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="fornitore in FornitoriPaginati"
        :key="fornitore.IdFornitore"
        @click="editFornitore(fornitore)"
        @keydown.enter.prevent="editFornitore(fornitore)"
        @keydown.space.prevent="editFornitore(fornitore)"
        style="cursor: pointer"
        :class="{ 'table-active': selectedFornitore?.IdFornitore === fornitore.IdFornitore }"
        tabindex="0"
        role="button"
        :aria-label="`Seleziona fornitore ${fornitore.RagSoc}`"
      >
          <td>{{ fornitore.IdFornitore }}</td>
          <td>{{ fornitore.RagSoc }}</td>
          <td>
            <button class="btn btn-danger btn-sm" @click.stop="deleteFornitore(fornitore.IdFornitore)"aria-label="Elimina fornitore"
              title="Elimina">
              <span aria-hidden="true">Canc</span>
              <span class="visually-hidden">Elimina</span>
                  </button>
                </td>
                </tr>
                <tr v-if="fornitori.length === 0">
                  <td colspan="3">Nessun fornitore trovato.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="d-flex justify-content-center gap-2" v-if="totalPages > 1">
            <button class="btn btn-outline-success btn-sm allarga" :disabled="currentPage===1" @click="currentPage--"> ⭠</button>
          <span class="align-self-center">Pagina {{ currentPage }} di {{ totalPages }}</span>
          <button class="btn btn-outline-success btn-sm allarga" :disabled="currentPage===totalPages" @click="currentPage++">⭢</button>
        </div>
        </div>
      </div>
    </div>
</template>
  
