/*global define*/
define([
    'underscore',
    'jquery',
    'backbone',
    'marionette',
    'text!apps/encryption/auth/template.html'
], function ( _, $, Backbone, Marionette, Tmpl) {
    'use strict';

    var View = Marionette.ItemView.extend({
        template: _.template(Tmpl),

        events: {
            'submit .form-wrapper'  : 'login'
        },

        ui: {
            password : 'input[name=password]',
            wrap     : '.form-password'
        },

        initialize: function () {
            this.on('shown', function(){
                this.focusPassword()
                this.ui.password.change(this.removeRed)
            }, this);
            this.on('wrongpass', this.onWrongPass, this);
        },

        removeRed: function() {
            $(this).parent().removeClass("has-error");
        },

        onWrongPass: function() {
            this.ui.wrap.addClass("has-error");
        },

        focusPassword: function () {
            this.ui.password.focus();
        },

        login: function (e) {
            e.preventDefault();
            this.trigger('login', this.ui.password.val());
        },

        templateHelpers: function () {
            return {
                i18n: $.t
            };
        }
    });

    return View;
});
