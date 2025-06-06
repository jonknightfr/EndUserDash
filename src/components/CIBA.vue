<template>

	<v-card class="mx-auto pa-2" max-width="1000">
		<v-card-title>
			CIBA / Payment / Transaction
		</v-card-title>
		
		<v-container fluid>
			<v-row>
				<v-col cols="12">
					<v-text-field class="mx-auto" 
						variant="solo-filled"
						label="Transaction Details"
						hint="Example: 'Approve payment of £300.00 to account ending in 5430'"
						persistent-hint
						v-model="transactionDetails">
					    <template #append>
							<v-btn class="ma-4" color="secondary" :loading="loading" @click="startCIBA" :disabled="transactionDetails === ''">Request</v-btn>					
					    </template>
					</v-text-field>
				</v-col>

				<v-col cols="12">
					<v-text-field class="mx-auto" 
						variant="solo-filled"
						label="(Optional) Username"
						hint="Provide a valid username if the request is to be approved by another individual. The user will need to be registered for Push Notifications."
						persistent-hint
						v-model="alternativeUser">
					</v-text-field>
				</v-col>

				<v-col cols="12">
					<v-card class="mx-auto" elevation="4">
				      	<v-card-title class="text-button">Response</v-card-title>
									<v-tabs v-model="tab" align-tabs="center" color="secondary">
										<v-tab value="status">STATUS</v-tab>									
										<v-tab value="tokens">TOKENS</v-tab>
										<v-tab value="user">USER ATTRIBUTES</v-tab>
									</v-tabs>
   				   <v-card-text> 
							<v-tabs-window v-model="tab">
   								<v-tabs-window-item value="status">	
									<v-sheet elevation="0" rounded>
										<p v-html="responseMessage"></p>
									</v-sheet>
								</v-tabs-window-item>    								
								<v-tabs-window-item value="tokens">	
									<v-sheet elevation="0" rounded>
										<v-table>
											<tbody>
												<tr v-for="(token, index) in responseDetails" :key="index">
													<td class="key">
															{{ index }}
														<v-textarea class="pa-0 pt-3 tokens"
														variant="solo-filled"
														:model-value="token"
														rows="1"
														auto-grow
														>
													    <template v-slot:append-inner>
													      <v-btn 
													      	density="compact"
													      	variant="plain"
													      	color="secondary"
													        icon="mdi-content-copy"
													        size="x-small"
													        @click="copyText(token)"
													      ></v-btn>
													    </template>											
														</v-textarea>
													</td>
												</tr>
											</tbody>
										</v-table>
									</v-sheet>
								</v-tabs-window-item>
								<v-tabs-window-item value="user">	
									<v-sheet elevation="0" rounded>
										<v-table v-if="responseUserObject">
                          <v-row>
                            <v-col cols="6"></v-col>
                            <v-col cols="6">
                              <v-btn class="float-right ml-3" color="secondary" size="small" icon="mdi-refresh" @click="requestUserObject"></v-btn>					

                              <v-select
                                variant="solo-filled"
                                :items="['GET user']"
                                density="compact"
                                hint="Select REST API"
                                persistent-hint
                                v-model="defaultSelected"
                              ></v-select>
                            </v-col>
                      </v-row>
											<tbody>
												<template v-for="item in schema.order">
													<tr v-if="(responseUserObject[item] != null) && (responseUserObject[item] != []) && (responseUserObject[item] != '')">
														<td class="key">
															{{ schema.properties[item].description }}
															<v-textarea class="pa-0 pt-3 tokens"
															variant="solo-filled"
															:model-value="responseUserObject[item]"
															rows="1"
															auto-grow
															>
															</v-textarea>
														</td>
													</tr>
												</template>
											</tbody>
										</v-table>
									</v-sheet>
								</v-tabs-window-item>
							</v-tabs-window>									
				        </v-card-text>

			      	</v-card> 
				</v-col>
			</v-row>	
		</v-container>
	</v-card>
</template>



<script>

	import IdentityService from '@/services/identityService.js';
	import cibaService from '@/services/cibaService.js';
  
  
	export default {
		data() {
			return {
				transactionDetails: "",
				alternativeUser: null,
				responseMessage: "",
				responseDetails: null,
				loading: false,
				responseUserObject: null,
				schema: null,
				tab: null,
        defaultSelected: "GET user"
			}
		},
		created() {
			IdentityService.getSchema()
			.then(schema => {
				this.schema = schema;
				IdentityService.getUser()
					.then(userObject => this.alternativeUser = userObject.userName);
			}); 			
		},
		methods: {
			validateTokens() {
				IdentityService.validateTokens()
				.then(userInfo => {
					this.userInfo = userInfo;
				});  
			},		
			startCIBA() {
				this.loading = true;
				this.responseMessage = `<span style="color: rgb(var(--v-theme-secondary));">&bull;</span> Awaiting user's approval (${this.alternativeUser})<br>`;
				this.responseDetails = null;
				cibaService.startCIBA(this.transactionDetails, this.alternativeUser)
				.then((jwt) => { 
					cibaService.initCIBA(jwt)
					.then((cibaResponse) => {
						if (cibaResponse.hasOwnProperty("auth_req_id")) {
          					setTimeout(_ => {
            					this.pollCIBA(cibaResponse.auth_req_id);
          					}, 4000);
      					}
					});
				});
			},
			pollCIBA(auth_req_id) {
				cibaService.pollCIBA(auth_req_id)
				.then(response => {
					this.responseDetails = response;
					if (response.hasOwnProperty("access_token")) {
						this.loading = false;
						this.responseMessage += `<span style="color: rgb(var(--v-theme-secondary));">&bull;</span> Approved!`;
            this.requestUserObject();
					} else if (response.hasOwnProperty("error")) {
						if (response.error == "unknown_auth_req_id") {
							this.loading = false;
							this.responseMessage += `<span style="color: rgb(var(--v-theme-secondary));">&bull;</span> Something failed.`;
						}
						else if (response.error == "access_denied") 
						{
							this.loading = false;
							this.responseMessage += `<span style="color: rgb(var(--v-theme-secondary));">&bull;</span> Sorry, user denied the request.`;
						}
						else if (response.error == "authorization_pending") {
							this.responseMessage += `<span style="color: rgb(var(--v-theme-secondary));">&bull;</span> Awaiting user's approval<br>`;
							setTimeout(_ => {
								this.pollCIBA(auth_req_id);
							}, 4000);
						}
					}
				});
			},
      requestUserObject() {
					var targetUser = JSON.parse(atob(this.responseDetails.id_token.split(".")[1]));        
					IdentityService.callREST(`/openidm/managed/alpha_user/${targetUser.subname}`, this.responseDetails.access_token)
							.then(userObject => this.responseUserObject = userObject);
      },
			syntaxHighlight(json) {
    			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    			return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        			var cls = 'darkorange'; // number
        			if (/^"/.test(match)) { 
        				if (/:$/.test(match)) cls = 'red'; else cls = 'green'; // key or string
        			} else if (/true|false/.test(match)) { 
        				cls = 'blue'; // boolean
        			} else if (/null/.test(match)) {
            			cls = 'darkgrey';
        			}
        			return '<span style="color:' + cls + '">' + match + '</span>';
    			});
			},
		}
	}
</script>


<style scoped>

	.key { color: rgb(var(--v-theme-secondary)); }

	td.key { 
		padding: 10px !important; 
	}

	.v-input__details /deep/ { display: none; }

	.tokens /deep/ textarea { font-size: 12px; font-family: monospace; }
	.attribs /deep/ textarea { font-size: 12px; }

</style>
