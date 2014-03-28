/*
************************************************************************
Copyright (c) 2013 UBINITY SAS

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*************************************************************************
*/

var SecureChannelCard = Class.extend(Card, {
	/** @lends SecureChannelCard.prototype */
	
	/**
	 *  @class Card interface offered by a Secure Channel
	 *  @param {Card} card card associated to this Secure Channel
	 *  @param {SecureChannel} secureChannel Secure Channel
	 *  @constructs
	 *  @augments Card
	 */	
	initialize: function(card, secureChannel) {
		if (!(card instanceof Card)) {
			throw "Invalid card";
		}
		/*
		if (!(secureChannel instanceof SecureChannel)) {
			throw "Invalid Secure Channel";
		}
		*/
		this.card = card;
		this.secureChannel = secureChannel;
	},
	
	/**
	 * Set the keyset keys values associated to this Secure Channel
	 * @param {Array|ByteString} keys array of ByteString keys values for ENC/MAC/DEK keys or unique ByteString for a shared base key 
	 */
	setKeyset : function(keys) {
		this.keys = keys;
	},
	
	/**
	 * Set the diversification algorithm to use. RFU.
	 * @param {String} diversificationAlgorithm diversification algorithm
	 */
	setDiversificationAlgorithm : function(diversificationAlgorithm) {
		this.diversificationAlgorithm = diversificationAlgorithm;
	},
	
	/**
	 * Open the Secure Channel session 
	 * @param {Number} Security Level of the Secure Channel. Bitmask of SecureChannel.SCP_SECURITY_LEVEL_ options
	 * @param {Number} keyVersion version of the target keyset to use 
	 */
	openSession: function(securityLevel, keyVersion) {
		var result;
		this.close();
		var initializeUpdateResponse;
		var externalAuthenticateAPDU;
		try {
			result = this.secureChannel.openSession(0x15, securityLevel, keyVersion);
		}
		catch(e) {			
			throw "Failed to generate INITIALIZE UPDATE " + e;
		}
		this.sessionId = result['sessionID'];
		var currentObject = this;
		return this.card.exchange(result['data'], [0x9000])
		.then(function(initializeUpdateResponse) {
			return currentObject.secureChannel.getExternalAuthenticateAPDU(currentObject.sessionId, currentObject.keys, initializeUpdateResponse, currentObject.diversificationAlgorithm);
		}, function(e) {
			throw "Failed to process INITIALIZE UPDATE " + e;
		})
		.then(function(externalAuthenticateAPDU) {
			return currentObject.card.exchange(externalAuthenticateAPDU, [0x9000]);			
		}, function(e) {
			throw "Failed to generate EXTERNAL AUTHENTICATE " + e;
		})
		.then(function(result) {
			currentObject.opened = true;			
		}, function(e) {
			throw "Failed to exchange EXTERNAL AUTHENTICATE " + e;
		});
	},
	
	sendApdu : function(cla, ins, p1, p2, opt1, opt2, opt3) {
		return this.card.sendApdu(cla, ins, p1, p2, opt1, opt2, opt3, this);
	},	
		
	exchangeWrapped : function(apdu, returnLength) {
		if (!(apdu instanceof ByteString)) {
			throw "Invalid APDU";
		}
		if (!this.opened) {
			throw "Invalid state";
		}
		// Normalize the APDU length before wrapping it if dealing with a Case 2
		if ((apdu.byteAt(4) != 0x00) && (apdu.length == 5)) {
			apdu = apdu.bytes(0, 4);
			apdu = apdu.concat(new ByteString("00", HEX));					
		}
		var currentObject = this;
		return this.secureChannel.wrapAPDU(this.sessionId, apdu)
		.then(function(wrapped) {
			return currentObject.card.exchange(wrapped, returnLength);
		})
		.then(function(response) {
			currentObject.SW = currentObject.card.SW;
			currentObject.SW1 = currentObject.card.SW1;
			currentObject.SW2 = currentObject.card.SW2;
			// append SW to data
			var swString = Convert.toHexByte(currentObject.card.getSW1()) + Convert.toHexByte(currentObject.card.getSW2());
			response = response.concat(new ByteString(swString, HEX));
			return currentObject.secureChannel.unwrapAPDU(currentObject.sessionId, response);	
		});				
	},

	/**
	 * Close this Secure Channel
	 */
	close : function() {
		this.opened = false;
		if (typeof this.sessionId != "undefined") {
			this.secureChannel.closeSession(this.sessionId);
			this.sessionId = undefined;
		}
	}
	
	
});
