<template>
  <DialogCard :title="title" :actions="actions">
    <v-text-field label="名称*" required
                  v-model="name" :error-messages="nameErrors"
                  @input="$v.name.$touch()" @blur="$v.name.$touch()"
                  :counter="10">
    </v-text-field>
  </DialogCard>
</template>

<script>
  import {validationMixin} from 'vuelidate'
  import {required, maxLength} from 'vuelidate/lib/validators'

  export default {
    props: {
      target: Object
    },
    mixins: [validationMixin],

    validations: {
      name: {required, maxLength: maxLength(10)}
    },
    data: () => ({
      name: ''
    }),
    methods: {},
    computed: {
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
              return {data: {name: this.name}, target: this.target}
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
      if (this.target) this.name = this.target.name
    }
  }
</script>
