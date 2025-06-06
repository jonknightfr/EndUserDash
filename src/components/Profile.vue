<template>

	<v-card class="mx-auto pa-2" max-width="1000" v-if="userObject">
		<v-card-title>
			<span class="text-h5">My Profile</span>
			<v-btn 
				class="ma-4"
					color="secondary"
					@click="saveUserObject"
					:disabled="changedFields.length == 0"
				>
				Save
			</v-btn>				
		</v-card-title>
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

			<v-row>
				<template v-for="item in schema.order">
					<template v-if="(schema.properties[item].viewable)">
							
						<v-col v-if="schema.properties[item].type == 'string'" cols="6">
							<v-text-field
							@change="changed(item)"
	            			:append-inner-icon="changedFields.includes(item) ? 'mdi-check' : ''"
	            			:hint="changedFields.includes(item) ? 'Press SAVE to commit change' : ''"
	            			persistent-hint
							variant="solo-filled"
							:label=computedLabel(item)
							v-model="userObject[item]"
							:readonly=!schema.properties[item].userEditable
							>
							<template v-slot:append v-if="String(userObject[item]).startsWith('http')">
            					<v-avatar variant="elevated" size="x-large" :image="userObject[item]">
            					</v-avatar>	
          					</template>
   							</v-text-field>
							
						</v-col>

						<v-col v-if="schema.properties[item].type == 'number'" cols="6">
							<v-text-field
							@change="changed(item)"						
							variant="solo-filled"
							:label=computedLabel(item)
							v-model="userObject[item]"
							:readonly=!schema.properties[item].userEditable
							type="number"
							></v-text-field>
						</v-col>

						<v-col v-if="(schema.properties[item].type == 'array') && (schema.properties[item].items.type == 'string')" cols="6">
							<v-combobox
								variant="solo-filled"	
								clearable				
						  		chips
								closable-chips
						  		multiple
								:label=computedLabel(item)
								v-model="userObject[item]"
							></v-combobox>
						</v-col>

					</template>
				</template>

			</v-row>
			<small>*indicates required field</small>
		</v-container>
	</v-card>
</template>


<script>

	import IdentityService from '@/services/identityService.js';

	export default {
		data() {
			return {
				userObject: null,
				snackbar: { "show": false, "color": "secondary", "msg": "Your profile has been updated" },
				schema: null,
				changedFields: []
			}
		},
		created() {
			IdentityService.getSchema()
			.then(schema => {
				this.schema = schema;
				IdentityService.getUser()
				.then(userObject => {
					this.userObject = userObject;
					console.log(this.userObject);
					IdentityService.callREST(`/iga/governance/user/${this.userObject._id}/grants?grantType=role`)
					.then(result => console.log("GRANT ROLE",result));
				});    
			});  
		},
		methods: {
			computedLabel(item) {
				return this.schema.required.includes(item) ? (this.schema.properties[item].description + ' *') : this.schema.properties[item].description;
			},
			saveUserObject() {
				var updates = {};
				this.changedFields.forEach(attrib => { 
					updates[attrib] = this.userObject[attrib];
				});
				IdentityService.patchUser(updates)
					.then(_ => {
						this.snackbar["show"] = true;
						this.changedFields = [];
					});
			},
			changed(attribute) { 
				console.log("ATTRIB CHANGED " + attribute)
				if (!this.changedFields.includes(attribute)) this.changedFields.push(attribute); 
			}
		}
	}
</script>

<style>
	.v-field .v-icon { 
		color: rgb(var(--v-theme-secondary)) !important;
	}

	.v-messages__message { 
		color: rgb(var(--v-theme-secondary)) !important;
	}


</style>