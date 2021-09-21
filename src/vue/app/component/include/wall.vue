<template>
  <div type="wall" :name="name" :style="styles"/>
</template>

<script>
  export default {
    name: "app-wall",
    props: ['index', 'data', 'parent'],

    data () {
      return {
        name: `${this.parent}.${this.index}`,

        styles: {
          transform: `rotate3d(0, 1, 0, 0deg) translate3d(0px, 0px, 0px)`
        }
      }
    },

    mounted () {
      this.styles = {...this.styles, ...this.data.css};
    }
  }
</script>