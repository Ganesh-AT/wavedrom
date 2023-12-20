'use strict';

const charWidth = require('./char-width.json');

/**
    Calculates text string width in pixels.

    @param {String} str text string to be measured
    @param {Number} size font size used
    @return {Number} text string width
*/

module.exports = function (str, size = 11) {

    let c, w, tag_end_idx;
    let sub_or_sup_tspan = false ;
    // size = size || 11; // default size 11pt
    let len = str.length;
    let width = 0;
    let i = 0;

    const token = /<o>|<ins>|<s>|<sub>|<sup>|<b>|<i>|<tt>|<\/o>|<\/ins>|<\/s>|<\/sub>|<\/sup>|<\/b>|<\/i>|<\/tt>/;
    const start_stoken = /<sub>|<sup>/;
    const stop_stoken = /<\/sub>|<\/sup>/;

    while (i < len) {
        let chk_for_tag = false ;
        chk_for_tag = (str[i] === '<') ;   
        while (chk_for_tag) {
            tag_end_idx = str.substring(i).indexOf('>');
            if (tag_end_idx !== -1) { tag_end_idx += i ; }
            let eftag = (tag_end_idx != -1) ? str.substring(i, tag_end_idx + 1) : undefined ;
            let tmatch = eftag.match(token);
            let ttest = false ;
            if (tmatch != null) { ttest = (tmatch[0] == eftag) ; }
            let start_smatch = eftag.match(start_stoken) ;
            let start_stest = false ;
            if (start_smatch != null) { start_stest = (start_smatch[0] == eftag); }
            let stop_smatch = eftag.match(stop_stoken) ;
            let stop_stest = false ;
            if (stop_smatch != null) { stop_stest = (stop_smatch[0] == eftag); }
            
            if (start_stest) { sub_or_sup_tspan = true ; }
            if (stop_stest)  { sub_or_sup_tspan = false ; }

            chk_for_tag = false ;
            if (ttest) {
                i = tag_end_idx + 1;
                chk_for_tag = (str[i] === '<') ;   
            }
        }
        c = (i < len) ? str.charCodeAt(i) : undefined ;
        if (c !== undefined) {
            w = charWidth.chars[c];
            if (w === undefined) {
                w = charWidth.other;
            }
            width += (w * (sub_or_sup_tspan ? 0.6 : 1));
            i ++ ;
        }
    }
    return (width * size) / 100; // normalize

};
