<template>
  <v-btn :large="large" :small="small" :icon="useIcon" @click="openFile">
    <v-icon v-if="icon" small>{{icon}}</v-icon>
    <span v-else>{{text}}</span>
    <input id="fileImport" ref="fileInput" type="file" @change="loadTextFromFile"
           :accept="accept" hidden>
  </v-btn>
</template>

<script>

  export default {
    name: "TextFileReader",
    props: {
      large: {type: Boolean, default: false},
      small: {type: Boolean, default: false},
      icon: String,
      text: String,
      accept: String,
    },
    data: () => ({
    }),
    computed: {
      useIcon () {
        return !!this.icon
      }
    },
    methods: {
      openFile () {
        this.$refs.fileInput.click()
      },
      loadTextFromFile (ev) {
        const file = ev.target.files[0]
        const reader = new FileReader()
        reader.onload = e => {
          this.$emit("load", e.target.result)
          this.$refs.fileInput.value = null
        }
        reader.readAsText(file)
      }
    }
  }
</script>

<style scoped>

</style>