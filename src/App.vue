<template>
	<v-app>
	    <v-card>
	        <v-layout>
	            <AppBar :key="userObject"/>
	            <NavBar v-if="userObject" />
	            <v-main style="min-height:100vh; margin:20px;">
					<router-view v-if="userObject"/>
	            </v-main>
	        </v-layout>
	    </v-card>		
	</v-app>
</template>


<script setup>
	import IdentityService from "@/services/identityService.js";
	import AppBar from '@/components/AppBar.vue'
	import NavBar from '@/components/NavBar.vue'  
</script>


<script>
	export default {
		data() {
			return {
				userObject: null
			}
		},
		methods: {
			async init(target) {
				// NOTE: This method handles both the return back from a centralised login as well as normal browser refresh
				var user, tokens;
				[ user, tokens ] = await IdentityService.init(); 
				if (user != null) {
					this.userObject = user;
					//this.$router.push(target);
				//} else this.$router.push('/applications');
				} else await IdentityService.login();
			},     
			async loginUser() {
				await IdentityService.login();
			},           
		},
		beforeMount() {
			this.init('/applications');
		}, 
	}


</script>

<style>
/* Our default values set for mobile */

:root {
	--color-bg: #red;
	--color-text-main: #2800FF;
	--color-primary: #AFECE0;
	--wrapper-height: 87vh;
	--image-max-width: 300px;
	--image-margin: 3rem;

}

/* Tablet portrait */
@media (min-width: 768px) {
	:root {
		--wrapper-height: 87vh;
		--image-max-width: 400px;
		--image-margin: 5rem;
	}
}

/* Tablet Landscape */
@media (min-width: 1024px) {
	:root {
		--wrapper-height: 87vh;
		--image-max-width: 500px;
	}
}

/* Desktop */
@media (min-width: 1280px) {
	:root {
		--wrapper-height: 87vh;
		--image-max-width: 500px;
	}
}


body {
	font-family: "Open Sans";
	background-color: "var(--color-bg)";
}

.wrapper {
	min-height: var(--wrapper-height);
	display: grid;
	place-items: center;
	margin-left: 2rem;
	margin-top: 3rem;
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

a:not(.btn--remix):link,
a:not(.btn--remix):visited {
	text-decoration: none;
	border-bottom: 6px solid var(--color-primary);
	color: var(--foreground);
	transition: background 0.2s linear;
}

a:hover {
	background: var(--color-primary);
}

.btn--remix {
	font-family: HK Grotesk;
	padding-left: 1rem;
	padding-right: 1rem;
	padding-top: 0.75rem;
	padding-bottom: 0.75rem;
	font-size: 1.1rem;
	line-height: 1rem;
	font-weight: 500;
	align-items: center;
	display: inline-flex;
	cursor: pointer;
	background: #FFFFFF;
	border: 1px solid #000000;
	box-sizing: border-box;
	border-radius: 4px;
	color: #000;
	text-decoration: none;
	vertical-align: middle;
}

.btn--remix:hover {
	background-color: #D0FFF1;
}

.btn--remix img {
	margin-right: 0.5rem;
}

.btn--remix {
	margin-right: 1rem;
}

.btn--click-me {
	user-select: none;
	cursor: pointer;
}

.btn--click-me:hover {
	text-decoration: underline;
}

.footer {
	display: flex;
	justify-content: space-between;
	margin: 0 auto;
	padding-top: 1rem;
	width: 100%;
	vertical-align: middle;
}

.footer a:not(.btn--remix):link,
a:not(.btn--remix):visited {
	font-family: HK Grotesk;
	font-style: normal;
	font-weight: normal;
	font-size: 1.1rem;
	color: #000;
	text-decoration: none;
	border-style: none;
}

.footer .links {
	padding: .5rem 1rem;
}


</style>