/*global define*/
define([
    'underscore',
    'app',
    'marionette',
    'apps/encryption/dpauth/authView'
], function (_, App, Marionette, View) {
    'use strict';

    var Form = App.module('Encryption.Form');

    Form.Controller = Marionette.Controller.extend({

        initialize: function () {
            _.bindAll(this, 'showForm');
        },

        showForm: function () {
            var form = new View();
            App.brand.show(form);
            this.checkCard()
        },

        checkCard: function () {
            var ko = function(msg){
                return function(){
                    $(daplugAuthStatus).html(msg)
                }
            }
            var snOK = function(sn){
                if (sn == App.settings.cryptoconf.serial)
                    return DP.openCardSC(function(){
                        DP.encrypt(sn, function(k){
                            App.settings.daplugKey = k
                            App.navigateBack('/notes', true);
                        })
                    }, ko("Cannot communicate with dongle"))
                else return ko("Wrong dongle")()
            }
            var initOK = function(){return DP.getSerial(snOK, ko)}
            var scanOK = function(readers){
                if (readers.length == 0) {
                    ko("Please plug your dongle")()
                    setTimeout(function(){
                        DP.scan(scanOK, ko("Cannot communicate with plugin"))
                    }, 500);
                } else if (readers.length == 1)
                    return DP.initCard(readers[0], initOK, ko)
                else return ko("Too many dongles")()
            }
            DP.scan(scanOK, ko("Cannot communicate with plugin"))
        }

    });

    return Form.Controller;
});
