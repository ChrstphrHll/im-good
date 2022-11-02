import http from "http"
import { Server } from "socket.io"
import { Action, Config, createEmptyGame, nearWinners, doAction, filterCardsForPlayerPerspective, Card, computePlayerCardCounts, GameState } from "./model"

const server = http.createServer()
const io = new Server(server)
const port = 8091

let gameConfig: Config = {numberOfDecks: 3, rankLimit: 10}
let gameState = createEmptyGame(["player1", "player2"], gameConfig.numberOfDecks, gameConfig.rankLimit)

function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
    }
    console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
    io.to(String(i)).emit(
      newGame ? "all-cards" : "updated-cards", 
      updatedCardsFromPlayerPerspective,
    )
  })
}

io.on('connection', client => {
  function emitGameState() {
    client.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  }
  
  console.log("New client")
  let playerIndex: number | null | "all" = null
  client.on('player-index', n => {
    playerIndex = n
    console.log("playerIndex set", n)
    client.join(String(n))
    if (typeof playerIndex === "number") {
      client.emit(
        "all-cards", 
        filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
      )
    } else {
      client.emit(
        "all-cards", 
        Object.values(gameState.cardsById),    
      )
    }
    emitGameState()
  })

  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitUpdatedCardsForPlayers(updatedCards)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    io.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
      nearWinners(gameState)
    )
  })

  client.on("new-game", () => {
    gameState = createEmptyGame(["player1", "player2"], gameConfig.numberOfDecks, gameConfig.rankLimit)
    const updatedCards = Object.values(gameState.cardsById)
    emitUpdatedCardsForPlayers(updatedCards, true)
    io.to("all").emit(
      "all-cards", 
      updatedCards,
    )
    emitGameState()
  })

  client.on("get-config", () => {
    console.log(gameConfig)
    io.emit(
      "get-config-reply",
      gameConfig
    )
  })

  client.on("update-config", (config: Config) => {
    let ret = false
    if(typeof(config.numberOfDecks) === "number" && typeof(config.rankLimit) === "number") {
      gameConfig.numberOfDecks = config.numberOfDecks
      gameConfig.rankLimit = config.rankLimit
      ret = true
    }
    setTimeout(() => {
      io.emit(
        "update-config-reply",
        ret
      )
    }, 2000);
  })
})
server.listen(port)
console.log(`Game server listening on port ${port}`)
