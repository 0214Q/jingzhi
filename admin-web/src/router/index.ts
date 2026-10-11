import { createRouter, createWebHashHistory } from 'vue-router';
import ReviewPage from '../pages/ReviewPage.vue';
export const router=createRouter({history:createWebHashHistory(),routes:[{path:'/',component:ReviewPage},{path:'/:pathMatch(.*)*',redirect:'/'}]});
