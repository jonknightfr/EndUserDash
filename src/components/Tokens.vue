<template>

	<v-container v-if="tokens">
		<v-snackbar
			v-model="snackbar.show"
			location="top"
			:color="snackbar.color"
			:timeout="2500"
			mode="multi-line"
		>
		     <v-layout align-center pr-4>
		        <v-icon class="mr-3" dark large>{{ snackbar.icon }}
		        	:icon="snackbar.icon"
		        </v-icon>
		        <v-layout column>
		          <div>{{ snackbar.msg }}</div>
		        </v-layout>
		     </v-layout>

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
			<v-col cols="4" sm="4">
				<v-card elevation="2">
					<v-card-title>
						<span class="text-h5">Token Response</span>
						<v-btn class="ma-4" color="secondary" :loading="refreshLoading" @click="refreshTokens">Refresh</v-btn>
					</v-card-title>
					<v-card-text>
						<v-sheet elevation="0" rounded>
							<v-table>
								<tbody>
									<tr v-for="(token, index) in tokens" :key="index">
										<td class="key">
												{{ index }}
											<v-textarea class="pa-0 pt-3 tokens"
											variant="solo-filled"
											:model-value="isJson(token)"
											rows="1"
											auto-grow
                      hide-details 
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
					</v-card-text>
				</v-card>
			</v-col>

			<v-col cols="4" sm="4">
				<v-card elevation="2">
					<v-card-title>
						<span class="text-h5">User Info</span>
						<v-btn class="ma-4" color="secondary" :loading="validateLoading" @click="validateTokens">Validate</v-btn>
					</v-card-title>
					<v-card-text>
						<v-sheet elevation="0" rounded>
							<v-table>
								<tbody>
									<tr v-for="(claim, index) in userInfo" :key="index">
										<td class="key">
											{{ index }}
											<v-textarea class="pa-0 pt-3 attribs"
											variant="solo-filled"
											:model-value="isJson(claim)"
											rows="1"
											auto-grow
                      hide-details                                   
											>
											<template v-slot:append v-if="String(claim).startsWith('http')">
            									<v-avatar variant="elevated" size="x-large" :image="claim">
            									</v-avatar>	
          									</template>
											</v-textarea>
										</td>
									</tr>
								</tbody>
							</v-table>
						</v-sheet>
					</v-card-text>
				</v-card>
			</v-col>

			<v-col cols="4" sm="4">
				<v-card elevation="2">
					<v-card-title>
						<span class="text-h5">OIDC Claims</span>
					</v-card-title>
					<v-card-text>
						<v-sheet elevation="0" rounded>
							<v-table>
								<tbody>
									<tr v-for="(claim, index) in oidcClaims" :key="index">
										<td class="key">											
											{{ index }}
											<v-textarea class="pa-0 pt-3 attribs"
											variant="solo-filled"
											:model-value="isJson(claim)"
											rows="1"
											auto-grow
                      hide-details                                   
											>
											<template v-slot:append v-if="String(claim).startsWith('http')">
            									<v-avatar variant="elevated" size="x-large" :image="claim">
            									</v-avatar>	
          									</template>
											</v-textarea>
										</td>
									</tr>
								</tbody>
							</v-table>
						</v-sheet>
					</v-card-text>
				</v-card>
			</v-col>

		</v-row>
	</v-container>

</template>

<script>

	import IdentityService from '@/services/identityService.js';
	import moment from 'moment';

	export default {
		data() {
			return {
				snackbar: { "show": false, "color": "secondary", "icon": "mdi-check", "msg": "" },
				tokens: null,
				oidcClaims: null,
				userInfo: null,
				refreshLoading: false,
				validateLoading: false
			}
		},
		created() {
			IdentityService.getTokens(null)
			.then(tokens => {
				this.tokens = tokens;
				this.oidcClaims = JSON.parse(atob(tokens.idToken.split(".")[1]));
			});
			IdentityService.validateTokens()
			.then(userInfo => {
				this.userInfo = userInfo;
			});			
		},
		methods: {
			computedLabel(item) {
				return this.schema.required.includes(item) ? (this.schema.properties[item].description + ' *') : this.schema.properties[item].description;
			},
			refreshTokens() {
				this.refreshLoading = true;
				IdentityService.getTokens({ forceRenew: true })
				.then(tokens => {
					this.tokens = tokens;
					this.oidcClaims = JSON.parse(atob(tokens.idToken.split(".")[1]));
					this.snackbar["msg"] = "Tokens refreshed"
					this.snackbar["icon"] = "mdi-check"				
					this.snackbar["show"] = true
					this.refreshLoading = false;
				});  
			},
			validateTokens() {
				this.validateLoading = true;
				IdentityService.validateTokens()
				.then(userInfo => {
					this.userInfo = userInfo;
					this.snackbar["msg"] = "Token is valid"
					this.snackbar["icon"] = "mdi-check"
					this.snackbar["show"] = true
					this.validateLoading = false				
				});  
			},	
			copyText(str) {
      			navigator.clipboard.writeText(str);
      			this.snackbar["msg"] = "Copied to clipboard"
				this.snackbar["icon"] = "mdi-check"				
				this.snackbar["show"] = true
			},		
			syntaxHighlight(json) {
    			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    			return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        			return match;
    			});
			},
			isJson(json) {
        		if (typeof json === "number") {
          			var now = Number(Date.now() / 1000);
          			if (Math.abs(now - json) < 200000) {        		
            			json = json + " (" + moment.unix(json).format("YYYY-MM-DD HH:mm:ss") + ")";
          			}
          			return json;
        		} else if (typeof json === "object") {
          			try {
            			var str = this.syntaxHighlight(JSON.stringify(json, null, 2));
            			return str;
          			} catch (e) {
            			return json;
          			}
        		} else {
          			try {
            			var json = JSON.parse(json);
            			return this.isJson(json);
          			} catch (e) {
        				return (decodeURIComponent(escape(json)));
        			}
      			}
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