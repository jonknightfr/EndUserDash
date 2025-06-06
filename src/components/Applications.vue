<template>

	<v-card class="mx-auto pa-2" max-width="1000" v-if="applications" variant="flat">
		<v-card-title>My Applications</v-card-title>
		<v-container fluid>	

			<v-row dense>
				<v-col v-for="application in applications" cols="4">
					<v-card hover class="mx-auto mt-4" width="250"
			    	   	link
				      	>
				      	<v-card-title @click="openApp(application.url)" class="text-button text-center">{{ application.name }}</v-card-title>
				        <v-card-text class="d-flex align-center justify-center" @click="openApp(application.url)">
				        	<v-img class="mt-4"
				        	max-height="60"
				        	:src="application.icon ? application.icon : 'https://cdn.vuetifyjs.com/images/parallax/material.jpg'"
				        	></v-img>
				        </v-card-text>

					    <v-card-actions>
							<v-spacer></v-spacer>

							<v-btn
								:icon="application.show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
								@click="application.show = !application.show"
							></v-btn>
						</v-card-actions>

						<v-expand-transition>
							<div v-show="application.show">
								<v-divider class="border-opacity-25"></v-divider>							
								<v-card-text>
									{{ (application.description != null) ? application.description : "No description" }}
								</v-card-text>
							</div>
						</v-expand-transition>

			      	</v-card> 
			    </v-col>
			</v-row>
		</v-container>
	</v-card>

</template>


<script>

	import IdentityService from '@/services/identityService.js';

	export default {
		data() {
			return {
				snackbar: { "show": false, "color": "#88e387", "msg": "Preferences saved." },
				applications: null,
				show: false
			}
		},
		created() {
			console.log("APPLICATIONS GETTING");
			IdentityService.getApplications()
				.then(applications => {
					console.log(this.$router);
					this.applications = applications.result;
				});
		},
		methods: {
			openApp(url) {
				window.open(url, '_blank');
			}
		}
	}
</script>
