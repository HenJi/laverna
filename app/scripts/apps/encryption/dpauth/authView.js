/*global define*/
define([
    'underscore',
    'jquery',
    'backbone',
    'marionette',
    'text!apps/encryption/dpauth/template.html'
], function ( _, $, Backbone, Marionette, Tmpl) {
    'use strict';

    var View = Marionette.ItemView.extend({
        template: _.template(Tmpl),

        ui: {
            status : '#daplugAuthStatus'
        },

        initialize: function () {
        },

        templateHelpers: function () {
            return {
                i18n: $.t
            };
        }
    });

    return View;
});
