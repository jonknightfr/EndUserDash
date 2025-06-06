<template>
	<v-app-bar elevation="1" image="/background.png">

		<template v-slot:prepend>
			<v-app-bar-nav-icon></v-app-bar-nav-icon>
		</template>

		<v-btn icon>
			<v-icon>mdi-cloud-outline</v-icon>
		</v-btn>

	 	<v-img class="mx-2" src="/pinglogo.png" max-height="40" max-width="160" contain></v-img>

		<v-spacer></v-spacer>

    	<v-btn v-if="!userObject" class="ma-2 pa-2" v-on:click="login">Login</v-btn>
    	<v-btn v-if="userObject" class="ma-2 pa-2" v-on:click="logout">Logout</v-btn>
		
		<v-btn icon>
			<v-icon>mdi-magnify</v-icon>
		</v-btn>

	</v-app-bar>
</template>


<script>

	import IdentityService from '@/services/identityService.js';

	export default {
		name: 'AppBar',
		data() {
			return {
				userObject: null
			}
		},
		created() {
			IdentityService.getUser()
			.then(userObject => {
				this.userObject = userObject;
			});    
		},
		methods: {
			login() {
				IdentityService.login();
			},
			async logout() {
				await IdentityService.logout();
				await this.$router.push('/');
				this.$router.go();
			},
		}
	}
</script>

