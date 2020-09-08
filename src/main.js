import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import setupPlugins from './plugins/setup'

setupPlugins()



new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
