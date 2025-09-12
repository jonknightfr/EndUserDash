<template>

  <ObjectDialog :dialog="showDialog" :data="dialogData" @closed="closedDialog" />

  <v-card class="mx-auto pa-2" max-width="1000">
    <v-card-title>
      People You Manage
    </v-card-title>
    <v-card-subtitle class="mb-6">
      If you have appropriate permissions you will be able to<br>view and manage a subet of users here.
    </v-card-subtitle>
    
    <v-container fluid v-if="users">
        <v-text-field
              variant="solo-filled"
              label="Search"
              v-model="filterPattern"
              @input="filter"
        ></v-text-field>
      
      
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
      
      <v-row v-for="user in filteredUsers" class="ma-4" dense>
        <v-col cols="12">
                  
          <v-progress-linear v-if="user.timeout > 0" :model-value="(user.timeout*100)/(user.responseDetails.expires_in)" :height="6" color="secondary"></v-progress-linear>

          <v-card :color="statusMessage(user.status).colour"
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

            <v-btn class="ma-2"
              color="secondary"
              text="Edit"
              variant="tonal"
              size="small" 
              rounded
              @click="openDialog(user._id)">                      
            </v-btn>

            <v-btn class="ma-4"
              variant="tonal"
              color="secondary"
              size="small"
              rounded
              @click="lockUnlock(user)" 
              v-bind="props"        
              :text="user.accountStatus == 'active' ? 'Lock' : 'Unlock'"
              :prepend-icon="user.accountStatus == 'active' ? 'mdi-lock' : 'mdi-lock-open'"
            ></v-btn>

            <v-btn class="ma-4"
               variant="tonal"
               color="secondary"
               size="small"
               rounded
                v-bind="props"
                text="Reset MFA"
            ></v-btn>

                <v-tooltip text="Starts a CIBA flow to request this user's approval" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn class="ma-2"
                           variant="tonal"
                           color="secondary"
                           size="small"
                           rounded
                           @click="startCIBA(user)" 
                           :loading="user.status == 'pending'"
                            v-bind="props"
                            text="Confirm ID"
                        ></v-btn>

                    </template>
                </v-tooltip>                  

                <v-tooltip text="Validate the user's access token, if available" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn class="ma-2"
                               density="compact"
                               variant="text"
                               color="secondary"
                               @click="validateToken(user)"
                               icon="mdi-check-circle"
                               v-bind="props"
                        >
                        </v-btn> 
                    </template>
                </v-tooltip>   
                   
                <v-tooltip text="Revoke/delete the user's access token" location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn  
                               density="compact"
                               variant="text"
                               color="secondary"
                               @click="revokeToken(user)" 
                               :disabled="user.status != 'success'"
                               icon="mdi-delete"
                               v-bind="props"
                        ></v-btn>  
                    </template>
                </v-tooltip>           
              
              <v-btn
                :icon="user.show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click="user.show = !user.show"
              ></v-btn>

              <div class="position-static d-inline-block me-2">
                <span class="v-messages ma-2">{{ statusMessage(user.status).msg }}</span>
                <v-btn v-if="user.status == 'success'"
                  density="compact"
                  variant="plain"
                  color="secondary"
                  icon="mdi-content-copy"
                  size="x-small"
                  @click="copyText(user.responseDetails)"
                ></v-btn>
              </div>

        </template>

            <v-expand-transition>
              <div v-show="user.show">
                <v-divider class="border-opacity-25"></v-divider>             
                <v-card-text>
                  {{ user.givenName }}
                </v-card-text>
              </div>
            </v-expand-transition>

      </v-card>          
        </v-col>
      </v-row>  
    </v-container>
  </v-card>
</template>


<script setup>
    import ObjectDialog from '@/components/ObjectDialog.vue';  
</script>

<script>

  import IdentityService from '@/services/identityService.js';
  import cibaService from '@/services/cibaService.js';
  
  
  export default {
    data() {
      return {
        snackbar: { "show": false, "color": "secondary", "icon": "mdi-check", "msg": "" },
        schema: null,
        users: null,
        filterPattern: "",
        filteredUsers: null,
        showDialog: false,
        dialogData: null     
      }
    },
    created() {
      this.loadData();
    },
    methods: {
      filter() {
        if (this.filterPattern == null || this.filterPattern == "") this.filteredUsers = this.users;
        else this.filteredUsers = this.users.filter(user => JSON.stringify(user).toLowerCase().includes(this.filterPattern.toLowerCase()));
      },
      loadData() {
        IdentityService.getSchema()
          .then(schema => {
            this.schema = schema;
            IdentityService.getUsers()
              .then(users => {
                this.users = users.result;
                this.filter();
            }); 
        });
      },
      statusMessage(status) {
        var msg;
        var col;
        switch (status) {
          case "pending":
            msg = "Awaiting approval ...";
            col = "yellow-lighten-5";
            break;
          case "success":
            msg = "User approved.";
            col = "green-lighten-5";
            break;
          case "denied":
            msg = "User declined."
            col = "orange-lighten-5";
            break;
          case "failed":
            msg = "Not approved or error."
            col = "red-lighten-5";
            break;
          case "initFailed":
            msg = "Failed. Not Push registered?"
            col = "red-lighten-5";
            break;            
          default:
            msg = "";
            col = "white";
        }
        return { "msg": msg, "colour": col }
      },
      lockUnlock(user) {
        user.accountStatus = (user.accountStatus == 'active' ? 'inactive' : 'active');
        IdentityService.patchObject(`managed/alpha_user/${user._id}`, [ { "operation": "replace", "field": "/accountStatus", "value": user.accountStatus } ]);
      },
      startCIBA(user) {
        user["status"] = "pending";
        cibaService.startCIBA("Please approve the contact centre", user.userName)
        .then((jwt) => { 
          cibaService.initCIBA(jwt)
          .then((cibaResponse) => {
            if (cibaResponse.hasOwnProperty("auth_req_id")) {
                    setTimeout(_ => {
                      this.pollCIBA(user, cibaResponse.auth_req_id);
                    }, 4000);
            } else if (cibaResponse.status == 400) {
              user.status = "initFailed";
            }
          });
        });
      },
      pollCIBA(user, auth_req_id) {
        cibaService.pollCIBA(auth_req_id)
        .then(response => {
          user["responseDetails"] = response;
          if (response.hasOwnProperty("access_token")) {
            console.log(response);
            user.status = "success";
            user.timeout = response.expires_in;
            user.timer = setInterval(function() {
              user.timeout = user.timeout - 0.2;
              if (user.timeout <= 0) {
                clearTimeout(user.timer);
                user.status = "";
              }
            }, 200);
          } else if (response.hasOwnProperty("error")) {
            if (response.error == "unknown_auth_req_id") {
              user.status = "failed";
            }
            else if (response.error == "access_denied") 
            {
              user.status = "denied";
            }
            else if (response.error == "authorization_pending") {
              user.status = "pending";
              setTimeout(_ => {
                this.pollCIBA(user, auth_req_id);
              }, 4000);
            }
          }
        });
      },
      validateToken(user) {
          if (user.hasOwnProperty('responseDetails')  && (user.responseDetails.hasOwnProperty('access_token'))) {
              cibaService.introspect(user.responseDetails.access_token)
                  .then(resp => { 
                    if (resp.active) {
                      this.snackbar.msg = `Token valid. Expires in ${resp.expires_in} seconds.`;
                      this.snackbar.icon = "mdi-check";
                      this.snackbar.color = "secondary";
                    } else {
                      this.snackbar.msg = "Token expired, revoked, missing, or invalid,";
                      this.snackbar.icon = "mdi-alert";
                      this.snackbar.color = "warning";
                      user.status = "";
                    }
                    this.snackbar.show = true;
              });
          } else {
              this.snackbar.msg = "Token expired, revoked, missing, or invalid,";
              this.snackbar.icon = "mdi-alert";
              this.snackbar.color = "warning";
              user.status = "";
              this.snackbar.show = true;
          }
      },    
      revokeToken(user) {
          cibaService.revoke(user.responseDetails.access_token)
              .then(resp => { 
                  this.snackbar.msg = `Token revoked.`;
                  this.snackbar.icon = "mdi-check";
                  this.snackbar.color = "secondary";
                  this.snackbar.show = true;
                  clearTimeout(user.timer);
                  user.timeout = 0;
                  user.status = "";            
          });
      },        
      copyText(str) {
          if (typeof str == "object") str = JSON.stringify(str);
          navigator.clipboard.writeText(str);
      },
      openDialog(id) {
          console.log("ID",id);
          // Retrieve object data, object schema, and delegated admin privileges
          var promises = [
            IdentityService.callREST(`/openidm/managed/alpha_user/${id}?_fields=*`),
            IdentityService.callREST(`/openidm/privilege/managed/alpha_user`)
          ];

          Promise.all(promises).then((results) => {
            this.dialogData = {
              "object": results[0],
              "privs": results[1],
              "schema": this.schema
            };
            this.showDialog = true;
          });
      },
      closedDialog() {
        this.showDialog = false;
        this.loadData();
      }
    }
  }
</script>



<style>
  .v-label--clickable { font-size:14px; color: rgb(var(--v-theme-secondary)); }
</style>
