import { createRouter, createWebHistory } from "vue-router";


const Profile = () => import("@/components/Profile.vue");
const Tokens = () => import("@/components/Tokens.vue");
const Relationships = () => import("@/components/Relationships.vue");
const Preferences = () => import("@/components/Preferences.vue");
const Applications = () => import("@/components/Applications.vue");
const CIBA = () => import("@/components/CIBA.vue");
const DelegatedAdmin = () => import("@/components/DelegatedAdmin.vue");
const OrgModel = () => import("@/components/OrgModel.vue");


const routes = [
	{ path: "/",              name: "Applications",   component: Applications },
	{ path: "/profile",       name: "Profile",        component: Profile },
	{ path: "/tokens",        name: "Tokens",         component: Tokens },
	{ path: "/relationships", name: "Relationships",  component: Relationships },
	{ path: "/preferences",   name: "Preferences",    component: Preferences },
	{ path: "/applications",  name: "Applications",   component: Applications },
	{ path: "/ciba",          name: "CIBA",           component: CIBA },
	{ path: "/delegatedAdmin",name: "Contact Centre", component: DelegatedAdmin },  
	{ path: "/orgModel",	  name: "Org Model", 	  component: OrgModel },  	
	{ path: "/:_(.*)*",       name: "Default",        component: Applications },
];


const router = createRouter({
	routes,
	history: createWebHistory('/EndUserDash/')
});

export default router;
