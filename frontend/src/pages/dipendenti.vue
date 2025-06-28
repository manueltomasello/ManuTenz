<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import { Dipendente } from '../types';
import '../style.css';
 
export default defineComponent({
  data() {
    return {
      datiDipendenti: [] as Dipendente[],
      selectedDipendente: null as Dipendente | null,
      form: {
        Matricola: 0,
        NomeDip: '',
        CognDip: '',
        EmailDip: '',
        PassDip: '',
        CostoOrario: 0,
        username: '',
        ruolo: 'user',
        abilitato: 1,
      } as Omit<Dipendente, 'IdDip'>,
      currentPage: 1,      
      perPage: 10,          
      errorMessage: '',    
      successMessage: '',  
    };
  },
  computed: {
    totalPages(): number {
      return Math.ceil(this.datiDipendenti.length / this.perPage);
    },
    dipendentiPaginati(): Dipendente[] {
      const start = (this.currentPage - 1) * this.perPage;
      return this.datiDipendenti.slice(start, start + this.perPage);
    },
  },
  methods: {
    fetchDipendenti() {
      axios
        .get('/api/VisualizzaDipendente')
        .then((response) => {
          this.datiDipendenti = response.data.filter((d: Dipendente) => d.abilitato === 1);
        })
        .catch((error) => {
          console.error('Errore nel recupero dei dipendenti', error);
          this.errorMessage = 'Errore nel recupero dei dipendenti.';
        });
    },
    disableDipendente(IdDip: number) {
        axios.put(`/api/CancellaDipendente/${IdDip}`)
        .then(() => {
            this.fetchDipendenti(); 
            this.successMessage = 'Dipendente disabilitato con successo.';
        })
        .catch((error) => {
            console.error("Errore nella disabilitazione", error);
            this.errorMessage = "Errore nella disabilitazione del dipendente.";
        });
       
    },
 
  editDipendente(dipendente: Dipendente) {
  this.selectedDipendente = dipendente;
  this.form = {
    ...dipendente,
    PassDip: '', 
  };
},
 
   saveDipendente() {
  const requestData: any = {
    Matricola: this.form.Matricola,
    NomeDip: this.form.NomeDip,
    CognDip: this.form.CognDip,
    EmailDip: this.form.EmailDip,
    CostoOrario: this.form.CostoOrario,
    username: this.form.username,
    ruolo: this.form.ruolo,
    abilitato: this.form.abilitato,
  };
 
  const idDip = this.selectedDipendente?.IdDip;
 
  if (!this.selectedDipendente || this.form.PassDip !== '') {
    requestData.PassDip = this.form.PassDip;
  }
 
  const request = this.selectedDipendente
    ? axios.put(`/api/ModificaDipendente/${idDip}`, requestData)
    : axios.post('/api/CreaDipendente', requestData);
 
  request
    .then(() => {
      this.successMessage = this.selectedDipendente
        ? 'Dipendente aggiornato con successo.'
        : 'Dipendente aggiunto con successo.';
      this.selectedDipendente = null;
      this.fetchDipendenti();
    })
    .catch((error) => {
      console.error('Errore nel salvataggio', error);
      this.errorMessage = 'Errore nel salvataggio del dipendente.';
    });
},
 
    resetForm() {
  this.selectedDipendente = null;
  this.form = {
    Matricola: 0,
    NomeDip: '',
    CognDip: '',
    EmailDip: '',
    PassDip: '',
    CostoOrario: 0,
    username: '',
    ruolo: 'user',
    abilitato: 0,
  };
  this.errorMessage = '';
  this.successMessage = '';
}
  },
  mounted() {
    this.fetchDipendenti();
  },
});
</script>
 
<template>
    <div class="wider-container">
      <h1 class="mb-4 text-center">Anagrafiche Dipendenti</h1>
 
      <div class="row g-4">
        <!-- Form -->
        <div class="col-12 col-md-4">
          <h2 class="h5 mb-3">{{ selectedDipendente ? 'Modifica' : 'Aggiungi' }} Dipendente</h2>
 
          <form @submit.prevent="saveDipendente" class="row g-3">
            <div class="col-md-8 mb-3">
              <label for="matricola" class="form-label">Matricola *</label>
              <input id="matricola" v-model="form.Matricola" type="number" class="form-control" required/>
            </div>
 
            <div class="col-md-4 mb-3">
              <label for="ruolo" class="form-label">Ruolo *</label>
              <select id="ruolo" v-model="form.ruolo" class="form-select" required>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
 
            <div class="col-md-6 mb-3">
              <label for="nomeDip" class="form-label">Nome *</label>
              <input id="nomeDip" v-model="form.NomeDip" type="text" class="form-control" required />
            </div>
 
            <div class="col-md-6 mb-3">
              <label for="cognDip" class="form-label">Cognome *</label>
              <input id="cognDip" v-model="form.CognDip" type="text" class="form-control" required />
            </div>
 
            <div class="col-md-6 mb-3">
              <label for="username" class="form-label">Username *</label>
              <input id="username" v-model="form.username" type="text" class="form-control" required />
            </div>
 
            <div class="col-md-6 mb-3">
              <label for="passDip" class="form-label">Password *</label>
              <input id="passDip" v-model="form.PassDip" type="password" class="form-control" :required="!selectedDipendente" />
            </div>
 
            <div class="col-9 mb-3">
              <label for="emailDip" class="form-label">Email</label>
              <input id="emailDip" v-model="form.EmailDip" type="email" class="form-control" />
            </div>
 
            <div class="col-3 mb-3">
              <label for="costoOrario" class="form-label">Costo Orario</label>
    <input
      id="costoOrario"v-model="form.CostoOrario"type="number"class="form-control"min="0"step="0.01"required/>
  </div>
 
  <!-- Pulsanti -->
  <div class="col-12 d-grid gap-2">
    <button type="submit" class="btn btn-primary">
      {{ selectedDipendente ? 'Aggiorna' : 'Aggiungi' }} Dipendente
    </button>
    <button v-if="selectedDipendente" @click="resetForm" type="button" class="btn btn-secondary">
      Annulla modifica
    </button>
  </div>
</form>
</div>
 
<!-- Tab dip -->
<div class="col-12 col-md-8">
    <div v-if="errorMessage" class="alert alert-danger" role="alert" aria-live="polite">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="alert alert-success" role="alert" aria-live="polite">
      {{ successMessage }}
    </div>
 
    <div class="table-responsive mb-3" v-if="dipendentiPaginati.length > 0">
    <table class="table table-hover table-bordered align-middle text-center table-sm" aria-label="Elenco dipendenti">
      <thead class="table-dark">
        <tr>
          <th scope="col">Matricola</th>
          <th scope="col">Nome</th>
          <th scope="col">Cognome</th>
          <th scope="col">Email</th>
          <th scope="col">Costo Orario</th>
          <th scope="col">Azioni</th>
        </tr>
      </thead>
    <tbody>
      <tr
        v-for="dipendente in dipendentiPaginati"
        :key="dipendente.IdDip"
        @click="editDipendente(dipendente)"
        @keydown.enter.prevent="editDipendente(dipendente)"
        @keydown.space.prevent="editDipendente(dipendente)"
        style="cursor: pointer"
        :class="{ 'table-active': selectedDipendente?.IdDip === dipendente.IdDip }"
        tabindex="0"
        role="button"
        :aria-label="`Seleziona dipendente ${dipendente.NomeDip} ${dipendente.CognDip}`"
      >
        <td>{{ dipendente.Matricola }}</td>
        <td>{{ dipendente.NomeDip }}</td>
        <td>{{ dipendente.CognDip }}</td>
        <td>{{ dipendente.EmailDip || 'N/A' }}</td>
        <td>{{ dipendente.CostoOrario }}€</td>
        <td>
          <button
            @click.stop="disableDipendente(dipendente.IdDip)"
            class="btn btn-danger btn-sm"
            aria-label="Elimina dipendente"
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
 
<!-- Gestione Pag -->
<div class="d-flex justify-content-center gap-2" v-if="totalPages > 1">
   <button class="btn btn-outline-success btn-sm allarga" :disabled="currentPage===1" @click="currentPage--"> ⭠</button>
    <span class="align-self-center">Pagina {{ currentPage }} di {{ totalPages }}</span>
    <button class="btn btn-outline-success btn-sm allarga" :disabled="currentPage===totalPages" @click="currentPage++">⭢</button>
    </div>
  </div>
</div>
</div>
</template>
  
