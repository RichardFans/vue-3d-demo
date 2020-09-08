import {SET_DERMATOME, RETRIEVE_DERMATOME} from '../mutation-types'

const state = {
  data: []
}

const mutations = {
  [SET_DERMATOME] (state, dermatome) {
    state.data = dermatome
    localStorage.setItem('dermatome', JSON.stringify(dermatome))
  },
  [RETRIEVE_DERMATOME] (state) {
    let dermatomeStr = localStorage.getItem('dermatome')
    let hasDermatome = !!dermatomeStr
    let dermatome = JSON.parse(dermatomeStr)

    if (hasDermatome) {
      state.data = dermatome
    }
  }
}

export default {
  state,
  mutations
}
