import Vue from "vue"
import Vuelidate from "vuelidate"
import VueClipboard from "vue-clipboard2"
import VuetifyDialog from "vuetify-dialog"
import vuetify from "./vuetify"

export default () => {
  Vue.use(Vuelidate)
  //
  Vue.config.productionTip = false
  Vue.use(VueClipboard)
  //
  Vue.use(VuetifyDialog, {
    context: {
      vuetify
    }
  })
}
