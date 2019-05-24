// share.js
(function(exports) {

    exports.test = function() {
        return 'This is a function from shared module';
    };

    exports.name = 'hi';

}(typeof exports === 'undefined' ? this.share = {} : exports));
// "this" in the browser is window, so effectively, window.share