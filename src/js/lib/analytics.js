/* jshint unused: false */
define([
    'jquery',
    'underscore',
    'backbone'
],
    function ($, _, Backbone) {
        'use strict';
        
        return {
            trackEvent: function (trackLabel, destinationUrl) {
                console.log("track event: " + trackLabel);
            },
            trackPageView: function (infoObj) {},
        };
    });
