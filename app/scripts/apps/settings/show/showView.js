/*global define*/
/*global sjcl*/
define([
    'underscore',
    'app',
    'jquery',
    'backbone',
    'marionette',
    'text!apps/settings/show/showTemplate.html',
    'sjcl'
], function (_, App, $, Backbone, Marionette, Tmpl) {
    'use strict';

    var View = Marionette.ItemView.extend({
        template: _.template(Tmpl),

        className: 'modal fade',

        events: {
            'submit .form-horizontal' : 'save',
            'click .ok'               : 'save',
            'click .close'            : 'close',
            'click .showField'        : 'changeEnc',
            'click #randomize'        : 'randomize',
            'change input, select, textarea' : 'triggerChange'
        },

        ui: {
            saltInput     : 'input[name=encryptSalt]',
            cryptOpts     : '.cryptOpt'
        },

        initialize: function () {
            this.on('hidden.modal', this.redirect);
            this.changedSettings = [];
        },

        triggerChange: function (e) {
            var el = $(e.target);
            this.changedSettings.push(el.attr('name'));
        },

        serializeData: function () {
            return {
                models: this.collection.getConfigs()
            };
        },

        randomize: function () {
            var random = sjcl.random.randomWords(2, 0);
            this.ui.saltInput.val(random);
            this.changedSettings.push(this.ui.saltInput.attr('name'));
            return false;
        },

        /**
         * Shows fieldsets with aditional parameters
         */
        changeEnc: function ( e ) {
            var input = $(e.currentTarget),
                field = $(input.attr('data-field'));

            this.ui.cryptOpts.hide()
            field.show();
        },

        /**
         * Save the configs changes
         */
        save: function () {
            var value, el, newPass;
            var newCryptoconf = App.settings.newCryptoconf
            _.each(this.changedSettings, function (settingName) {
                this.$('[name=' + settingName + ']').each(
                    function(i, e){
                        var el = $(e)
                        if (el.attr('type') === 'checkbox') {
                            value = (el.is(':checked')) ? 1 : 0;
                        } else if (el.attr('type') === 'radio') {
                            if (el.is(':checked')) {
                                value = parseInt(el.val())
                            }
                        } else {
                            value = el.val();
                        }
                    })
                // console.log("Changed parameters:")
                if (typeof value !== "undefined") {
                    this.collection.trigger('changeSetting', {
                        name : settingName,
                        value: value
                    });
                    if (settingName.substring(0,7) == "encrypt") {
                        if (settingName == "encrypt") newCryptoconf.mode = value
                        else {
                            var key = settingName.substring(7).toLowerCase()
                            if (key != "pass") newCryptoconf[key] = value
                            else newCryptoconf[key] = sjcl.hash.sha256.hash(value)
                        }
                    }
                    if (settingName == "encryptPass") newPass = value
                }
            }, this);
            App.settings.newCryptoconf = newCryptoconf
            if (typeof newPass !== "undefined") {
                var newKey = App.Encryption.API.encryptKey(newPass, newCryptoconf);
                // App.log("New secure key is : "+newKey)
                App.settings.newSecureKey = newKey
            }

            this.somethingChanged = this.changedSettings.length > 0;
            this.close();
            return false;
        },

        redirect: function () {
            var args = [];
            if (this.somethingChanged === true) {
                args = this.changedSettings;
            }
            this.trigger('redirect', args);
        },

        close: function (e) {
            if (e !== undefined) {
                e.preventDefault();
            }
            this.trigger('close');
        },

        templateHelpers: function () {
            return {
                i18n: $.t
            };
        }
    });

    return View;
});
