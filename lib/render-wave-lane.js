'use strict';

const tt = require('onml/tt.js');
const tspan = require('tspan');
// const textWidth = require('./text-width.js');
const getRenderedTextBox = require('./get-rendered-text-box.js');
const findLaneMarkers = require('./find-lane-markers.js');
const renderOverUnder = require('./render-over-under.js');

function renderLaneUses (cont, lane, lclip_amt, idStr, tconfig) {
    const res = [];
    const textCssStyleStr = (cont[3].dlStyle !== undefined) ? cont[3].dlStyle : '';
    const textClass = (cont[3].dlClass === undefined) ? 'data_label' : cont[3].dlClass ;

    if (cont[1]) {
        cont[1].map(function (ref, i) {
            let resAttr = { 'xlink:href' : '#' + ref };
            // Handle gaps created in the first brick due to phase specifications
            if ((i == 0) && (lclip_amt != 0) && (!tconfig.wdDisableClipPaths)) {
                const modLClipAmt = lclip_amt - 0.5 ;
                const polyCoordsStrArray = [modLClipAmt, -2,   22, -2,   22, 22,   modLClipAmt, 22];
                const polyCoordsStrForCP = polyCoordsStrArray.join(',');
                if (tconfig.wdClipPathModeCss) {
                    const polyCoordsStr = polyCoordsStrForCP.replace(/([^,]*),([^,]*,)?/gm, '$1 $2 ');
                    resAttr['clip-path'] = 'polygon( ' + polyCoordsStr + ' )';
                } else {
                    const cpIdName = idStr + 'FB_CP' ; // first-brick clip path
                    // Adopt SVG mode for clip paths
                    // At element site, use : 'clip-path':'url(#' + 'D?_L?_FB_CP' + ')' ;
                    if (tconfig.wdScratchpad['clipPath2Add2Defs'] === undefined) {
                        tconfig.wdScratchpad['clipPath2Add2Defs'] = [];
                    }
                    tconfig.wdScratchpad['clipPath2Add2Defs'].push([
                        'clipPath', { id: cpIdName },
                        ['polygon', { points: polyCoordsStrForCP }]
                    ]);
                    resAttr['clip-path'] = 'url(#' + cpIdName + ')';
                }
            }
            res.push(['use', tt(i * lane.xs, 0, resAttr)]);
        });
        if (cont[2] && cont[2].length) {
            const labels = findLaneMarkers(cont[1]);
            if (labels.length) {
                labels.map(function (label, i) {
                    if (cont[2] && (cont[2][i] !== undefined)) {
                        const renderedTxtWithDim = getRenderedTextBox(cont[2][i], textCssStyleStr, textClass) ;
                        const txtProps = {
                            style: textCssStyleStr,
                            'text-anchor': 'middle',
                            'xml:space': 'preserve',
                            class: textClass
                        };
                        if (lane.tr_upscale !== 1) {
                            txtProps['transform'] = 'scale(' + lane.tr_upscale + ' 1)';
                        }
                        //const tbw = renderedTxtWithDim.fBBox.width ; // + 2.00 ;
                        //const tbh = renderedTxtWithDim.fBBox.height ; // + 2.00 ;
                        //const bx = renderedTxtWithDim.fBBox.x + (label * lane.xs) + lane.xlabel ; // - 1.00 ; 
                        //const by = renderedTxtWithDim.fBBox.y + lane.ym ; // - 1.00 ; 
                        const bx = (label * lane.xs) + lane.xlabel ; // - 1.00 ; 
                        const by = lane.ym ; // - 1.00 ; 
                        res.push( 
                            ['g', tt(bx, by),
                                ['text', txtProps].concat(renderedTxtWithDim.tspanres)]) ;
                    }
                });
            }
        }
    }
    return res;
}

function renderWaveLane (content, index, lane, tconfig) {
    let xmax = 0;
    const glengths = [];
    const res = [];

    content.map(function (el, j) {
        const name = el[0][0];
        if (name) { // check name
            let xoffset = el[0][1];
            xoffset = (xoffset > 0)
                ? (Math.ceil(2 * xoffset) - 2 * xoffset)
                : (-2 * xoffset);
            let phased_lane = xoffset * lane.xs ;
            let pl_for_xlate = phased_lane ;
            let tgtlane = (el[0][2] > -1) ? el[0][2] : j ;
            let wldobj = { id: 'wavelane_draw_' + j + '_' + index };
            const laneIdStrPrefix = 'D' + index + '_L' + j  + '_' ;
            if (tconfig.wdDisableClipPaths === false) {
                if ((phased_lane != 0) && (phased_lane <= lane.xs) && (el[0][1] != (lane.xmin_cfg / 2)) && (el[0][1] > 0)) {
                    phased_lane -= lane.xs ;
                } // phase is active, need to handle initial brick
                // If hbounds upper limit is specified, then set rectangular polygon as clip path for wavelane_draw segment
                // -phased_lane -2, lane.xmax_cfg-phased_lane -2,  lane.xmax_cfg-phased_lane 22, -phased_lane 22
                pl_for_xlate = phased_lane ;
                if (lane.downscale !== 1) {
                    wldobj['transform'] = 'scale(' + lane.downscale + ' 1)';
                    if (pl_for_xlate !== 0) {
                        wldobj['transform'] += (' translate(' + pl_for_xlate + ')');
                        pl_for_xlate = 0 ;
                    }
                }
                if (lane.xmax_cfg < 1e6) {
                    const cprx1 = -phased_lane ;
                    const cprx2 = ((lane.xmax_cfg - lane.xmin_cfg + 1) * lane.xs) - phased_lane ;
                    // The +1 is for compatibility with legacy implementation of hbounds[1]
                    const polyCoordsStrArray = [cprx1-0.5, -2,   cprx2-0.5, -2,   cprx2-0.5, 22,   cprx1-0.5, 22];
                    // The 22 should be lane.ys? + 2 (in case we have bricks that are not of height 20)
                    const polyCoordsStrForCP = polyCoordsStrArray.join(',');
                    if (tconfig.wdClipPathModeCss) {
                        const polyCoordsStr = polyCoordsStrForCP.replace(/([^,]*),([^,]*,)?/gm, '$1 $2 ');
                        wldobj['clip-path'] = 'polygon( ' + polyCoordsStr + ' )';
                    } else {
                        const cpIdName = 'D' + index + 'L' + j + '_FL_CP' ; // full-lane clip path
                        // Adopt SVG mode for clip paths
                        // At element site, use : 'clip-path':'url(#' + 'D?_L?_FB_CP' + ')' ;
                        if (tconfig.wdScratchpad['clipPath2Add2Defs'] === undefined) {
                            tconfig.wdScratchpad['clipPath2Add2Defs'] = [];
                        }
                        tconfig.wdScratchpad['clipPath2Add2Defs'].push([
                            'clipPath', { id: cpIdName },
                            ['polygon', { points: polyCoordsStrForCP }]
                        ]);
                        wldobj['clip-path'] = 'url(#' + cpIdName + ')';                        
                    }
                }
            }

            res.push(['g', tt(
                0,
                lane.y0 + tgtlane * lane.yo,
                {id: 'wavelane_' + j + '_' + index}
            )]
                .concat([['text', {
                    x: lane.tgo,
                    y: lane.ym,
                    class: 'info lane_label',
                    'text-anchor': 'end',
                    'xml:space': 'preserve'
                }]
                    .concat(tspan.parse(name))
                ])
                .concat([['g', tt(
                    pl_for_xlate,
                    0,
                    wldobj
                )]
                    .concat(renderLaneUses(el, lane, -phased_lane, laneIdStrPrefix, tconfig))
                ])
                .concat(
                    renderOverUnder(el[3], 'over', lane),
                    renderOverUnder(el[3], 'under', lane)
                )
            );
            xmax = Math.max(xmax, xoffset + (el[1] || []).length);
            const renderedTxtWithDim = getRenderedTextBox(name, '', 'info lane_label') ;
            // console.log('Name : ' + JSON.stringify(name) + 
            //    ' :: Width : ' + JSON.stringify(renderedTxtWithDim));
            glengths.push(renderedTxtWithDim.fBBox.width) ;
            // glengths.push(name.textWidth ? name.textWidth : name.charCodeAt ? textWidth(name, 11) : 0);
        }
    });
    // xmax if no xmax_cfg,xmin_cfg, else set to config
    lane.xmax = Math.min(xmax, lane.xmax_cfg - lane.xmin_cfg);
    const xgmax = 0;
    lane.xg = xgmax + 20;
    return {glengths: glengths, res: res};
}
/* eslint no-console: 0 */

module.exports = renderWaveLane;
