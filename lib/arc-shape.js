'use strict';

const getRenderedTextBox = require('./get-rendered-text-box.js');

function getLabPos (mod_fx, mod_tx, mod_fy, strLabPos, Edge, arcLen, customClass, customStyle) {

    let lp_x = (mod_fx + mod_tx) / 2.00 ;
    let lp_y = mod_fy ;

    const labPos = parseInt(strLabPos);

    // console.log(JSON.stringify(Edge));

    const finalClassSet = 'arc_label_default arc_label ' + ((customClass !== undefined) ? customClass : '');
    const renderedTxtWithDim = getRenderedTextBox(Edge.label || '', customStyle, finalClassSet);
    const w = renderedTxtWithDim.fBBox.width ;
    const hbOffset = 2 + Math.abs(renderedTxtWithDim.fBBox.y);
    const htOffset = 2 + (renderedTxtWithDim.fBBox.height / 2.00);
    // const h = renderedTxtWithDim.fBBox.height ;
    // default case with position 0 is right in the middle of the line

    // other possible label positions documented below
    //  8   1   2
    // 7    0     3
    //  6   5   4
    if ([2, 4].includes(labPos)) {
        lp_x = mod_tx + (arcLen / 2) ;
    } else if (labPos == 3) {
        lp_x = mod_tx + (w / 2.00) + arcLen ;
    } else if ([6, 8].includes(labPos)) {
        lp_x = mod_fx - (arcLen / 2) ;
    } else if (labPos == 7) {
        lp_x = mod_fx - (w / 2.00) - arcLen;
    }

    if ([1, 2, 8].includes(labPos)) {
        // lp_y -= (2 + (h / 2.00)) ;
        lp_y -= htOffset ;
    } else if ([4, 5, 6].includes(labPos)) {    
        // lp_y += (2 + (h / 2.00)) ;
        lp_y += hbOffset ;
    }

    // console.log(JSON.stringify(renderedTxtWithDim.fBBox) + ' :::: ' + JSON.stringify(lp_y));

    if (Edge.label) {
        return ([lp_x, lp_y]) ;
    } else {
        return ([undefined, undefined]) ;
    }

} /* eslint no-console: 0 */

function arcShapeWithLabPos (Edge, from, to, customClass, customStyle) {

    let lx = ((from.x + to.x) / 2);
    let ly = ((from.y + to.y) / 2);
    let d;
    let klass;

    const labPos = Edge.shape[1];
    Edge.shape = Edge.shape[0] + Edge.shape[2];

    const mod_fx = (from.x > to.x) ? to.x : from.x ;
    const mod_tx = (from.x > to.x) ? from.x : to.x ;
    // swapped from and to to be sorted in increasing order for mod_fx and mod_tx

    if (Edge.shape === '><') {
        klass = 'arc_arrow arc_arrow_twosided' ;
        d = ('M ' + mod_fx + ',' + from.y + ' l -15 0 M ' + to.x + ',' + to.y + ' ' + to.x + ',' + from.y +
                ' M ' + (mod_tx + 15) + ',' + from.y + ' l -15 0');
        [lx, ly] = (getLabPos (mod_fx, mod_tx, from.y, labPos, Edge, 15, customClass, customStyle));
    } else if (Edge.shape === '<>') {
        const mpx = (mod_tx - mod_fx) / 2.00 ;
        klass = 'arc_arrow arc_arrow_twosided' ;
        d = ('M ' + mod_fx + ',' + from.y + ' l ' + mpx + ' 0 M ' + to.x + ',' + to.y + ' ' + to.x + ',' + from.y +
                ' M ' + (mod_fx + mpx) + ',' + from.y + ' l ' + (mpx) + ' 0');
        [lx, ly] = (getLabPos (mod_fx, mod_tx, from.y, labPos, Edge, 2.5, customClass, customStyle));
    } else if (Edge.shape === '++') {
        klass = 'arc_bracket';
        d = ('M ' + mod_fx + ',' + from.y + ' ' + to.x + ',' + from.y);
        [lx, ly] = (getLabPos (mod_fx, mod_tx, from.y, labPos, Edge, 2.5, customClass, customStyle));
    } else {
        klass = 'arc_error' ;
    }

    return {
        lx: lx,
        ly: ly,
        d: d,
        klass: klass
    };

}

function getPathForArcSpecifier (arcShapeSpec, from, dx, dy) {

    let d;

    if (arcShapeSpec === '~') {
        if (dx <= 32) { // Too narrow to get a proper S curve with the legacy path spec
            d = ('M ' + from.x + ',' + from.y + ' ' + 'c 40 15 ' +  (dx - 40) + ' ' + (dy - 15) + ' ' + dx + ' ' + dy);
        } else {
            d = ('M ' + from.x + ',' + from.y + ' ' + 'c ' + (0.7 * dx) + ', 0 ' + 0.3 * dx + ', ' + dy + ' ' + dx + ', ' + dy);
        }
    } else if (arcShapeSpec === '-~') {
        d = ('M ' + from.x + ',' + from.y + ' ' + 'c ' + (0.7 * dx) + ', 0 ' +     dx + ', ' + dy + ' ' + dx + ', ' + dy);
    } else if (arcShapeSpec === '~-') {
        d = ('M ' + from.x + ',' + from.y + ' ' + 'c ' + 0      + ', 0 ' + (0.3 * dx) + ', ' + dy + ' ' + dx + ', ' + dy);
    } else if (arcShapeSpec === '-|') {
        d = ('m ' + from.x + ',' + from.y + ' ' + dx + ',0 0,' + dy);
    } else if (arcShapeSpec === '-|-') {
        d = ('m ' + from.x + ',' + from.y + ' ' + (dx / 2) + ',0 0,' + dy + ' ' + (dx / 2) + ',0');
    } else if (arcShapeSpec === '|-') {
        d = ('m ' + from.x + ',' + from.y + ' 0,' + dy + ' ' + dx + ',0');
    }

    return d ;
}

function arcShapeWithNumArrows (arcShapeSpec, numArrows, label, from, to) {

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let lx = ((from.x + to.x) / 2);
    let ly = ((from.y + to.y) / 2);
    let d;
    let klass ;

    d = getPathForArcSpecifier (arcShapeSpec, from, dx, dy);

    if (label) {
        if (arcShapeSpec === '-~') {
            lx = (from.x + (dx * 0.75)) ;
        } else if (arcShapeSpec === '~-') {
            lx = (from.x + (dx * 0.25)) ;
        } else if (arcShapeSpec === '-|') {
            lx = to.x ;
        } else if (arcShapeSpec === '|-') {
            lx = from.x ;
        }
    }

    if (arcShapeSpec === '+') {
        klass = 'arc_bracket' ;
    }
    if (numArrows === 1) {
        klass = 'arc_arrow' ;
    } else if (numArrows === 2) {
        klass = 'arc_arrow arc_arrow_twosided' ;
    }
    if ((d === undefined) && (!(['-', '+'].includes(arcShapeSpec)))) {
        klass = 'arc_error' ;
    }

    return {
        lx: lx,
        ly: ly,
        d: d,
        klass: klass
    };

}

function arcShape (Edge, from, to, customClass, customStyle) {

    // console.log(JSON.stringify({Edge: Edge, from: from, to: to, class: customClass, style: customStyle})) ;
    const arrowsShapes = ['>', '<', '+'] ;
    if (arrowsShapes.includes(Edge.shape[0]) && arrowsShapes.includes(Edge.shape[1])) {
        // Only arrows and nothing inbetween case
        let shapeArr = Edge.shape.split('');
        shapeArr.splice(1, 0, '0');
        Edge.shape = shapeArr.join('');
        // Convert to default label position
    }
    const secondCharIsLabPos = ([...Array(9).keys()].includes(parseInt(Edge.shape[1]))) ; 
    if (secondCharIsLabPos && (Edge.shape.length === 3)) {
        // We have a specification with label position meant to
        // force horizontal arcs irrespective of the 'to' node location
        return (arcShapeWithLabPos(Edge, from, to, customClass, customStyle)) ;
    }

    const numArrows = 0 + // default is no arrows
        ((Edge.shape[Edge.shape.length-1] === '>') ? 1 : 0) + 
        ((Edge.shape[0] === '<') ? 1 : 0) ;
    const arrowlessShape = Edge.shape.replace('<', '').replace('>', '');

    return (arcShapeWithNumArrows(arrowlessShape, numArrows, Edge.label, from, to)) ;

} /* eslint no-console: 0 */ 

module.exports = arcShape;
