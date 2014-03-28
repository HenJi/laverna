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

// require('CardTerminal');
// require('HidapiPlugupCard');
// require('Convert');

var HidapiPlugupCardTerminal = Class.extend(CardTerminal, {
	/** @lends HidapiPlugupCardTerminal.prototype */
	
	/**
	 *  @class In browser implementation of the {@link CardTerminal} interface using the generic HID plugin for Plug-up Dongle
	 *  @param {String} terminalName Name of the terminal
	 *  @constructs
	 *  @augments CardTerminal
	 */	
	initialize: function(name, options) {
		if (typeof name == "undefined") {
			name = "";
		}
		this.terminalName = name;
		this.options = options;
	},
	
	isCardPresent:function() {
		return true;
	},
	
	getCard:function() {
		var currentObject = this;
		if (typeof this.cardInstance == "undefined") {
			this.cardInstance = new HidapiPlugupCard(this);
		}
		return Q.fcall(function() {
			return currentObject.cardInstance;	
		});		
	},
		
	getTerminalName:function() {
		return this.terminalName;
	},

	getOptions:function() { 
		return this.options;
	},
	
	getName:function() {		
		if (this.terminalName.length == 0) {
			return "Default";
		}
		else {
			return this.terminalName;
		}
	}
			
});
