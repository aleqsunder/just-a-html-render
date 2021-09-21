import Vue from "vue"
import appOverlay from './component/app-overlay.vue'
import appWorld from './component/app-world.vue'

window.$ = jQuery

Vue.component('app-overlay', appOverlay)
Vue.component('app-world', appWorld)

new Vue({el: '#game'})