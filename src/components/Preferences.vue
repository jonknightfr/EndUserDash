<template>


	<v-card class="mx-auto pa-2" max-width="1000" v-if="switches.length > 0">
		<v-card-title>My Preferences</v-card-title>
		<v-container fluid>
			<v-snackbar
				v-model="snackbar.show"
				location="top"
				:color="snackbar.color"
				rounded="pill"
				>
				<p>{{ snackbar.msg }}</p>

				<template v-slot:actions>
					<v-btn
						color="white"
						variant="text"
						@click="snackbar.show = false"
						>
						Close
					</v-btn>
				</template>
			</v-snackbar>
			
			<v-row dense>

				<v-col>
					<v-switch v-for="sw in switches"
				      v-model="switchedOn"
				      color="secondary"
				      :label="schema.properties.preferences.properties[sw].description"
				      :value="sw"
				      hide-details
				      @change="updatePrefs"
				    ></v-switch>
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
				schema: null,
				switchedOn: [],
				switches: []
			}
		},
		created() {
			IdentityService.getSchema()
				.then(schema => {
					this.schema = schema;
					IdentityService.getUser()
						.then(userObject =>  {
							this.switches = schema.properties.preferences.order;
							this.switchedOn = Object.entries(userObject.preferences)
								.filter(([key,value]) => (value)).map(([key,value]) => key);
						});
				});
		},
		methods: {
 			updatePrefs() { 
				var prefs = {};
				var switchedOn = this.switchedOn;
				this.switches.forEach(function(sw) { 
					prefs[sw] = switchedOn.includes(sw);
				});
				IdentityService.patchUser({ "preferences": prefs } )
					.then(_ => this.snackbar["show"] = true);
			}

		}
	}
</script>
