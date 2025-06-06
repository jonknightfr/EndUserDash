import { Config, UserManager, TokenManager, FRUser } from "@forgerock/javascript-sdk"
import FRconfig from "@/AICconfig.json";
import axios from 'axios'


class IdentityService {

	constructor() {
		Config.set(FRconfig);
	}

	async init() {
		try {
			const user = await UserManager.getCurrentUser();
			const tokens = await TokenManager.getTokens();
			const userObject = await this.getUser(tokens.accessToken, user.sub);
			return [ userObject, tokens ];
		} catch(error) {
			const url = new URL(document.location);
			const params = url.searchParams;
			const authCode = params.get('code');
			const state = params.get('state');
			if (state && authCode) {
				return this.authorize(authCode, state);
			} else return [ null, null ];
		} 
	}

	async login() {
		try {
			await TokenManager.getTokens({ login: 'redirect' });
		} catch(error) {
			console.log("LOGIN ERROR: " + error);
		}
	}

	async logout() {
		try {
			await FRUser.logout();
		} catch (error) {
			console.error(error);
		}
	}

	async authorize(code, state) {
		const tokens = await TokenManager.getTokens({ query: { code, state } });
		const user = await UserManager.getCurrentUser();
		const userObject = await this.getUser(tokens.accessToken, user.sub);
		return [ userObject, tokens ];
	}

	async getUser() {
		try {
			const user = await UserManager.getCurrentUser();
			const tokens = await TokenManager.getTokens();
			axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
			const response = await axios.get(`${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}`);
			return response.data;
		} catch (error) { return null }
	} 
  
  
  	async getUsers() {
		try {
			const user = await UserManager.getCurrentUser();
			const tokens = await TokenManager.getTokens();
			axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
			const response = await axios.get(`${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user?_queryFilter=true&_fields=*`);
			return response.data;
		} catch (error) { return null }
	} 
  

	async putUser(userObject) {
		const ATTRIBS = [ 'givenName', 'sn', 'mail', 'telephoneNumber', 'postalAddress', 'city', 'postalCode', 'country' ];
		var op = [];
		ATTRIBS.forEach(attr => op.push({ "operation": "replace", "field": "/"+attr, "value": userObject[attr]}));
		const user = await UserManager.getCurrentUser();
		const tokens = await TokenManager.getTokens();
		var config = { headers: { "content-type": "application/json;charset=UTF-8" } };
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.patch(`${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}`, op, config);
		return response.data;
	} 


	async patchUser(patches) {
		const user = await UserManager.getCurrentUser();
		const tokens = await TokenManager.getTokens();
		var config = { headers: { "content-type": "application/json;charset=UTF-8" } };
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.patch(`${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}`, patches, config);
		return response.data;
	} 


	async patchObject(obj, patches) {
		const tokens = await TokenManager.getTokens();
		var config = { headers: { "content-type": "application/json;charset=UTF-8" } };
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.patch(`${FRconfig.serverConfig.baseUrl}../openidm/${obj}`, patches, config);
		return response.data;
	} 

	async createOrg(newOrgObject) {
		const tokens = await TokenManager.getTokens();
		var config = { headers: { "content-type": "application/json;charset=UTF-8" } };
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.post(`${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_organization?_action=create`, newOrgObject, config);
		return response.data;
	} 

	async deleteObject(obj) {
		const tokens = await TokenManager.getTokens();
		var config = { headers: { "content-type": "application/json;charset=UTF-8" } };
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.delete(`${FRconfig.serverConfig.baseUrl}../openidm/${obj}`, config);
		return response.data;
	} 

	async callREST(endpoint, accessToken=null) {
		if (!accessToken) {
			const tokens = await TokenManager.getTokens();
			accessToken = tokens.accessToken;
		}
		try {
			axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
			const response = await axios.get(`${FRconfig.serverConfig.baseUrl}..${endpoint}`);
			return response.data;
		} catch (error) { return null }
	} 


	async getWellKnown(endpoint) {
		const response = await axios.get(`${FRconfig.serverConfig.baseUrl}oauth2/alpha/.well-known/openid-configuration`);
		return response.data;
	}

	async getSchema(object = "managed/alpha_user") {
		const user = await UserManager.getCurrentUser();
		const tokens = await TokenManager.getTokens();
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.get(`${FRconfig.serverConfig.baseUrl}../openidm/schema/${object}`);
		return response.data;
	} 

	async getTokens(options) {
		const tokens = await TokenManager.getTokens(options);
		return tokens;
	}

	async validateTokens(options) {
		try {
			const user = await UserManager.getCurrentUser();
			return user;
		} catch(err) { 
			console.log(err);	
			return null;
		}
	}   

	async getApplications() {
		const user = await UserManager.getCurrentUser();
		const tokens = await TokenManager.getTokens();
		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
		const response = await axios.get(`${FRconfig.serverConfig.baseUrl}../openidm/profile/managed/alpha_user/${user.sub}/applications?_fields=*&_queryFilter=true`);
		return response.data;
	} 

	async getRelationships() {
		
		var elements = {
			nodes: [],
			edges: []
		};

		const user = await UserManager.getCurrentUser();
		const tokens = await TokenManager.getTokens();

		elements.nodes.push({ data: { id: user.sub, label: user.name, size: 60, color: ' #99e6e6', align: 'center', type: 'default', ref: 'managed/alpha_user' }});

		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

		function fetchData(item) {
			return axios
			.get(item.endpoint)
			.then(function(response){
				return {
					success: true,
					item: item,
					data: response.data
				};
			})
			.catch(function(error) {
				return { success: false };
			});
		}

		function prune(str) {
			if (str.length < 14) return str;
			else if (str.indexOf(' ') > 0) return str;
			else return str.slice(0,14) + '...';	
		}

		// Delegated Administration
		var response = await axios.post(`${FRconfig.serverConfig.baseUrl}../openidm/privilege?_action=listPrivileges`);
		
		var schemas = response.data.map(item => {
			item['endpoint'] = `${FRconfig.serverConfig.baseUrl}../openidm/schema/${item.privilegePath}`;
			return item;
		});
		
		var schemaResults = await Promise.all(schemas.map(fetchData));

		schemaResults.forEach(item => {
			item.item['key'] = item.data.order.find(key => { return item.data.properties[key].viewable });
			item.item['endpoint'] = `${FRconfig.serverConfig.baseUrl}../openidm/${item.item.privilegePath}?_queryFilter=true`;
		});

		// Effective Apps, Roles, etc
		
		const interesting = [
			{
				"title": "My Applications",
				"endpoint": `${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}?_fields=effectiveApplications`,
				"objType": "effectiveApplications",
				"nameField": "name",
				"color": ' #faedcb'
			},
			{
				"title": "My Roles",
				"endpoint": `${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}?_fields=effectiveRoles`,
				"objType": "effectiveRoles",
				"nameField": "_refResourceId",
				"color": '#f2c6de'
			},
			{
				"title": "My Groups",
				"endpoint": `${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}?_fields=effectiveGroups`,
				"objType": "effectiveGroups",
				"nameField": "_refResourceId",
				"color": '#f7d9c4'
			},
			{
				"title": "My Organizations",
				"endpoint": `${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user/${user.sub}?_fields=memberOfOrgIDs`,
				"objType": "memberOfOrgIDs",
				"nameField": "org",
				"color": '#dbcdf0'
			}							
		];

		return Promise.all(response.data.map(fetchData))		
		.then((resp) => {
			resp
			.filter((privilege) => privilege.success)
			.forEach((priv) => {
				elements.nodes.push({ data: { id: priv.item.title, label: prune(priv.item.title), size: 50, color: ' #2eb8b8', align: 'center', type: 'Delegated Admin' }});
				elements.edges.push({ data: { id: user.sub+'_'+priv.item.title, source: user.sub, target: priv.item.title, type: 'Delegated Admin' }});
				priv.data.result.forEach((obj) => {
					var id = obj[priv.item.key];
					elements.nodes.push({ data: { id: obj._id, label: prune(id), size: 20, color: '#248f8f', align: 'bottom', type: 'Delegated Admin', ref: priv.item.privilegePath }});
					elements.edges.push({ data: { id: priv.item.title+'_'+obj._id, source: priv.item.title, target: obj._id, type: 'Delegated Admin' }})
				});
			})


			return Promise.all(interesting.map(fetchData))
			.then((resp) => {
				resp
				.filter((objectType) => objectType.success)
				.forEach((itemType) => {
					elements.nodes.push({ data: { id: itemType.item.objType, label: itemType.item.title, size: 50, color: itemType.item.color, align: 'center', type: itemType.item.title }});
					elements.edges.push({ data: { id: user.sub+'_'+itemType.item.objType, source: user.sub, target: itemType.item.objType, type: itemType.item.title }});
					itemType.data[itemType.item.objType].forEach((obj) => {
										// Array of relationships
						if (obj._ref) {
							elements.nodes.push({ data: { id: obj._ref, label: prune(obj[itemType.item.nameField]), size: 20, color: itemType.item.color, align: 'bottom', type: itemType.item.title }});
							elements.edges.push({ data: { id: itemType.item.objType+'_'+obj._ref, source: itemType.item.objType, target: obj._ref, type: itemType.item.title }})
										} else {	// Array of IDs
											elements.nodes.push({ data: { id: obj, label: prune(obj), size: 20, color: itemType.item.color, align: 'bottom', type: itemType.item.title }});
											elements.edges.push({ data: { id: itemType.item.objType+'_'+obj, source: itemType.item.objType, target: obj, type: itemType.item.title }})											
										}
									});

				})
				return elements;
			})
			.catch(e => console.log(e));

		})
		.catch(e => console.log(e));
	}


	async getOrgModel() {
		
		var elements = {
			nodes: [],
			edges: []
		};

		const user = await UserManager.getCurrentUser();
		const tokens = await TokenManager.getTokens();

		axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

		function fetchData(item) {
			return axios
			.get(item.endpoint)
			.then(function(response){
				return {
					success: true,
					item: item,
					data: response.data
				};
			})
			.catch(function(error) {
				return { success: false };
			});
		}

		function prune(str) {
			if (str.length < 14) return str;
			else if (str.indexOf(' ') > 0) return str;
			else return str.slice(0,14) + '...';	
		}

		const interesting = [
			{
				"title": "Organizations",
				"endpoint": `${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_organization?_queryFilter=true`,
				"objType": "organizations",
				"nameField": "name",
				"color": 'red'
			},
			//{
			//	"title": "Users",
			//	"endpoint" : `${FRconfig.serverConfig.baseUrl}../openidm/managed/alpha_user?_queryFilter=true`,
			//	"objType": "effectiveRoles",
			//	"nameField": "_refResourceId",
			//	"color": 'orange'
			//}							
		];

		// Get orgs and users
		
		return Promise.all(interesting.map(fetchData))
		.then((resp) => {
			resp
			.filter((privilege) => privilege.success)
			.forEach((priv) => {
				elements.nodes.push({ data: { id: priv.item.title, label: prune(priv.item.title), color: '#48a9a6', align: 'center', type: 'top' }});

        		// Resolve all nodes first
				priv.data.result.forEach((obj) => {
          			var id = obj._id;
          			var color = '#48a9a6';
          			if (obj.hasOwnProperty("name")) id = obj.name;
          			if (obj.hasOwnProperty("userName")) { id = obj.userName; color = '#48a9a6'; }
					elements.nodes.push({ data: { id: obj._id, label: prune(id), color: color, align: 'bottom', type: 'delegation' }});
        		});
        
        		// Resolve edges
		        priv.data.result.forEach((obj) => {
        			if ((obj.hasOwnProperty("parentIDs")) && (obj.parentIDs.length > 0)) {
        				// Potentially delegated admin means this user has access to an org but not it's parent. In this case we need dotted line to top-level.
        				if ((elements.nodes.filter(entry => entry.data.id == obj.parentIDs[0])).length > 0) {
	            			elements.edges.push({ data: { id: priv.item.title+'_'+obj._id, source: obj.parentIDs[0], target: obj._id, type: 'delegation', style: 'solid' }})
	            		} else {
	            			elements.edges.push({ data: { id: priv.item.title+'_'+obj._id, source: priv.item.title, target: obj._id, type: 'delegation', style: 'dotted' }})
	            		}
          			} else {
            			elements.edges.push({ data: { id: priv.item.title+'_'+obj._id, source: priv.item.title, target: obj._id, type: 'delegation', style: 'solid' }})
          			}	

          			if (obj.hasOwnProperty("memberOfOrgIDs")) {
          				obj.memberOfOrgIDs.forEach((orgMember) => {
          					if ((elements.nodes.filter(entry => entry.data.id == orgMember)).length > 0) {
          						elements.edges.push({ data: { id: orgMember+'_'+obj._id, source: orgMember, target: obj._id, type: 'delegation', style: 'solid' }})
          					}
          				})
          			}
				});
			})
			return elements;
		})
		.catch(e => console.log(e));
	}


}
export default new IdentityService();
