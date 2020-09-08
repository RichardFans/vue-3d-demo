import Vue from 'vue'
import VueRouter from 'vue-router'
import SketchOnModel from '../views/SketchOnModel.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: {name: 'EditDermatome2'}
  },
  {
    path: '/EditDermatome2',
    name: 'EditDermatome2',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/EditDermatome2.vue')
  },
  {
    path: '/SketchOnModel',
    name: 'SketchOnModel',
    component: SketchOnModel
  },
  {
    path: '/EditDermatome',
    name: 'EditDermatome',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/EditDermatome.vue')
  },
  {
    path: '/demos/bone',
    name: 'BoneDemo',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/demos/BoneDemo.vue')
  },
  {
    path: '/demos/skinned-man',
    name: 'SkinnedManDemo',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/demos/SkinnedManDemo.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
