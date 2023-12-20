'use strict';

const tspan = require('tspan');
const onml = require('onml');
const textWidth = require('./text-width.js');

const isValidTspanJSON = text => {
    let isVld = false ;
    let triedJSON ;
    try {
        triedJSON = JSON.parse(text);
        if (typeof triedJSON === 'object' && triedJSON[0] === 'tspan') {
            isVld = true ;
        }
    } catch(err) {
        isVld = false ;
    }
    return isVld ;
};

module.exports = function ( text, textCssStyleStr, klass = undefined ) {

    if (typeof window != 'undefined') {
        if (!(window.document.getElementById('WaveDrom_Temp_renderArea'))) {
            let renderAreaVar = window.document.createElement('div');
            renderAreaVar.setAttribute('style', 'display:none');
            renderAreaVar.setAttribute('id', 'WaveDrom_Temp_renderArea');
            window.document.body.appendChild(renderAreaVar);
        }
        let tmpSVG ;
        let svgBBox ;
        let tmpSVGstyle = [] ;

        if (typeof window.WaveSkin.collated_wd_reserved === 'undefined') {
            window.WaveSkin.collated_wd_reserved = window.WaveSkin.default ;
        }

        tmpSVGstyle.unshift('style', 
            window.WaveSkin.collated_wd_reserved[2][1],
            window.WaveSkin.collated_wd_reserved[2][2]
        );
                        
        // fontSize and customCssStyle are applied only if text is a string. 
        // If it is a tspan object, just parse it on its own
        let finTSpanObj ;
        if (typeof text === 'string') {
            let modText = text ;
            if (isValidTspanJSON(text)) {
                modText = JSON.parse(text);
            }
            let tspan_arr ;
            tspan_arr = tspan.parse(modText);
            finTSpanObj = tspan_arr ;
        } else {
            finTSpanObj = [text] ;
        }
        // console.log(JSON.stringify(finTSpanObj));
        let tspanned_text = structuredClone(finTSpanObj) ; // tspan.parse(finTSpanObj);
                        
        // tspanned_text.unshift('text', {x: 0, y: 0, style: textCssStyleStr});
        tspanned_text.unshift('text', {x: 0, y: 0, style: textCssStyleStr, class: klass});
        let fullsvg = ['svg', 
            { id: 'WaveDrom_tempRender', viewBox: '0 0 0 0', width: 0, height: 0, xmlns: 'http://www.w3.org/2000/svg' }, 
            tmpSVGstyle,
            tspanned_text];
        const svgtxtelem = onml.stringify(fullsvg) ;        

        window.document.getElementById('WaveDrom_Temp_renderArea').innerHTML = svgtxtelem ;
        tmpSVG = window.document.getElementById('WaveDrom_tempRender');
        if (tmpSVG) {
            window.document.getElementById('WaveDrom_Temp_renderArea').style.display = 'inline-flex' ;
            svgBBox = tmpSVG.getBBox();
            window.document.getElementById('WaveDrom_Temp_renderArea').style.display = 'none' ;
            // console.log('Text : ' + text + ' :: ' + klass + ' :: ' + svgBBox + ' :: ' 
            //  + svgBBox.width + ',' + svgBBox.height + ' @ ' + svgBBox.x + ',' + svgBBox.y);
            return ({
                fBBox: svgBBox,
                tspanres: finTSpanObj
            });
        }
    }
    // useLegacyTextWidth = true
    // DOM-less text width computation works only for font size = 11px, and that is fragile too
    const domLesstxtWidth = textWidth(text) ;
    return ({
        fBBox: {width: domLesstxtWidth,  height: 11, x: 0, y: 0},
        tspanres: tspan.parse(text)
    });

};


/* eslint-env browser */
/* eslint no-unused-vars: 0 no-console: 0*/