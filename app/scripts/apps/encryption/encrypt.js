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

        showEncryptAll: function () {
            require(['apps/encryption/encrypt/controller'], function (Controller) {
                executeAction(new Controller().showEncrypt);
            });
        }
    };

    // API
    Encryption.API = {
        checkAuth: function () {
            if (App.settings.encrypt === 1 && !App.settings.secureKey) {
                App.notesArg = null;
                App.navigate('/auth', true);
                return false;
            } else if (App.settings.encrypt === 2 && typeof currentSC === "undefined") {
                var ko = function(){ return false }
                var scOK = function(){ return true }
                var snOK = function(sn){
                    if (sn == App.settings.cryptoconf.serial)
                        return DP.openCardSC(scOK, ko)
                    else return ko()
                }
                var initOK = function(){return DP.getSerial(snOK, ko)}
                var scanOK = function(readers){
                    if (readers.length == 0) return ko()
                    else if (readers.length == 1)
                        return DP.initCard(readers[0], initOK, ko)
                    else return ko()
                }
                return DP.scan(scanOK, ko)
            } else return true;
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

            if (conf.mode === 1 && secureKey) {
                var p = {
                    iter : conf.iter,
                    ts   : parseInt(conf.tag),
                    ks   : parseInt(conf.keysize),
                    // Random initialization vector every time
                    iv   : sjcl.random.randomWords(4, 0)
                };

                content = sjcl.encrypt(secureKey.toString(), content, p);
            } else if (conf.mode == 2 && typeof currentSC !== "undefined") {
                DP.encrypt(
                    content,
                    function(res){
                        console.log("ENC2: "+res)
                        if (cb) cb(res)
                    },
                    function(e){"ERR: "+e}
                )
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
            console.log(conf)

            if ( !content || content.length === 0) {
                return content;
            }

            if (conf.mode === 1 && secureKey) {
                try {
                    content = sjcl.decrypt(secureKey.toString(), content);
                    
                } catch(e) {
                    App.log('Can\'t decrypt ' + e);
                }
            } else if (conf.mode == 2 && typeof currentSC !== "undefined") {
                DP.decrypt(
                    content,
                    function(res){
                        console.log("DEC2: "+res)
                        if (cb) cb(res)
                    },
                    function(e){"ERR: "+e}
                )
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
