<template>
  <DialogCard :title="title" :actions="actions">
    <v-text-field label="名称*" required
                  v-model="name" :error-messages="nameErrors"
                  @input="$v.name.$touch()" @blur="$v.name.$touch()"
                  :counter="10">
    </v-text-field>

    <v-color-picker v-model="color" class="ma-2 path-color-picker" :swatches="colors" disabled show-swatches hide-canvas hide-inputs
                    hide-mode-switch width="420"></v-color-picker>
  </DialogCard>
</template>

<script>
  import {validationMixin} from 'vuelidate'
  import {required, maxLength} from 'vuelidate/lib/validators'
  import {RGBToHex} from "../../utils/gl/gl"

  // '#C0C0C0' 这个颜色在dermatome2中使用了
  const COLORS = [
    [
      '#C0C0C0', '#808080', '#464646', '#000080', '#084C9E', '#007FFF',
      '#00FFFF', '#7FFFD4', '#008080', '#228B22', '#808000', '#7FFF00',
      '#FF7F50', '#FC0FC0', '#FF77FF', '#CC8899', '#E0B0FF', '#B57EDC',
      '#4B0082', '#800000', '#DC143C'
    ],
  ]

  export default {
    props: {
      target: Object,
      excludeColors: Array
    },
    mixins: [validationMixin],

    validations: {
      name: {required, maxLength: maxLength(10)}
    },
    data: () => ({
      name: '',
      color: COLORS[0][0],
    }),
    methods: {},
    computed: {
      colors () {
        if (!this.excludeColors || this.excludeColors.length === 0) return COLORS
        return [COLORS[0].filter((c) => this.excludeColors.indexOf(c) === -1)]
      },
      title () {
        return this.target ? '编辑Dermatome区域' + this.target.name : '创建Dermatome区域'
      },
      actions () {
        return {
          cancel: {
            text: '取消',
          },
          submit: {
            text: '提交',
            handler: () => {
              this.$v.$touch()
              if (this.$v.$invalid) return false
              return {
                data: {name: this.name, color: this.color, alpha: 255 - COLORS[0].indexOf(this.color)},
                target: this.target
              }
            }
          },
        }
      },
      nameErrors () {
        const errors = []
        if (!this.$v.name.$dirty) return errors
        !this.$v.name.maxLength && errors.push('名称长度不应超过10个字符')
        !this.$v.name.required && errors.push('必填项')
        return errors
      },
    },
    mounted () {
      if (this.target) {
        this.name = this.target.name
        let c = this.target.color
        this.color = RGBToHex(c.r, c.g, c.b)
      } else {
        this.color = this.colors[0][0]
      }
    }
  }
</script>

<style lang="scss">
  .path-color-picker .v-color-picker__swatch {
    flex-wrap: wrap !important;
    flex-direction: row !important;
  }
</style>
