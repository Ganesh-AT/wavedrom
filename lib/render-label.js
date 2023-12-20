'use strict';

// const tspan = require('tspan');
const tt = require('onml/tt.js');
// const textWidth = require('./text-width.js');
const getRenderedTextBox = require('./get-rendered-text-box.js');

//const convertCssToObject = value => {
//    const regex = /([\w-.]+)\s*:([^;]+);?/g, o = {};
//    value.replace(regex, (m, p, v) => o[p] = v);
//    return o;
//};

function renderLabel (p, text, customClass, customStyle, uscalef) {

    // console.log ('text: ' + text + ' ; uscalef: ' + uscalef) ;
    const finalClassSet = 'arc_label_default arc_label ' + ((customClass !== undefined) ? customClass : '');
    const renderedTxtWithDim = getRenderedTextBox(text, customStyle, finalClassSet) ;
    const tbw = renderedTxtWithDim.fBBox.width ; // + 2.00 ;
    const tbh = renderedTxtWithDim.fBBox.height ; // + 2.00 ;
    const bx = renderedTxtWithDim.fBBox.x ; // - 1.00 ; 
    const by = renderedTxtWithDim.fBBox.y ; // - 1.00 ; 

    const fillclass = (typeof p.avoidBBox !== 'undefined') ? 
        (p.avoidBBox == true) ? 'arc_label_bg_transparent' : 'arc_label_bg_white' : 'arc_label_bg_white' ;

    const rectProps = {
        x: bx,
        y: by,
        width: tbw,
        height: tbh,
        class: fillclass
    };
    const txtProps = {
        class: finalClassSet,
        style: customStyle
    };
    if (uscalef !== 1) {
        rectProps['transform'] = 'scale(' + uscalef + ' 1)';
        txtProps['transform'] = 'scale(' + uscalef + ' 1)';
    }
    
    return ['g',
        tt(p.x, p.y),
        ['rect', rectProps],
        ['text', txtProps].concat(renderedTxtWithDim.tspanres)
    ];
} 
/*eslint-env browser */
/*eslint no-console: 0*/

module.exports = renderLabel;
