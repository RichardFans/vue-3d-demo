import {SET_DERMATOME2, RETRIEVE_DERMATOME2} from '../mutation-types'

const state = {
  data: {
    paths: [
      {
        name: "L1",
        draw: true,
        key: {x: 0, y: 0},
        color: {r: 192, g: 192, b: 192, a: 255},  // 这个是PathDlg中的第一个颜色 '#C0C0C0'
      }
    ],
    data: {}
  }
}

const mutations = {
  [SET_DERMATOME2] (state, dermatome) {
    state.data = dermatome
    localStorage.setItem('dermatome2', JSON.stringify(dermatome))
  },
  [RETRIEVE_DERMATOME2] (state) {
    let dermatomeStr = localStorage.getItem('dermatome2')
    let hasDermatome = !!dermatomeStr
    if (hasDermatome) {
      state.data = JSON.parse(dermatomeStr)
    }
  }
}

export default {
  state,
  mutations
}
