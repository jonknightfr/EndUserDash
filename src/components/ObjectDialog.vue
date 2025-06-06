<template>
    <v-dialog
      :modelValue="dialog"
      max-width="1000"
      min-width="800"
      min-height="600"
    >

      <v-card
        prepend-icon="mdi-information-variant-circle"
        :title="data.schema.title"
      >

      <template v-slot:append v-if="data.object.hasOwnProperty('profileImage') && String(data.object['profileImage']).startsWith('http')">
        <v-avatar variant="elevated" size="x-large" :image="data.object['profileImage']">
        </v-avatar> 
      </template>

        <v-card-text>
              <v-tabs v-model="tabs" align-tabs="center" color="secondary" class="mb-4">
                <template v-for="tab in tabSections">
                  <v-tab :value="tab">{{ tab }}</v-tab>
                </template>
              </v-tabs>

              <v-tabs-window v-model="tabs">
                  <v-tabs-window-item v-for="tab in tabSections" :value="tab">

                    <v-row dense>

                    <template v-for="item in schemaSections[tab]['order']">

                      <!--- If "viewable" flag doesn't exist then assume item is viewable --->
                      <template v-if="(!schemaSections[tab]['properties'][item].hasOwnProperty('viewable')) || (schemaSections[tab]['properties'][item].viewable)">
                          
                        <!--- Need to treat top-level "Details" tab as special case --->
                        <template v-if="tab == 'Details'">
                          <v-col v-if="['string','number'].includes(data.schema['properties'][item].type) && data.privs.VIEW.allowed && data.privs.VIEW.properties.includes(item)" cols="6">
                            <v-text-field
                              class="ma-2"
                              persistent-hint
                              variant="solo-filled"
                              v-model="data.object[item]"
                              :label="labels[tab][item]"
                              :type="data.schema['properties'][item].type"
                              hide-details
                              :disabled="!(data.privs.UPDATE.allowed && data.privs.UPDATE.properties.includes(item))"
                              @change="changed(item)"
                            ></v-text-field>
                          </v-col>

                          <v-row v-if="['boolean'].includes(data.schema['properties'][item].type) && data.privs.VIEW.allowed && data.privs.VIEW.properties.includes(item)">
                            <v-switch class="mx-4"
                              color="secondary"
                              :label="labels[tab][item]"
                              v-model="data.object[item]"
                              hide-details
                              :disabled="!(data.privs.UPDATE.allowed && data.privs.UPDATE.properties.includes(item))"
                              @change="changed(item)"
                            ></v-switch>
                          </v-row>

                          <v-col v-if="['array'].includes(data.schema['properties'][item].type) && ['string'].includes(data.schema['properties'][item].items.type) && data.privs.VIEW.allowed && data.privs.VIEW.properties.includes(item)" cols="6">
                            <v-combobox
                              variant="solo-filled" 
                              clearable       
                              chips
                              closable-chips
                              multiple
                              :label="labels[tab][item]"
                              v-model="data.object[item]"
                              :disabled="!(data.privs.UPDATE.allowed && data.privs.UPDATE.properties.includes(item))"
                              @change="changed(item)"
                            ></v-combobox>
                          </v-col>
                        </template>

                        <template v-else>   <!--- Non-details tab --->
                          
                          <v-col v-if="['string','number'].includes(data.schema['properties'][tab]['properties'][item].type) && data.privs.VIEW.allowed && data.privs.VIEW.properties.includes(tab)" cols="12">
                            <v-text-field
                            persistent-hint
                            variant="solo-filled"
                            v-model="data.object[tab][item]"
                            :label="labels[tab][item]"
                            :type="data.schema['properties'][tab]['properties'][item].type"
                            hide-details
                            :disabled="!(data.privs.UPDATE.allowed && data.privs.UPDATE.properties.includes(tab))"
                            @change="changed(tab)"
                            ></v-text-field>
                          </v-col>

                          <v-col cols="12">
                            <v-switch v-if="['boolean'].includes(data.schema['properties'][tab]['properties'][item].type) && data.privs.VIEW.allowed && data.privs.VIEW.properties.includes(tab)" class="mx-4"
                              color="secondary"
                              :label="labels[tab][item]"
                              v-model="data.object[tab][item]"
                              hide-details
                              :disabled="!(data.privs.UPDATE.allowed && data.privs.UPDATE.properties.includes(tab))"                            
                              @change="changed(tab)"
                            ></v-switch>
                          </v-col>

                          <v-col v-if="['array'].includes(data.schema['properties'][tab]['properties'][item].type) && ['string'].includes(data.schema['properties'][tab]['properties'][item].items.type) && data.privs.VIEW.allowed && data.privs.VIEW.properties.includes(item)" cols="6">
                            <v-combobox
                              variant="solo-filled" 
                              clearable       
                              chips
                              closable-chips
                              multiple
                              :label="labels[tab][item]"
                              v-model="data.object[tab][item]"
                              :disabled="!(data.privs.UPDATE.allowed && data.privs.UPDATE.properties.includes(item))"
                              @change="changed(tab)"
                           ></v-combobox>
                          </v-col>                        
                        </template>

                      </template>
                    </template>

                  </v-row>

                  </v-tabs-window-item>
                </v-tabs-window>


        </v-card-text>
          <small class="ma-6">*indicates required field</small>

        <v-divider></v-divider>

        <v-card-actions>
           <v-btn
            v-if="data.privs.DELETE.allowed && (!confirmDelete)"
            color="secondary"
            text="Delete"
            variant="tonal"
            @click="confirmDelete=true"
          ></v-btn>

          <v-btn
            v-if="data.privs.DELETE.allowed && confirmDelete"
            color="secondary"
            text="Cancel"
            variant="tonal"
            @click="confirmDelete=false"
          ></v-btn>

          <v-btn
            v-if="data.privs.DELETE.allowed && confirmDelete"
            color="red"
            text="Confirm?"
            variant="tonal"
            @click="deleteObject"
          ></v-btn>

          <v-spacer></v-spacer>

          <v-btn
            text="Close"
            variant="plain"
            @click="dialog = false"
          ></v-btn>

          <v-btn
            color="secondary"
            text="Save"
            variant="tonal"
            @click="saveObject"
            :disabled="changedFields.length == 0"
          ></v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>
</template>


<script>
    import IdentityService from '@/services/identityService.js';

    export default {
      props: [ 'dialog', 'data' ],
      emits: [ 'closed' ],
      data() {
        return {
          tabSections: null,
          tabs: null,
          confirmDelete: false,
          changedFields: []
        }
      },
      computed: {
        labels: function() {
          var result = { "Details": {} };
          this.data.schema.order.forEach(item => {
            var label = (this.data.schema.properties[item].hasOwnProperty('title') ? this.data.schema.properties[item]['title'] : this.data.schema.properties[item]['description']);
            if (this.data.schema.required.includes(item)) label += " *";
            result['Details'][item] = label;

            if (this.data.schema.properties[item].type == "object") {
              result[item] = {};
              this.data.schema.properties[item].order.forEach(subitem => {
                var label = (this.data.schema.properties[item].properties[subitem].hasOwnProperty('title') ? this.data.schema.properties[item].properties[subitem]['title'] : this.data.schema.properties[item].properties[subitem]['description']);
                if ((this.data.schema.properties[item].hasOwnProperty('required')) && (this.data.schema.properties[item].required.includes(subitem))) label += " *";
                result[item][subitem] = label;
              });
            }
          });
          return result;
        },
        schemaSections: function() {
          var result = {};
          this.tabSections.forEach(section => {
            if (section == "Details") result[section] = this.data.schema;
            else result[section] = this.data.schema.properties[section];
          })
          return result;
        }
      },
      watch: {
        data() {
          console.log("THIS", this.data);
          this.data.object = this.validateObject(this.data.schema, this.data.object);
          this.tabSections = [ "Details" ];
          this.data.schema.order.forEach(item => {
            if (this.data.schema.properties[item].type == "object" && this.data.schema.properties[item].viewable) {
              this.tabSections.push(item);
            }
          });
        },
        dialog() {
          // Reset dialog state on close
          if (this.dialog == false) {
            this.confirmDelete = false;
            this.tabs = null;
          }
        }
      },
      methods: {
        validateObject(schema, object) {
            // In case object doesn't exist, e.g. user preferences object
            if (object == null) object = {};
            schema.order.forEach(item => {
              if (!object.hasOwnProperty(item)) {
                if (schema.properties[item].type == "string") object[item] = "";
                if (schema.properties[item].type == "number") object[item] = 0;
                if (schema.properties[item].type == "array") object[item] = [];
                if (schema.properties[item].type == "boolean") object[item] = false;
                if (schema.properties[item].type == "object") object[item] = {};
              }
              if (schema.properties[item].type == "object") {
                object[item] = this.validateObject(schema.properties[item], object[item]);
              }
            });
            return object;
        },
        changed(attribute) { 
          if (!this.changedFields.includes(attribute)) this.changedFields.push(attribute); 
        },
        saveObject() {
          var patches = [];
          this.changedFields.forEach(attrib => { 
            patches.push({ 
                  "operation": "replace", 
                  "field": `/${attrib}`, 
                  "value": this.data.object[attrib]
                }); 
          });       
          IdentityService.patchObject(`${this.data.schema.resourceCollection}/${this.data.object._id}`, patches)
          .then(_ => {
            console.log("EMIT SAVED");
            this.$emit("closed");
            //this.loadRelationshipModel();
            // 
          });
        },
        deleteObject() {
          IdentityService.deleteObject(`${this.data.schema.resourceCollection}/${this.data.object._id}`)
          .then(_ => {
            this.$emit("closed");
          });
        },
      },
    };
</script>


<style>
  .v-overlay {
    --v-overlay-opacity: 0.15 !important;
  }
</style>