<template>
  <div>
    <b-overlay :show="busy">
    <b-jumbotron header="Game configuration"/>
      <b-container fluid class="my-4">
        <b-row>
          <b-col xs="12" sm="9">
            <b-form>
              <b-form-group
                label="Number of decks"
                label-for="number-of-decks"
              >
                <b-form-input number id="number-of-decks" v-model="numberOfDecks" placeholder="" />
              </b-form-group>
              <b-form-group
                label="Maximum card rank"
                label-for="maximum-card-rank"
              >
                <b-form-input number id="maximum-card-rank" v-model="rankLimit" placeholder="" />
              </b-form-group>
            </b-form>
            <b-button @click="updateConfig({numberOfDecks, rankLimit})">
              Submit
            </b-button>
          </b-col>
        </b-row>
      </b-container>
    </b-overlay>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Config } from '../../../server/model'
import { io } from "socket.io-client"


const numberOfDecks = ref(-1)
const rankLimit = ref(-1)
const socket = io()
const busy = ref(false)

onMounted(() => {
  socket.emit("get-config")
  socket.once("get-config-reply", (newGameConfig) => {
    numberOfDecks.value = newGameConfig.numberOfDecks
    rankLimit.value = newGameConfig.rankLimit
    console.log(numberOfDecks.value + " " + rankLimit.value)
  })
})

function updateConfig(config: Config) {
  console.log(config)
  socket.emit("update-config", config)
  busy.value = true
  socket.once("update-config-reply", (isOk) => {
    console.log(isOk ? "Updated successfully" : "Error updating")
    busy.value = false
  })
}

</script>