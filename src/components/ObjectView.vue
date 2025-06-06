<template v-if="objects">

	<v-text-field v-if="!addingUsers" variant="solo-filled" label="Search" v-model="filterPattern" @input="filter"></v-text-field>
	
		<v-btn v-if="!addingUsers" class="mx-4"
	   		variant="outlined"
	   		color="secondary"
	   		size="small"
	   		rounded
	   		@click="addingUsers = true"
		>Add Users</v-btn>

		<v-select v-if="addingUsers"
  		clearable
  		:items="availableUsers"
  		item-value="mail"
  		label="Select users to add or remove"
  		multiple
  		v-model="selectedUsers"
		>
	    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props" :title="`${item.raw.givenName} ${item.raw.sn}`" :subtitle="item.raw.mail"></v-list-item>
    </template>
 
    <template v-slot:selection="{ item, index }">
      <v-chip>
        <span>{{ item.raw.givenName + ' ' + item.raw.sn }}</span>
      </v-chip>
    </template>
		</v-select>

		<v-btn v-if="addingUsers" class="mx-4"
	   		variant="outlined"
	   		color="secondary"
	   		size="small"
	   		rounded
	   		@click="addUsers"
		>Save</v-btn>

		<v-btn v-if="addingUsers"
	   		variant="outlined"
	   		color="secondary"
	   		size="small"
	   		rounded
	   		@click="addingUsers = false"
		>Cancel</v-btn>

		<v-row v-for="object in filteredObjects" class="ma-4" dense>
			<v-col cols="12">
				<v-card class="mx-auto" :subtitle="object.mail" :title="object.givenName + ' ' + object.sn">

		  		<template v-slot:prepend v-if="object.profileImage">
		  			<v-avatar size="48">
						<v-img :src="object.profileImage"></v-img>
		  			</v-avatar>
				</template> 
				<template v-slot:prepend v-else>
		  			<v-avatar color="secondary">
						<v-icon icon="mdi-account"></v-icon>
		  			</v-avatar>
				</template>
				<template v-slot:append>
					<v-btn class="mr-2"
				   		variant="outlined"
				   		color="secondary"
				   		size="small"
				   		rounded
				   		@click="$emit('removeUser', object)"
					>Remove</v-btn>
				</template>
			</v-card>          
		</v-col>
	  </v-row>  

</template>



<script>
  export default {
		props: ['objects', 'attribs', 'schema', 'allUsers' ],
		emits: [ 'addUsers', 'removeUser' ],
		data() {
		  return {
				filteredObjects: null,
				filterPattern: "",
				selectedUsers: [],
				availableUsers: null,
				addingUsers: false,
		  }
		},
		created() {
		  this.filteredObjects = this.objects;
		  this.availableUsers = this.allUsers.filter(obj => {
		  		const matches = this.objects.filter(match => { return (match._refResourceId == obj._id) });
		  		return (matches.length == 0)
			});
		},
		methods: {
		  filter() {
				this.filteredObjects = this.objects.filter(obj => JSON.stringify(obj).toLowerCase().includes(this.filterPattern.toLowerCase()));
		  },
		  addUsers() {
		  	this.addingUsers = false;
		  	const newUsers = this.allUsers.filter(obj => { return (this.selectedUsers.includes(obj.mail)) });
				this.$emit('addUsers', newUsers);
		  },
		  removeUser(user) {
		  	this.addingUsers = false;
		  	const newUsers = this.allUsers.filter(obj => { return (this.selectedUsers.includes(obj.mail)) });
				this.$emit('removeUser', user);
		  }
		}
  }
</script>



