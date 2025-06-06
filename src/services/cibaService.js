import { Config, UserManager, TokenManager, FRUser } from "@forgerock/javascript-sdk"
import FRconfig from "@/AICconfig.json";
import axios from 'axios'
import identityService from '@/services/identityService'


class cibaService {

	constructor() {
		Config.set(FRconfig);
	}

	arrayBufferToBase64(arrayBuffer) {
		const byteArray = new Uint8Array(arrayBuffer);
		let byteString = "";
		byteArray.forEach((byte) => {
		  byteString += String.fromCharCode(byte);
		});
		return btoa(byteString);
	}

	base64ToUint8Array(base64Contents) {
		base64Contents = base64Contents
		  .replace(/-/g, "+")
		  .replace(/_/g, "/")
		  .replace(/\s/g, "");
		const content = atob(base64Contents);
		return new Uint8Array(content.split("").map((c) => c.charCodeAt(0)));
	}

	stringToUint8Array(contents) {
		const encoded = btoa(unescape(encodeURIComponent(contents)));
		return this.base64ToUint8Array(encoded);
	}

	uint8ArrayToString(unsignedArray) {
		const base64string = btoa(String.fromCharCode(...unsignedArray));
		return base64string
		  .replace(/=/g, "")
		  .replace(/\+/g, "-")
		  .replace(/\//g, "_");
	}



	async startCIBA(payload, username) {
		const wellKnown = await identityService.getWellKnown();

		// Set headers for JWT
		var header = {
			typ: "JWT",
			alg: "RS256",
		};

		// Prepare timestamp in seconds
		var currentTimestamp = Math.floor(Date.now() / 1000);

		var payload = {
			iss: FRconfig.ciba_client_id,
			iat: currentTimestamp,
			exp: currentTimestamp + 300,
			jti: "jwt_nonce",
			login_hint: username,
			scope: "openid profile fr:idm:*",
			acr_values: FRconfig.ciba_acr,
			aud: wellKnown.issuer,
			binding_message: payload,
		};

		const stringifiedHeader = JSON.stringify(header);
		const stringifiedPayload = JSON.stringify(payload);

		const headerBase64 = this.uint8ArrayToString(this.stringToUint8Array(stringifiedHeader));
		const payloadBase64 = this.uint8ArrayToString(this.stringToUint8Array(stringifiedPayload));
		const headerAndPayload = `${headerBase64}.${payloadBase64}`;
		const messageAsUint8Array = this.stringToUint8Array(headerAndPayload);

		const privateKey = await window.crypto.subtle.importKey(
			"jwk",
			FRconfig.jwk,
			{
			  name: "RSASSA-PKCS1-v1_5",
			  hash: { name: "SHA-256" },
			}, 
			false, ["sign"]
		).catch(error => console.log(error));

		const signature = await	window.crypto.subtle.sign(
			{ name: "RSASSA-PKCS1-v1_5" },
			privateKey,
			messageAsUint8Array
		).catch(error => console.log(error));

		const base64Signature = this.uint8ArrayToString(new Uint8Array(signature));

		return `${headerAndPayload}.${base64Signature}`;
	}
  
  
  	async initCIBA(requestJWT) {
		  const wellKnown = await identityService.getWellKnown();
        try {
          const response = await axios.post(wellKnown.issuer + "/bc-authorize", 
          {
            request: requestJWT
          }, 
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(FRconfig.ciba_client_id + ":" + FRconfig.ciba_client_secret)}`
            }
          });
          return response.data;
        } catch(err) {
          return err;
        }
	}


  	async pollCIBA(auth_req_id) {
		const wellKnown = await identityService.getWellKnown();
		const response = await axios.post(wellKnown.token_endpoint, 
		{
			auth_req_id: auth_req_id,
			grant_type: "urn:openid:params:grant-type:ciba"
		}, 
		{
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${btoa(FRconfig.ciba_client_id + ":" + FRconfig.ciba_client_secret)}`
			}
		}).catch((error) => { console.log("RETURNING ERROR: " + JSON.stringify(error.response)); return error.response });

		return response.data;
	}
  
  
  
    	async introspect(token) {  
        const wellKnown = await identityService.getWellKnown();
        console.log(wellKnown);
		    const response = await axios.post(wellKnown.introspection_endpoint,
          {
            token: token
          }, 
          {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(FRconfig.ciba_client_id + ":" + FRconfig.ciba_client_secret)}`
          }
		    });
        
        return response.data;
	    } 
  
  
      	async revoke(token) {  
          const wellKnown = await identityService.getWellKnown();
          const response = await axios.post(wellKnown.revocation_endpoint,
            {
              token: token,
              client: FRconfig.ciba_client_id
            }, 
            {
              headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(FRconfig.ciba_client_id + ":" + FRconfig.ciba_client_secret)}`
            }
          });
        
        return response.data;
	    } 
  
  
		
}

export default new cibaService();
