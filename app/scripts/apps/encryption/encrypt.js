/*global define*/
/*global sjcl*/
define([
    'underscore',
    'app',
    'marionette',
    'sjcl'
], function (_, App, Marionette) {
    'use strict';

    /**
     * This module provides encryption API
     */
    var Encryption = App.module('Encryption', {startWithParent: false}),
        executeAction, API;

    Encryption.on('start', function () {
        App.log('Encryption module has started');
    });

    Encryption.on('stop', function () {
        App.log('Encryption module has stopped');
        App.brand.close();
    });

    // Router
    Encryption.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'auth': 'showAuth',
            'dpauth': 'showDpAuth',
            'encrypt/all': 'showEncryptAll',
        }
    });

    // Start the application
    executeAction = function (action, args) {
        App.startSubApp('Encryption');
        action(args);
    };

    // Controller
    API = {
        showAuth: function () {
            require(['apps/encryption/auth/controller'], function (Controller) {
                executeAction(new Controller().showForm);
            });
        },

        showDpAuth: function() {
            require(['apps/encryption/dpauth/controller'], function (Controller) {
                executeAction(new Controller().showForm);
            });
        },

        showEncryptAll: function () {
            require(['apps/encryption/encrypt/controller'], function (Controller) {
                executeAction(new Controller().showEncrypt);
            });
        }
    };

    // API
    Encryption.API = {
        checkAuth: function (cb) {
            if (App.settings.encrypt === 1 && !App.settings.secureKey) {
                App.notesArg = null;
                App.navigate('/auth', true);
                cb(false);
            } else if (App.settings.encrypt === 2 && !App.settings.daplugKey) {
                App.navigate('/dpauth', true);
                cb(false)
            } else cb(true)
        },

        // Cache encryption key within application
        // -----------------------------------
        encryptKey: function (password, conf) {
            if (typeof conf === "undefined") {
                conf = App.settings.cryptoconf
            }
            if (conf.mode == 1) {
                var pwd = conf.pass,
                p = {};

                if (pwd.toString() === sjcl.hash.sha256.hash(password).toString()) {
                    p.iter = parseInt(conf.iter);
                    p.salt = conf.salt;

                    p = sjcl.misc.cachedPbkdf2(password, p);
                    password = p.key.slice(0, parseInt(conf.keysize)/32);

                    return password;
                } else return false
            } else return false
        },

        encrypt: function (content, conf, secureKey, cb) {
            if (typeof conf === "undefined") {
                conf = App.settings.cryptoconf
                secureKey = App.settings.secureKey
            }
            if (!content || content === '') {
                return content;
            }
            console.log("ENC_SRC: "+content)

            if (conf.mode === 1 && secureKey) {
                var p = {
                    iter : conf.iter,
                    ts   : parseInt(conf.tag),
                    ks   : parseInt(conf.keysize),
                    // Random initialization vector every time
                    iv   : sjcl.random.randomWords(4, 0)
                };

                content = sjcl.encrypt(secureKey.toString(), content, p);
            } else if (conf.mode == 2 && App.settings.daplugKey) {
                content = sjcl.encrypt(App.settings.daplugKey, content);
            }
            if (cb && conf.mode != 2) cb(content)
            console.log("ENC: "+content)
            return content;
        },

        decrypt: function (content, conf, secureKey, cb) {
            if (typeof conf === "undefined") {
                conf = App.settings.cryptoconf
                secureKey = App.settings.secureKey
            }
            console.log("DEC_SRC: "+content)

            if ( !content || content.length === 0) {
                return content;
            }

            if (conf.mode === 1 && secureKey) {
                try {
                    content = sjcl.decrypt(secureKey.toString(), content);
                    
                } catch(e) {
                    App.log('Can\'t decrypt ' + e);
                }
            } else if (conf.mode == 2 && App.settings.daplugKey) {
                try {
                    content = sjcl.decrypt(App.settings.daplugKey, content);
                } catch(e) {
                    App.log('Can\'t decrypt daplug ' + e);
                }
            }
            if (cb && conf.mode != 2) cb(content)
            console.log("DEC: "+content)
            return content;
        }
    };

    App.addInitializer(function () {
        new Encryption.Router({
            controller: API
        });
    });

    return Encryption;
});
