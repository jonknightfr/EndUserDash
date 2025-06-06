<template>

	<v-container fluid>

			<v-snackbar v-model="snackbar.show" location="top" color="secondary" rounded="pill">
				<p>{{ snackbar.msg }}</p>

				<template v-slot:actions>
					<v-btn color="white" variant="text" @click="snackbar.show = false">Close</v-btn>
				</template>
			</v-snackbar>


		<v-row>
			<v-col cols="12">
				<v-card class="mx-auto pa-2 fill-height" max-width="1200" style="min-height:600px;">
					<v-card-title>
						<span class="text-h5">Organizations</span>				
					</v-card-title>
					<v-card-text>
						<v-col cols="12" id="cy" class="cy">
		    			</v-col>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<v-row>
			<v-col cols="12">
				<v-card class="mx-auto pa-2" max-width="1200" v-if="orgData">

					<v-card-title>
						<span class="text-h5" style="color: #006666;">{{ orgData.label }}</span>
						<v-btn class="float-right mx-2"
							color="secondary"
							variant="outlined"
							rounded
							:disabled="changedFields.length == 0"
							@click="saveOrgObject"
							size="small"							
						>Save</v-btn>

						<v-btn class="mx-2"
							color="secondary"
							variant="outlined"
							@click="deleteOrgObject"
							:disabled="newOrgParent != null"
							icon="mdi-trash-can-outline"
							size="x-small"							
						></v-btn>

						<v-btn class="float-right mx-2"
							color="secondary"
							variant="outlined"
							rounded
							size="small"
							@click="newOrgObject"
							:disabled="newOrgParent != null"
						>New Organization</v-btn>
					</v-card-title>

					<template v-if="orgData && orgObject">

							<!--- Totals widgets --->
							<v-row  class="mb-6" justify="center">
								<v-col cols="2" v-for="section in ['admins', 'owners', 'members']">
									<v-card class="mx-auto mt-4" max-width="150" hover elevation="4" style="border-left: 5px solid rgb(var(--v-theme-secondary))" link @click="tabs=section">
								      	<v-card-title class="text-button text-center">{{ section }}</v-card-title>
								        <v-card-text class="d-flex align-center justify-center">
								        	<h1>{{ orgData[section] ? orgData[section].resultCount : 0 }}</h1>
								        </v-card-text>
							      	</v-card> 
							      </v-col>
							</v-row>

							<v-divider></v-divider>

							<!--- Tab buttons --->
							<v-tabs v-model="tabs" align-tabs="center" color="secondary">
								<template v-for="tab in tabSections">
									<v-tab v-if="tab == 'details'" :value="tab">{{ tab }}</v-tab>
									<v-tab v-else :value="tab" :disabled="newOrgParent != null">{{ tab }}</v-tab>
								</template>
							</v-tabs>

				   			<v-card-text> 
								<v-tabs-window v-model="tabs">

									<v-tabs-window-item v-for="tab in tabSections" :value="tab">
					
										<v-sheet v-if="(tab == 'admins') || (tab == 'owners') || (tab == 'members')" elevation="0" rounded>
											<ObjectView :objects="orgData[tab].result" :allUsers="allUsers" v-if="orgData[tab]" @addUsers="(objs) => addUsers(tab,objs)" @removeUser="(obj) => removeUser(tab,obj)"/>
										</v-sheet>

										<!--- Top-level details --->
										<v-sheet v-else-if="tab == 'details'" elevation="0" rounded>
											<template v-for="item in schema.order">
												<template v-if="schema.properties[item].viewable">

													<v-text-field v-if="schema.properties[item].type === 'string'"
														variant="solo-filled"
														:label="computedLabel(item)"
														v-model="orgObject[item]"
														@change="changed(item)"
														:readonly=!schema.properties[item].userEditable
													></v-text-field>

													<v-combobox v-if="(schema.properties[item].type == 'array') && (schema.properties[item].items.type == 'string')" 
														variant="solo-filled"	
														clearable				
												  		chips
														closable-chips
												  		multiple
														:label="schema.properties[item].title"
														v-model="orgObject[item]"
														@change="changed(item)"	
														:readonly=!schema.properties[item].userEditable
													></v-combobox>

													<v-switch v-if="schema.properties[item].type == 'boolean'" class="mx-4"
												      	color="secondary"
														:label="schema.properties[item].title"
														v-model="orgObject[item]"
												      	hide-details
														@change="changed(item)"
														:readonly=!schema.properties[item].userEditable
												    ></v-switch>

												</template>
											</template>
										</v-sheet>

										<!--- Other properties with complex object types --->
										<v-sheet v-else elevation="0" rounded>
											<template v-for="item in schema.properties[tab].order">

													<v-text-field v-if="schema.properties[tab].properties[item].type === 'string'"
														variant="solo-filled"
														:label="schema.properties[tab].properties[item].title"
														v-model="orgObject[tab][item]"
														@change="changed(tab)"
														:readonly=!schema.properties[tab].properties[item].userEditable
													></v-text-field>

													<v-combobox v-if="(schema.properties[tab].properties[item].type == 'array') && (schema.properties[tab].properties[item].items.type == 'string')" 
														variant="solo-filled"	
														clearable				
												  		chips
														closable-chips
												  		multiple
														:label="schema.properties[tab].properties[item].title"
														v-model="orgObject[tab][item]"
														@change="changed(tab)"												
														:readonly=!schema.properties[tab].properties[item].userEditable
													></v-combobox>

													<v-switch v-if="schema.properties[tab].properties[item].type == 'boolean'" class="mx-4"
												      	color="secondary"
														:label="schema.properties[tab].properties[item].title"
														v-model="orgObject[tab][item]"
														@change="changed(tab)"												
												      	hide-details
														:readonly=!schema.properties[tab].properties[item].userEditable
												    ></v-switch>

											</template>

										</v-sheet>

									</v-tabs-window-item>    								
								</v-tabs-window>
								<small>*indicates required field</small>

							</v-card-text>
						</template>
				</v-card>
			</v-col>
		</v-row>

	</v-container>

</template>


<script setup>
	import ObjectView from '@/components/ObjectView.vue';
</script>

<script>

	import IdentityService from '@/services/identityService.js';
	import cytoscape from "cytoscape";
	import dagre from "cytoscape-dagre";

	const style = cytoscape.stylesheet()
		.selector('node').css({
			'height': '20',
			'width': '80',
			'background-fit': 'cover',
			'background-color': 'data(color)',
			'background-opacity': 1.00,
			'border-color': '#118d8e',
			'border-width': 1,
			'label': 'data(label)',
			'text-valign': 'center',
			'text-halign': 'center',
			'text-wrap': 'wrap',
			'text-margin': '0px',
			'text-background-color': '#fff',
			'text-background-opacity': 0,
			'font-size': 7,
			'color': 'white',
			'font-family': 'Open Sans',
			'shape': 'round-rectangle',
			'overlay-padding': '2',
			'overlay-color': '#004d4d'
		})
		.selector('edge').css({
			'curve-style': 'round-taxi',
			'target-arrow-shape': 'triangle',
			'target-arrow-color': '#118d8e',	
			'arrow-scale': '0.75',		
			'taxi-radius': '4',
			'width': 1.5,
			'line-color': '#118d8e',
			'line-style': 'data(style)',
			'color': '#FFF',
			'overlay-padding': '1',
			'overlay-color': '#004d4d',
		});

  
	export default {
		data() {
			return {
				snackbar: { "show": false, "msg": "" },
				cy: null,
				tokens: null,
				relationships: null,
				tabs: null,
				tabSections: [ 'details', 'admins', 'owners', 'members' ],
				orgData: null,
				orgObject: null,
				schema: null,
				changedFields: [],
				newOrgParent: null,
			}
		},
		created() {
			IdentityService.getTokens(null)
			.then(tokens => {
				this.tokens = tokens;
				IdentityService.callREST(`/openidm/schema/managed/alpha_organization`, this.tokens.accessToken)
				.then(object => { 
					this.schema = object;
					this.createTabs();
				});
			});			
			this.loadOrgModel();
			IdentityService.getUsers()
			.then(allUsers => {
				this.allUsers = allUsers.result.sort(this.userSort);
			}); 
		},
		mounted() {
		},
		methods: {
			computedLabel(item) {
				return this.schema.required.includes(item) ? (this.schema.properties[item].title + ' *') : this.schema.properties[item].title;
			},	
			loadOrgModel() {
				IdentityService.getOrgModel()
				.then(relationships => {
					this.relationships = relationships;
					this.drawGraph();
				}); 
			},		
			userSort(a,b) {
	  			const nameA = a.givenName.toUpperCase();
	  			const nameB = b.givenName.toUpperCase();
	  			if (nameA < nameB) return -1;
	  			else if (nameA > nameB) return 1;
	  			else return 0;
 			},			
			addUsers(field, newUsers) { 
				const patch = newUsers.map(obj => { 
					return {
						"operation": "add", 
						"field": "/" + field + "/-", 
						"value": {
							"_ref": `managed/alpha_user/${obj._id}`,
							"_refProperties": {},
						} 
					}
				});
				IdentityService.patchObject(`managed/alpha_organization/${this.orgObject._id}`, patch)
					.then(_ => {
						this.snackbar = { "show": true, "msg": `Successfully added ${patch.length} ${field}` };
						this.orgData = { "id": this.orgData.id };
						this.requestOrgObject(this.orgData);
					});	
			},
			removeUser(field, user) {
				var patch = { 
					"operation": "remove", 
					"field": "/" + field, 
					"value": {
						_ref: user._ref,
						_refProperties: user._refProperties,
						_refResourceCollection: user._refResourceCollection,
						_refResourceId: user._refResourceId
					} 
				};				
				IdentityService.patchObject(`managed/alpha_organization/${this.orgObject._id}`, [ patch ])
					.then(_ => {
						this.snackbar = { "show": true, "msg": `Successfully removed 1 ${field}.` };
						this.orgData = { "id": this.orgData.id };
						this.requestOrgObject(this.orgData);
					});
			},
		   	drawGraph() {
				var elements = { 
					nodes: this.relationships.nodes,
					edges: this.relationships.edges
				};

				cytoscape.use(dagre);

	            this.cy = cytoscape({
	                container: document.getElementById('cy'),
	                boxSelectionEnabled: true,
	                autounselectify: true,
	                style: style,
	                elements: elements,
	                layout: {
                    	name: 'dagre',
                    	directed: true,
                    	padding: 5,
                    	animate: false,
                    	fit: true
                	},
	                minZoom: 0.5,
	                maxZoom: 3.0
	            });


	            //this.cy.fit();
				this.cy.on('tap', 'node', (evt) => { this.nodeSelect(evt.target) });
				// this.cy.on('mouseover', 'node', (evt) => { this.nodeSelect(evt.target) });


				this.cy.on('tapend', 'node', (evt) => {
				    var node = evt.target;
				    var mouse = evt.position;

				    this.cy.nodes().forEach((ele) => {
				        //ensure we dont drag into self
				        if (ele.id() !== node.id() && ele.id() != "Organizations" && node.id() != "Organizations") {
				            var pos = ele.position();
				            if (mouse.x > (pos.x - 40) && mouse.x < (pos.x + 40)) {
				                if (mouse.y > (pos.y - 20) && mouse.y < (pos.y + 20)) {
				                    console.log("Move ", node.json()['data']['label'], " into ", ele.json()['data']['label']);
				                    this.moveOrg(node.id(), ele.id());
				                }
				            }
				        }
				    });
				});


        	},
        	moveOrg(source, target) {
        		var patch = { 
        			"operation": "replace", 
        			"field": "/parent", 
        			"value": { "_ref": `managed/alpha_organization/${target}`, "_refProperties": {}}
        		}; 

				IdentityService.patchObject(`managed/alpha_organization/${source}`, [ patch ])
					.then(_ => {
						this.snackbar = { "show": true, "msg": "Organization moved." };
						this.loadOrgModel();
			 		});
        	},
        	nodeSelect(target) {
				this.cy.nodes().removeStyle();
				target.animate({ style: { backgroundColor:'#004d4d' } }, { duration: 400 });
				this.orgData = target.json()['data'];
				this.newOrgParent = null;
				if (target.json()['data']['type'] != "top") this.requestOrgObject(target.json()['data']);
				else {
					this.orgObject = null;
				}
        	},
        	createTabs() {
        		this.schema.order.forEach(item => {
        			if (this.schema.properties[item].type == "object") {
        				this.tabSections.push(item);
        			}
        		});
        	},
			changed(attribute) { 
				if (!this.changedFields.includes(attribute)) this.changedFields.push(attribute); 
			},
			saveOrgObject() {
				if (this.newOrgParent != null) {
					// Creating new organization
					var newOrgObject = {};
					// If not top-level then set parent org
					if (this.newOrgParent != "Organizations") newOrgObject["parent"] = { "_ref": `managed/alpha_organization/${this.newOrgParent}`, "_refProperties": {}};
					this.changedFields.forEach(attrib => {
						newOrgObject[attrib] = this.orgObject[attrib];
					});
					IdentityService.createOrg(newOrgObject)
						.then(_ => {
							this.snackbar = { "show": true, "msg": "New organization created." };
							this.changedFields = [];
							this.newOrgParent = null;
							this.loadOrgModel();
						});
				} else {
					// Updating existing organization
					var updates = [];
					this.changedFields.forEach(attrib => { 
	          			updates.push( { "operation": "replace", "field": "/" + attrib, "value": this.orgObject[attrib]} );
					});
					
					IdentityService.patchObject(`managed/alpha_organization/${this.orgObject._id}`, updates)
					.then(_ => {
						this.snackbar = { "show": true, "msg": "Saved changes." };
						this.changedFields = [];
						this.loadOrgModel();
					});
				}
			},
			newOrgObject() {
				this.newOrgParent = this.orgData.id;
				this.orgData = {};
				this.orgObject = {};
			},
			deleteOrgObject() {
				if (this.orgData.id != "Organizations") {
					IdentityService.deleteObject(`managed/alpha_organization/${this.orgData.id}`)
						.then(_ => {
							this.snackbar = { "show": true, "msg": "Organization deleted."};
							this.orgData = null;
							this.orgObject = null;							
							this.loadOrgModel();
						})
				}
			},
			validateObject(schema, object) {
        		schema.order.forEach(item => {
        			if (!object.hasOwnProperty(item)) {
        				if (schema.properties[item].type == "string") object[item] = "";
        				if (schema.properties[item].type == "number") object[item] = 0;
        				if (schema.properties[item].type == "array") object[item] = [];
        				if (schema.properties[item].type == "boolean") object[item] = false;
        				if (schema.properties[item].type == "object") object[item] = {};
        			}
        			if (schema.properties[item].type == "object") object[item] = this.validateObject(schema.properties[item], object[item]);
        		});
        		return object;
        	},
			requestOrgObject(orgData) {				
				IdentityService.callREST(`/openidm/managed/alpha_organization/${orgData.id}/admins?_queryFilter=true&_fields=_ref,_refResourceCollection,_refResourceId,_refProperties,userName,givenName,sn,mail,profileImage`, this.tokens.accessToken)
					.then(object => this.orgData.admins = object);
				IdentityService.callREST(`/openidm/managed/alpha_organization/${orgData.id}/owners?_queryFilter=true&_fields=_ref,_refResourceCollection,_refResourceId,_refProperties,userName,givenName,sn,mail,profileImage`, this.tokens.accessToken)
					.then(object => this.orgData.owners = object);
				IdentityService.callREST(`/openidm/managed/alpha_organization/${orgData.id}/members?_queryFilter=true&_fields=_ref,_refResourceCollection,_refResourceId,_refProperties,userName,givenName,sn,mail,profileImage`, this.tokens.accessToken)
					.then(object => this.orgData.members = object);
				IdentityService.callREST(`/openidm/managed/alpha_organization/${orgData.id}?_fields=*`, this.tokens.accessToken)
					.then(orgObject => { 
						this.orgObject = this.validateObject(this.schema, orgObject);
					});
			},  
		}
	}
</script>

<style>
	#cy {
		height: 100%;
		width: 100%;
		position: absolute;
		left: 0;
		top: 0;
		float: left;
		z-index: 10;
	}
	highlighted {
		border-color: red;
		border-width: 4px;
	}
</style>

