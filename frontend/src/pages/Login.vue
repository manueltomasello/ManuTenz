<template>
  <div class="container mt-5">
    <Transition name="title-fade" appear>
      <h1 class="text-center mb-4">Accedi</h1>
    </Transition>

    <div class="row justify-content-center">
      <div class="col-md-4">
        <Transition name="card-fade" appear>
          <form @submit.prevent="onSubmit" class="card p-4 shadow-sm">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input v-model="username" type="text" id="username" class="form-control" required />
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input v-model="password" type="password" id="password" class="form-control" required />
            </div>

            <button type="submit" class="btn btn-success w-100">Login</button>

            <Transition name="alert-slide-fade">
              <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">
                {{ errorMessage }}
              </div>
            </Transition>

          </form>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent} from 'vue'
import axios from 'axios'
import '../style.css';

export default defineComponent({
  data() {
    return {
      username: "",
      password: "",
      errorMessage: "",
    }
  },
  methods:{
    async onSubmit(){
      try{
        await axios.post("/api/auth/login", {
          username: this.username,
          password: this.password,

        })
        location.href = "/"
        }catch (error: any) {
          if (error.response) {
            this.errorMessage = `${error.response.data}`;
          } else {
            this.errorMessage = error.message;
          }
        }
      },
    },
  })
    
</script>
