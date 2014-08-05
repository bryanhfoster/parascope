var require = {
    paths: {
        "jquery": "../lib/jquery.min",
        "kendo": "../../kendo/js/kendo.mobile.min",
        "app": "../app",
        "esri": "http://js.arcgis.com/3.9/js/esri" ,
        "dojo": "http://js.arcgis.com/3.9/js/dojo/dojo" ,
        "dijit": "http://js.arcgis.com/3.9/js/dojo/dijit",
        "dojox": "http://js.arcgis.com/3.9/js/dojo/dojox",
        "bootstrap": "../lib/bootstrap.min",
        "amplify": "../lib/amplify",
        "pubnub": "../lib/pubnub-3.5.3.min",
        "signature": "../lib/signature_pad"
    },
    shim: {
        "app/parascope": ["jquery","amplify", "signature", "pubnub", "kendo", "bootstrap"],//this loads anything that we need for our app
        "kendo": ["jquery"],
        "bootstrap": ["jquery"],
        "amplify": ["jquery"]
    },
    waitSeconds: 30
};