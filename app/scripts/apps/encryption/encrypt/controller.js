/*global define*/
define([
    'underscore',
    'marionette',
    'app',
    'collections/configs',
    'collections/notes',
    'collections/notebooks',
    'apps/encryption/encrypt/modelEncrypt',
    'apps/encryption/encrypt/encryptView'
], function (_, Marionette, App, Configs, Notes, Notebooks, ModelEncrypt, EncryptView) {
    'use strict';

    /**
     * After every change of encryption settings this module will encrypt
     * all notes and notebooks
     */
    var EncryptAll = App.module('Encryption.EncryptAll');

    EncryptAll.Controller = Marionette.Controller.extend({

        initialize: function () {
            _.bindAll(this, 'showEncrypt', 'showProgress');

            this.configs = new Configs();
            this.configs.fetch();
            this.configs = this.configs.getConfigs();

            this.notes = new Notes();
            this.notebooks = new Notebooks();
        },

        showEncrypt: function () {
            $.when(this.notes.fetch(), this.notebooks.fetch()).done(this.showProgress);
        },

        showProgress: function () {
            // console.log(App.settings.cryptoconf)
            // console.log(App.settings.newCryptoconf)
            if (App.settings.cryptoconf === App.settings.newCryptoconf
                && App.settings.newSecureKey === false) {
                // No change in encryption settings
                App.navigate('/notes', false);
            } else {

                // View which shows progress of encryption
                var view = new EncryptView({
                    notes     : this.notes,
                    notebooks : this.notebooks
                });

                view.on('redirect', this.redirect, this);

                // Show progress
                App.brand.show(view);
                this.runMigration()
            }
        },

        redirect: function () {
            App.navigate('/notes', false);
            window.location.reload();
        },

        runMigration: function () {
            new ModelEncrypt().initialize({
                notes     : this.notes,
                notebooks : this.notebooks
            })
        }

    });

    return EncryptAll.Controller;

});
