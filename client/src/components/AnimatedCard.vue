<template>
  <div @click="$emit('play', card.id)">
    <b-card
    :style="cardType == 'last' ? { background : 'orange'} : 
            cardType == 'playable' ? { background : '#90EE90'} : 
            ''"
    class="mb-4 d-inline-flex p-4">
      {{ card.suit + " " + card.rank }}
      
    </b-card>
  </div>
</template>

<script setup lang="ts">

import Vue from "vue";
import { Card } from "../../../server/model"
import { areCompatible } from "../../../server/model"
import { reactive, computed } from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// props
interface Props {
  card: Card
  last: Card
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  card: undefined,
  last: undefined
})

const cardType = computed(() => {
  if(props.card.locationType == 'last-card-played') {
    return "last"
  }
  else if(props.last != null) {
    if(areCompatible(props.card, props.last)) {
      return "playable"
    }
  }
  return "notPlayable"

})

</script>