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

// require('HidapiPlugupCardTerminal');

var HidapiPlugupCardTerminalFactory = Class.extend(CardTerminalFactory, {
	/** @lends HidapiPlugupCardTerminalFactory.prototype */
	
	/**
	 *  @class Implementation of the {@link CardTerminalFactory} using the generic HID plugin for Plug-up Dongle
	 *  @constructs
	 *  @augments CardTerminalFactory
	 */				
	initialize: function() {
	},
	
	list: function() {
	    var plugin = document.getElementById("hidapiPlugin");
	    var result = plugin.hid_enumerate();
	    var paths = [];
	    for (var i=0; i<result.length; i++) {
			if ((result[i]["vendor_id"] == 0x2581) && (result[i]["product_id"] == 0x1807) && 
				((result[i]["interface_number"] == 1) || (result[i]["usage_page"] == 65440))) {
				paths.push(result[i]["path"])
				//break;
			}
		}
		return Q.fcall(function() {
			return paths;	
		});
		
	},

	waitInserted: function() {
		throw "Not implemented"
	},

	getCardTerminal: function(name, options) {
		return new HidapiPlugupCardTerminal(name, options);
	}
});
