<template>

    <ObjectDialog :dialog="showDialog" @closed="closedDialog" :data="dialogData"/>

	<v-container fluid>
		<v-card  style="height:100vh;">
			<v-card-title style="max-width: 300px">
				<span class="text-h5">Relationships</span>				
			</v-card-title>
			<v-card-text style="max-width: 300px">
				<v-container fluid>
					<v-row no-gutters>

						<v-col cols="12">
							<v-switch v-for="sw in switches"
						      v-model="switchedOn"
						      color="secondary"
						      :label="sw"
						      :value="sw"
						      hide-details
						      @change="drawGraph"
						    ></v-switch>
						</v-col>
						<v-col id="cy" class="cy">
    					</v-col>


					</v-row>
				</v-container>
			</v-card-text>
		</v-card>
	</v-container>

</template>


<script setup>
	import ObjectDialog from '@/components/ObjectDialog.vue';
</script>



<script>
	import IdentityService from '@/services/identityService.js';
	import cytoscape from "cytoscape";
	import fcose from "cytoscape-fcose";
  
	const style = cytoscape.stylesheet()
		.selector('node').css({
			'height': 'data(size)',
			'width': 'data(size)',
			'background-fit': 'cover',
			'background-color': 'data(color)',
			'background-opacity': 0.75,
			'border-color': '#118d8e',			
			'border-width': 2,
			'label': 'data(label)',
			'text-valign': 'data(align)',
			'text-halign': 'center',
			'text-wrap': 'wrap',
			'text-max-width': 'data(size)',
			'text-margin-y': '2px',
			'text-background-color': '#fff',
			'text-background-opacity': 0,
			'font-size': 7,
			'color': '#333',
			'font-family': 'Open Sans'
		})
		.selector('edge').css({
			'curve-style': 'bezier',
			'target-arrow-shape': 'triangle',
			'target-arrow-color': '#118d8e',	
			'arrow-scale': '0.6',		
			'taxi-radius': '4',
			'width': 1.5,
			'line-color': '#118d8e'
		});
  

	export default {
		data() {
			return {
				relationships: null,
				switchedOn: [ "default" ],
				switches: [],
    			showDialog: false,
    			dialogData: null
			}
		},
		created() {
			this.loadRelationshipModel();
		},
		methods: {
			loadRelationshipModel() {
				IdentityService.getRelationships()
				.then(relationships => {
					relationships.nodes.forEach(item => { 
						if ((item.data.type != "default") && (!this.switchedOn.includes(item.data.type))) { this.switchedOn.push(item.data.type);  this.switches.push(item.data.type);} 
					});
					this.relationships = relationships;
					this.drawGraph();
				}); 
			},
		    openDialog(evt) {
			    if (evt.target.json()['data'].hasOwnProperty('ref')) {
			    	const data = evt.target.json()['data'];

			    	// Retrieve object data, object schema, and delegated admin privileges
			    	var promises = [
			    		IdentityService.callREST(`/openidm/${data.ref}/${data.id}?_fields=*`),
			    		IdentityService.getSchema(data.ref),
			    		IdentityService.callREST(`/openidm/privilege/${data.ref}`)
			    	];

			    	Promise.all(promises).then((results) => {
			    		this.dialogData = {
			    			"object": results[0],
			    			"schema": results[1],
			    			"privs": results[2]
			    		};
			    		this.showDialog = true;
			    	});
			    }
		    },
		    closedDialog() {
				this.showDialog = false;
				this.loadRelationshipModel();
		    },
		   	drawGraph() {
				var elements = { 
					nodes: this.relationships.nodes.filter((item) => (this.switchedOn.includes(item.data.type))),
					edges: this.relationships.edges.filter((item) => (this.switchedOn.includes(item.data.type))),
				};

				cytoscape.use(fcose);
          
	            var cy = cytoscape({
	                container: document.getElementById('cy'),
	                boxSelectionEnabled: true,
	                autounselectify: true,
	                style: style,
	                elements: elements,
	                layout: {
                    	name: 'fcose',
                    	directed: true,
                    	padding: 5,
                    	animate: false,
                    	fit: true,
                	},
	                minZoom: 0.5,
	                maxZoom: 3.0
	            });
	            cy.on('tap', 'node', (evt) => { this.openDialog(evt) });
	        }
		}
	}
</script>

<style>
	#cy {
		height: 90%;
		width: 90%;
		position: absolute;
		left: 0;
		top: 0;
		float: left;
		z-index: -1;
	}
</style>

