<template>
	<v-navigation-drawer location="left" image="/background.png" v-if="userObject">
		<template v-slot:prepend>
			<v-menu
			v-model="menu"
			:close-on-content-click="false"
			location="end"
			open-on-hover
			>
				<template v-slot:activator="{ props }">
					<v-list-item
						class="my-4"
						lines="two"
						:prepend-avatar="userObject.profileImage"
						append-icon="mdi-chevron-down"
						v-bind="props"
						:title="userObject.givenName + ' ' + userObject.sn"
						subtitle="Logged in">
					</v-list-item>
				</template>

				<v-card min-width="300">
					<v-list>
							<v-list-item
							:prepend-avatar="userObject.profileImage"
							:title="userObject.givenName + ' ' + userObject.sn"
							:subtitle="userObject.description"
							>
							<template v-slot:append>
								<v-btn
								color="secondary"
								variant="text"
								icon="mdi-heart"
								></v-btn>
							</template>
						</v-list-item>
					</v-list>

					<v-divider class="border-opacity-25"></v-divider>

					<v-list>
						<v-list-item title="Settings">
							<template v-slot:prepend>
								<v-icon color="secondary" size="large" icon="mdi-cog"></v-icon>
							</template>				
						</v-list-item>
						<v-list-item title="Help center">
							<template v-slot:prepend>
								<v-icon color="secondary" size="large" icon="mdi-help-circle"></v-icon>
							</template>				
						</v-list-item>
						<v-divider class="border-opacity-25"></v-divider>
						<v-list-item title="Logout" v-on:click="logoutUser">
							<template v-slot:prepend>
								<v-icon color="secondary" size="large" icon="mdi-logout"></v-icon>
							</template>				
						</v-list-item>
					</v-list>

					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn
						color="secondary"
						@click="menu = false"
						>
							Cancel
						</v-btn>
					</v-card-actions>
				</v-card>
			</v-menu>

		</template>

		<v-divider class="border-opacity-25"></v-divider>

		<v-list v-for="(menu, index) in topMenu" density="compact">
			<v-list-item rounded class="small-font" :title="menu.title" link @click="$router.replace(menu.to)" router>
				<template v-slot:prepend>
					<v-icon size="large" :icon="menu.icon"></v-icon>
				</template>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>


<script>

	import IdentityService from '@/services/identityService.js';

	export default {
		data() {
			return {
				menu: false,
				userObject: null,
				topMenu: [ 
						{ "title": "My Applications", "icon": "mdi-apps", "to": "/applications" },					
						{ "title": "My Profile", "icon": "mdi-account-outline", "to": "/profile" },
						{ "title": "Tokens", "icon": "mdi-hexagon-multiple", "to": "/tokens" },						
						{ "title": "Preferences", "icon": "mdi-clipboard-text", "to": "/preferences" },	
						{ "title": "Relationships", "icon": "mdi-apache-kafka", "to": "/relationships" },
						{ "title": "CIBA / Payments", "icon": "mdi-contactless-payment", "to": "/ciba" },
						{ "title": "Call Centre", "icon": "mdi-headset", "to": "/delegatedAdmin" },          
						{ "title": "Org Model", "icon": "mdi-domain", "to": "/orgModel" },          
					]
			}
		},		
		created() {
			IdentityService.getUser()
			.then(userObject => {
				this.userObject = userObject;
			});
		},
		methods: {
			async logoutUser() {
				await IdentityService.logout();
				await this.$router.push('/');
				this.$router.go();
			},
		},
	}
</script>


<style scoped>
	.v-list-item /deep/ { color: rgb(69, 84, 105); font-size: 16px; }
	.small-font :deep(.v-list-item-title){  color: grey--text; font-size: 14px; }
	.v-navigation-drawer { color: rgb(69, 84, 105); }
</style>