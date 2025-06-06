<template>

  <ObjectDialog :dialog="showDialog" @saved="(data,changedFields) => saveObject(data,changedFields)" @deleted="(data) => deleteObject(data)" :data="dialogData"/>


	<v-card class="mx-auto pa-2" max-width="1000">
		<v-card-title>
			People You Manage
		</v-card-title>
		
		<v-container fluid v-if="users">
      	<v-text-field
							variant="solo-filled"
							label="Search"
							v-model="filterPattern"
              @input="filter"
        ></v-text-field>
      
      
			<v-row v-for="user in filteredUsers" class="ma-4" dense>
				<v-col cols="12">
          <v-card
        class="mx-auto"
        :subtitle="user.mail"
        :title="user.givenName + ' ' + user.sn"
      >
            

        <template v-slot:prepend v-if="user.profileImage">
          <v-avatar size="48">
            <v-img
              :src="user.profileImage"
            ></v-img>
          </v-avatar>
        </template>
        <template v-slot:prepend v-else>
          <v-avatar color="secondary">
            <v-icon icon="mdi-account"></v-icon>
          </v-avatar>
        </template>

        <template v-slot:append>
							<v-btn size="small" class="mr-4"
							>Verify ID</v-btn>
              <v-btn
                variant="text"
								:icon="user.show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
								@click="user.show = !user.show"
							></v-btn>


        </template>

						<v-expand-transition>
							<div v-show="user.show">
								<v-divider class="border-opacity-25"></v-divider>							
								<v-card-text>

                          <v-row>
          <v-col cols="3"  v-for="attrib in attribs">
          <v-text-field class="ma-0"
                        variant="solo-filled"
                        hide-details
                        :label="schema.properties[attrib].description"
                        :model-value="user[attrib]"
                        >
          </v-text-field>
          </v-col>
          </v-row>
                
                
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="secondary"
                    text="Edit"
                    variant="tonal"
                    rounded
                    @click="openDialog(user._id)">                      
                  </v-btn>
                </v-card-actions>
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
  import ObjectDialog from '@/components/ObjectDialog.vue';
  	import cibaService from '@/services/cibaService.js';
  
  
	export default {
		data() {
			return {
        schema: null,
        users: null,
        attribs: [ "givenName", "sn", "mail", "telephoneNumber", "city", "postalCode" ],
        filterPattern: "",
        filteredUsers: null,
        showDialog: false,
        dialogData: null
			}
		},
		created() {
      IdentityService.getSchema()
        .then(schema => {
          this.schema = schema;
    			IdentityService.getUsers()
		    		.then(users => {
              this.users = users.result;
              this.filteredUsers = users.result; 
          });	
      });
		},
		methods: {
      filter() {
        this.filteredUsers = this.users.filter(user => JSON.stringify(user).toLowerCase().includes(this.filterPattern.toLowerCase()));
      },
      openDialog(evt) {
        console.log(evt.target)
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
		}
	}
</script>



