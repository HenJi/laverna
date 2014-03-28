/*
************************************************************************
Copyright (c) 2012 UBINITY SAS

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

var HidapiPlugupCard = Class.extend(Card, {
	/** @lends HidapiPlugupCard.prototype */
	
	/**
	 *  @class In browser implementation of the {@link Card} interface using the generic HID plugin for Plug-up Dongle 
	 *  @param {HidapiPlugupCardTerminal} terminal Terminal linked to this card
	 *  @constructs
	 *  @augments Card
	 */
	initialize:function(terminal) {
		this.terminal = terminal;
		this.plugin = document.getElementById("hidapiPlugin");
		this.connection = undefined;
		this.padding = new ByteString("00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", HEX);
		this.timeout = 5000;
		this.connect();

	},
	
	connect:function() {
		var name = this.terminal.getTerminalName();
		if ((typeof name == "undefined") || (name.length == 0)) {

			// If no terminal name was defined, pick a default one
			var paths = new HidapiPlugupCardTerminalFactory().list();
			if (paths.length == 0) {
				throw "No reader available";
			}
			name = paths[0];
		}
		this.connection = this.plugin.hid_open_path(name);
		if (this.connection == null) {
			this.connection = undefined;
			throw "Failed to connect";
		}
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
		if (!(apdu instanceof ByteString)) {
			throw "Invalid parameter";
		}
		if (typeof this.connection == "undefined") {
			throw "Connection is not open";
		}
		var remaining = apdu.length; 
		var offset = 0;
		while (remaining > 0) {
			var blockLength = (remaining > 64 ? 64 : remaining);
			var dataBlock = apdu.bytes(offset, blockLength);
			if (dataBlock.length != 64) {
				dataBlock = dataBlock.concat(this.padding.bytes(0, 64 - dataBlock.length));
			}
			this.connection.hid_write("00" + dataBlock.toString(HEX));
			remaining -= blockLength;
			offset += blockLength;
		}
		var result = new ByteString(this.connection.hid_read(65, this.timeout), HEX);
		var dataLength = 0;
		if (result.byteAt(0) == 0x61) {
			dataLength = result.byteAt(1);
			if (dataLength > 62) {
				remaining = dataLength - 62;
				while(remaining != 0) {
					var blockLength = (remaining > 64 ? 64 : remaining);
					result = result.concat(new ByteString(this.connection.hid_read(65, this.timeout), HEX));
					remaining = remaining - blockLength;
				}
			}
			this.SW1 = result.byteAt(dataLength + 2);
			this.SW2 = result.byteAt(dataLength + 3);
		}
		else {
			this.SW1 = result.byteAt(0);
			this.SW2 = result.byteAt(1);
		}
		if (dataLength != 0) {
			result = result.bytes(2, dataLength);
		}
		else {
			result = new ByteString("", HEX);
		}
		this.SW = ((this.SW1 << 8) + (this.SW2));
		if (typeof this.logger != "undefined") {
			this.logger.log(this.terminal.getName(), 0, apdu, result, this.SW);
		}		
		return Q.fcall(function() {
			return result;
		});
	},
	
	reset:function(mode) {
	},	
	
	disconnect:function(mode) {
		if (typeof this.connection == "undefined") {
			return;
		}
		this.connection.close();
		this.connection = undefined;	
		return Q.fcall(function() {
			return;
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
