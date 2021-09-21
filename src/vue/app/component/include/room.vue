<template>
  <div v-if="room.active" type="room" :name="name">
    <div v-for="(walls, index) in objects" :name="`${name}.${index}`">
      <wall v-for="(wall, wallName) in walls" :key="wallName"
            :index="wallName"
            :data="wall"
            :parent="`${name}.${index}`"/>
    </div>
  </div>
</template>

<script>
  import wall from './wall'

  export default {
    name: "app-room",
    props: ['index', 'room', 'objects', 'parent'],
    components: {wall},

    data () {
      return {
        name: `${this.parent}.${this.index}`
      }
    }
  }
</script>