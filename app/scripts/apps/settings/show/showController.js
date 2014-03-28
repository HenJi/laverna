/*global define*/
define([
    'underscore',
    'app',
    'marionette',
    'collections/configs',
    'models/config',
    'apps/settings/show/showView'
], function (_, App, Marionette, Configs, Config, View) {
    'use strict';

    var Show = App.module('AppSettings.Show');

    /**
     * Settings controller
     */
    Show.Controller = Marionette.Controller.extend({
        initialize: function () {
            _.bindAll(this, 'show');

            this.configs = new Configs();
            this.configs.fetch();

            // Events
            this.configs.on('changeSetting', this.save, this);
        },

        // Show settings form in modal window
        // ---------------------------------
        show : function () {
            var view = new View({ collection : this.configs });
            App.modal.show(view);
            view.on('redirect', this.redirect, this);
        },

        // Save new settings
        // ----------------------
        save: function (setting) {
            var model = this.configs.get(setting.name);
            if (typeof model === "undefined")
                this.configs.createOne(setting.name, setting.value)
            else model.save({ value : setting.value });
        },

        // Navivate back and reload the page
        // ---------------------------------
        redirect: function (changedSettings) {
            if ( this.isEncryptionChanged(changedSettings) === false) {
                App.navigateBack('/notes');

                if (changedSettings && changedSettings.length !== 0) {
                    window.location.reload();
                }
            } else {
                App.log('At least one encryption setting has changed');
                App.navigate('/encrypt/all', true);
            }
        },

        // Check is any of encryption settings is changed
        // -------------------------------
        isEncryptionChanged: function (changedSettings) {
            var encrSet = ['encrypt', 'encryptPass', 'encryptSalt', 'encryptIter', 'encryptTag', 'encryptKeySize'],
                changed = false;

            _.each(encrSet, function (set) {
                if (_.contains(changedSettings, set) === true) {
                    changed = true;
                }
            });

            return changed;
        }

    });

    return Show.Controller;
});
