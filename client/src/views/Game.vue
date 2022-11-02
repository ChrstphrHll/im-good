<template>
  <div>
    <div :style="{textAlign : 'center'}">
      <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
      <b-badge class="mr-2 mb-2" :variant="myTurn ? 'primary' : 'secondary'">turn: {{ currentTurnPlayerIndex }}</b-badge>
      <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
      <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button>
      
    </div>
    <div :style="{textAlign : 'center'}">
      <b-badge v-if="nearWinners?.length" class="mr-2 mb-2">{{ "These players are close to winning: " + nearWinners}}</b-badge>
    </div>
    <div :style="{display: 'flex', justifyContent : 'center'}">
      <AnimatedCard :style="{padding : '10px'}" v-for="card in lastPlayed(cards)" :key="lastPlayed(cards)[0].id" @play="playCard" :card=card :last="lastPlayed(cards)[0]"/>
    </div>
    <div :style="{display: 'flex', justifyContent : 'center'}">
      <AnimatedCard :style="{padding : '10px'}" v-for="card in playableCards(cards)" :key="card.id" @play="playCard" :card=card :last="lastPlayed(cards)[0]"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Card, GamePhase, Action, formatCard, CardId, getLastPlayedCard } from "../../../server/model"
import AnimatedCard from "../components/AnimatedCard.vue"

// props
interface Props {
  playerIndex?: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  playerIndex: "all",
})

const socket = io()
let x = props.playerIndex
let playerIndex: number | "all" = parseInt(x) >= 0 ? parseInt(x) : "all"
console.log("playerIndex", JSON.stringify(playerIndex))
socket.emit("player-index", playerIndex)

const cards: Ref<Card[]> = ref([])
const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
const playCount = ref(-1)
const nearWinners : Ref<number[]> = ref([])
const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex && phase.value !== "game-over")

socket.on("all-cards", (allCards: Card[]) => {
  cards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-state", (newCurrentTurnPlayerIndex: number, newPhase: GamePhase, newPlayCount: number, newNearWinners: number[]) => {
  currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playCount.value = newPlayCount
  nearWinners.value = newNearWinners
})

function doAction(action: Action) {
  return new Promise<Card[]>((resolve, reject) => {
    socket.emit("action", action)
    socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
  })
}

function playableCards(cards: Card[]) {
  return cards.filter(card => card.playerIndex !== null)
}

function lastPlayed(cards: Card[]) {
  return cards.filter(card => card.locationType == "last-card-played")
}

async function drawCard() {
  if (typeof playerIndex === "number") {
    const updatedCards = await doAction({ action: "draw-card", playerIndex })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function playCard(cardId: CardId) {
  if (typeof playerIndex === "number") {
    const updatedCards = await doAction({ action: "play-card", playerIndex, cardId })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function applyUpdatedCards(updatedCards: Card[]) {
  for (const x of updatedCards) {
    const existingCard = cards.value.find(y => x.id === y.id)
    if (existingCard) {
      Object.assign(existingCard, x)
    } else {
      cards.value.push(x)
    }
  }
}
</script>