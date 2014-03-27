/*global define*/
define([
    'underscore',
    'marionette',
    'app'
], function (_, Marionette, App) {
    'use strict';

    var ModelEncrypt = function () {
        // Old configs from Application cache
        this.oldConfigs = App.settings;
    };

    _.extend(ModelEncrypt.prototype, {

        initialize: function (args) {
            this.oldConf = App.settings.cryptoconf
            this.oldSecureKey = App.settings.secureKey

            this.newConf = App.settings.newCryptoconf
            this.newSecureKey = App.settings.newSecureKey
            // console.log("OLD conf: "+this.oldConf+" "+this.oldSecureKey)
            // console.log("NEW conf: "+this.newConf+" "+this.newSecureKey)

            this.notes = args.notes;
            this.notebooks = args.notebooks;

            this.encryptNotes();
            this.encryptNotebooks();
        },

        encryptNotes: function () {
            var self = this,
                data;

            this.notes.each(function (note) {
                data = {};

                // console.log("Encrypt note")
                // console.log("SRC: "+note.get('title'))
                // Try to decrypt data
                data.title = App.Encryption.API.decrypt(note.get('title'), self.oldConf, self.oldSecureKey);
                data.content = App.Encryption.API.decrypt(note.get('content'), self.oldConf, self.oldSecureKey);
                // console.log("DECR: "+data.title)
                // Encrypt
                data.title = App.Encryption.API.encrypt(data.title, self.newConf, self.newSecureKey);
                data.content = App.Encryption.API.encrypt(data.content, self.newConf, self.newSecureKey);
                // console.log("OUT: "+data.title)

                // Save
                note.trigger('update:any');
                note.save(data, {
                    success: function () {
                        self.notes.trigger('progressEncryption');
                    }
                });
            });
        },

        encryptNotebooks: function () {
            var self = this,
                data;

            this.notebooks.each(function (note) {
                data = {};

                // Try to decrypt data
                App.settings = self.oldConfigs;
                data.name = App.Encryption.API.decrypt(note.get('name'), self.oldConf, self.oldSecureKey);

                // Encrypt
                App.settings = self.configs;
                data.name = App.Encryption.API.encrypt(data.name, self.newConf, self.newSecureKey);

                // Save
                note.save(data, {
                    success: function () {
                        self.notebooks.trigger('progressEncryption');
                    }
                });
            });
        }

    });

    return ModelEncrypt;
});
