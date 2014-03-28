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

// require('ByteString');
// require('Card');

var ChromeapiPlugupCard = Class.extend(Card, {
	/** @lends ChromeapiPlugupCard.prototype */
	
	/**
	 *  @class In browser implementation of the {@link Card} interface using the Chrome API
	 *  @param {PPACardTerminal} terminal Terminal linked to this card
	 *  @constructs
	 *  @augments Card
	 */
	initialize:function(terminal, device) {		
		//console.log(device);
		this.device = new winusbDevice(device);
		this.terminal = terminal;
	},
	
	connect:function() {
		var currentObject = this;
		return this.device.open().then(function(result) {
			currentObject.connection = true;
			return currentObject;
		});
	},
	
	getTerminal : function() {
		return this.terminal;
	},
	
	getAtr : function() {
		return new ByteString("", HEX);
	},
	
	beginExclusive : function() {
	},
	
	endExclusive : function() {
	},
	
	openLogicalChannel: function(channel) {
		throw "Not supported";
	},
	
	exchange : function(apdu, returnLength) {
		var currentObject = this;
		if (!(apdu instanceof ByteString)) {
			throw "Invalid parameter";
		}
		if (!this.connection) {
			throw "Connection is not open";
		}
		//console.log("<= " + apdu.toString(HEX));
		return currentObject.device.send(apdu.toString(HEX)).then(
			function(result) {			
				return currentObject.device.recv(512);
			}
		)
		.then(function(result) {
			var resultBin = new ByteString(result.data, HEX);
			var response;
			if (resultBin.byteAt(0) != 0x61) {
				currentObject.SW1 = resultBin.byteAt(0);
				currentObject.SW2 = resultBin.byteAt(1);
				response = new ByteString("", HEX);
			}
			else {
				var size = resultBin.byteAt(1);
				response = resultBin.bytes(2, size);
				currentObject.SW1 = resultBin.byteAt(2 + size);
				currentObject.SW2 = resultBin.byteAt(2 + size + 1);
			}
			currentObject.SW = ((currentObject.SW1 << 8) + (currentObject.SW2));
			if (typeof currentObject.logger != "undefined") {
				currentObject.logger.log(currentObject.terminal.getName(), 0, apdu, response, currentObject.SW);
			}		
			//console.log("=> " + response.toString(HEX) + Convert.toHexShort(currentObject.SW));
			return response;
		});
	},

	reset:function(mode) {
	},	
	
	disconnect:function(mode) {
		var currentObject = this;		
		if (!this.connection) {
			return;
		}
		return this.device.close().then(function(result) {
			currentObject.connection = false;
		});
	},	
	
	getSW : function() {
		return this.SW;
	},
	
	getSW1 : function() {
		return this.SW1;
	},

	getSW2 : function() {
		return this.SW2;
	},
	
	setCommandDelay : function(delay) {
		// unsupported - use options
	},
	
	setReportDelay : function(delay) {
		// unsupported - use options
	},
	
	getCommandDelay : function() {
		// unsupported - use options
		return 0;
	},
	
	getReportDelay : function() {
		// unsupported - use options
		return 0;
	}
		
	
});
