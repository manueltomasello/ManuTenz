<script lang="ts">
import axios from "axios"
import { defineComponent } from "vue"
import { Dipendente } from "./types"

export default defineComponent({
  data() {
    return {
      user: null as Dipendente | null,
    }
  },
  methods: {
    async getUser() {
      try {
        const res = await axios.get("/api/auth/getProfile")
        this.user = res.data
      } catch (e) {
        this.user = null
      }
    },
    async logout() {
      await axios.post("/api/auth/logout")
      this.user = null
      this.$router.push("/login")
    },
  },
  mounted() {
    this.getUser()
  },
})
</script>
<template>
  <div class="container-wider d-flex flex-column min-vh-100 bg-light text-dark">
    <header class="bg-success text-white py-3">
      <div class="container d-flex align-items-center ms-2">
        <div class="d-inline-flex align-items-center bg-white rounded-pill me-3 px-3 py-1">
          <h1 class="h3 m-0 me-3 text-success">ManuTenz</h1>
          <img src="../img/salami.png" alt="Logo Salami S.p.A" style="max-height: 30px;" />
        </div>
      </div>
    </header>

    <!-- Navbar sticky -->
    <nav v-if="user" class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow">
      <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse mt-3" id="navbarContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link to="/" class="nav-link" exact-active-class="active">Home</router-link>
            </li>

            <li v-if="user?.ruolo === 'admin'" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="anagraficheDropdown" role="button" data-bs-toggle="dropdown">
                Anagrafiche
              </a>
              <ul class="dropdown-menu" aria-labelledby="anagraficheDropdown">
                <li><router-link to="/Dipendenti" class="dropdown-item">Dipendenti</router-link></li>
                <li><router-link to="/Fornitori" class="dropdown-item">Fornitori</router-link></li>
                <li><router-link to="/Fatture" class="dropdown-item">Fatture</router-link></li>
                <li><router-link to="/Risorse" class="dropdown-item">Risorse</router-link></li>
              </ul>
            </li>

            <li v-if="user" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="interventiDropdown" role="button" data-bs-toggle="dropdown">
                Gestione
              </a>
              <ul class="dropdown-menu" aria-labelledby="interventiDropdown">
                <li><router-link to="/Manutenzioni" class="dropdown-item">Manutenzioni</router-link></li>
                <li><router-link to="/Articolo" class="dropdown-item">Articoli</router-link></li>
                <li><router-link to="/Interventi" class="dropdown-item">Interventi</router-link></li>
              </ul>
            </li>

            <li v-if="user?.ruolo === 'admin'" class="nav-item">
              <router-link to="/Consultazioni" class="nav-link" exact-active-class="active">Consultazioni</router-link>
            </li>
          </ul>

          <div class="d-flex ms-auto align-items-center">
            <span class="text-white me-3" v-if="user">{{ user.NomeDip }} ({{ user.ruolo }})</span>
            <button @click="logout" class="btn btn-danger">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-grow-1 p-3">
      <div class="container bg-white shadow-sm rounded p-4 wider-container">
        <router-view />
      </div>
    </main>

    <!-- Footer -->
    <footer v-if="!user" class="bg-secondary text-white text-center py-3 mt-auto">
      <small>Gestionale Manutenzioni – Ingegneria dei sistemi web, Università di Bologna - Progetto Salami S.P.A</small>
    </footer>
  </div>
</template>


