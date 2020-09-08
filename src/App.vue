<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item
            v-for="item in items" :key="item.text"
            link :to="{name:item.route}">
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              {{ item.text }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-subheader class="mt-4 grey--text text--darken-1">DEMO</v-subheader>
        <v-list>
          <v-list-item
              v-for="item in items2"
              :key="item.text"
              link :to="{name:item.route}">
            <v-list-item-avatar>
              <img
                  :src="`https://randomuser.me/api/portraits/women/${item.picture}.jpg`"
                  alt="">
            </v-list-item-avatar>
            <v-list-item-title v-text="item.text"></v-list-item-title>
          </v-list-item>
        </v-list>
        <v-list-item
            class="mt-4"
            link>
          <v-list-item-action>
            <v-icon color="grey darken-1">mdi-plus-circle-outline</v-icon>
          </v-list-item-action>
          <v-list-item-title class="grey--text text--darken-1">Browse Channels</v-list-item-title>
        </v-list-item>
        <v-list-item link>
          <v-list-item-action>
            <v-icon color="grey darken-1">mdi-cog</v-icon>
          </v-list-item-action>
          <v-list-item-title class="grey--text text--darken-1">Manage Subscriptions</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
        app
        clipped-left
        color="red"
        dense>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
<!--      <v-icon class="mx-4" large>mdi-youtube</v-icon>-->
      <v-toolbar-title class="mr-12 align-center">
        <span class="title">脊柱外科智能导诊</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-row
          align="center"
          style="max-width: 650px">
        <v-text-field
            @click:append="() => {log()}"
            placeholder="Search..."
            single-line
            append-icon="mdi-magnify"
            color="white"
            hide-details
        ></v-text-field>
      </v-row>
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>

</template>

<script>
  // import HelloWorld from './components/HelloWorld'

  export default {
    name: 'App',

    components: {
      // HelloWorld,

    },

    data: () => ({
      drawer: null,
      drawerRight: null,
      right: false,
      //
      items: [
        {icon: 'mdi-heart', text: '编辑DERMATOME2', route: 'EditDermatome2'},
        {icon: 'mdi-draw', text: '编辑DERMATOME', route: 'EditDermatome'},
        {icon: 'mdi-human-handsdown', text: '勾画疼痛区域DEMO', route: 'SketchOnModel'},
      ],
      items2: [
        {picture: 8, text: '骨骼操作', route: 'BoneDemo'},
        {picture: 18, text: '蒙皮动画', route: 'SkinnedManDemo'},
      ],
    }),
    methods: {
      log () {
        alert('test')
      }
    },
    created () {
      this.$vuetify.theme.dark = true
    },
  }
</script>

<style scoped>

</style>