'use strict';

const tt = require('onml/tt.js');
const renderLabel = require('./render-label');

const scaled = (d, sx, sy) => {
    if (sy === undefined) {
        sy = sx;
    }
    let i = 0;
    while (i < d.length) {
        switch (d[i].toLowerCase()) {
        case 'h':
            while ((i < d.length) && !isNaN(d[i + 1])) {
                d[i + 1] *= sx; i++;
            }
            break;
        case 'v':
            while ((i < d.length) && !isNaN(d[i + 1])) {
                d[i + 1] *= sy; i++;
            }
            break;
        case 'm':
        case 'l':
        case 't':
            while (((i + 1) < d.length) && !isNaN(d[i + 1])) {
                d[i + 1] *= sx; d[i + 2] *= sy; i += 2;
            }
            break;
        case 'q':
            while (((i + 3) < d.length) && !isNaN(d[i + 1])) {
                d[i + 1] *= sx; d[i + 2] *= sy; d[i + 3] *= sx; d[i + 4] *= sy; i += 4;
            }
            break;
        case 'a':
            while (((i + 6) < d.length) && !isNaN(d[i + 1])) {
                d[i + 1] *= sx; d[i + 2] *= sy; d[i + 6] *= sx; d[i + 7] *= sy; i += 7;
            }
            break;
        }
        i++;
    }
    return d;
};

function scale (d, cfg) {
    if (typeof d === 'string') {
        d = d.trim().split(/[\s,]+/);
    }

    if (!Array.isArray(d)) {
        return;
    }

    return scaled(d, 2 * cfg.hscale * cfg.xs, -cfg.ys);
}

function renderLane (wave, idx, cfg) {
    let retLaneComponents = [];
    if (Array.isArray(wave)) {
        for (let widx = 0; widx < wave.length; widx += 2) {
            const tag = wave[widx];
            const attr = wave[widx + 1];
            if (tag === 'pw' && (typeof attr === 'object')) {
                const d = scale(attr.d, cfg);
                const pwClass = 'pw_default ' + ((attr.pwClass !== undefined) ? attr.pwClass : '');
                const pwStyle = (attr.pwStyle !== undefined) ? attr.pwStyle : '' ;
                let pathAttr = {
                    style: pwStyle,
                    class: pwClass,
                    d: d
                };
                if (attr.class !== undefined) {
                    pathAttr['class'] = attr.class;
                }
                retLaneComponents.push( [
                    'g',  
                    tt(-cfg.xmin_cfg * cfg.xs, cfg.yo * idx + cfg.ys + cfg.y0),
                    ['path', pathAttr]
                ] );
            }
            if (tag === 'tl' && (typeof attr === 'object')) {
                const maxposX = (cfg.xmax_cfg - cfg.xmin_cfg + 1) * cfg.xs ;
                const tlXPos = ((attr.coords[0] * cfg.hscale) - (cfg.xmin_cfg/2)) * 2 * cfg.xs ;
                if ( (tlXPos >= 0) && (tlXPos <= maxposX) ) {
                    let p = { 
                        x: tlXPos, 
                        y: (((1 - attr.coords[1]) * cfg.ys) + (cfg.yo * idx) + cfg.y0),
                        avoidBBox: attr.avoidBBox
                    } ;
                    const tlClass = ((attr.tlClass !== undefined) ? attr.tlClass : '');
                    const tlStyle = (attr.tlStyle !== undefined) ? attr.tlStyle : '' ;
                    const currLabel = renderLabel (
                        p, 
                        attr.text, 
                        tlClass,
                        tlStyle,
                        cfg.tr_upscale
                    );
                    retLaneComponents.push( currLabel );
                }
            }
        }
    }
    return (retLaneComponents) ;
}

function renderPieceWise (lanes, index, cfg) {
    let res = ['g', {}];
    let maxRenderedLaneNum = 0 ;

    lanes.map((row) => {
        const wave = row.wave;
        const tmpidx = row.targetLane ;
        if (tmpidx > maxRenderedLaneNum) {
            maxRenderedLaneNum = tmpidx ;
        }
        if (Array.isArray(wave)) {
            const resarr2push = renderLane(wave, tmpidx, cfg) ;
            resarr2push.map( (elem) => { 
                res.push(elem) ;
            });
        }
    });
    const rpw_minX = cfg.xs * (cfg.xmin_cfg) - 0.5 ;
    const rpw_maxX = cfg.xs * (cfg.xmax_cfg + 1) - 0.5;
    const rpw_maxY = (maxRenderedLaneNum + 1) * cfg.yo ;
    const polyCoordsStrArray = [-0.5, -2,   rpw_maxX - rpw_minX, -2,   rpw_maxX - rpw_minX, rpw_maxY,   -0.5, rpw_maxY];
    const polyCoordsStrForCP = polyCoordsStrArray.join(',');
    res[1] = {
        'id': 'g_pwtl_' + index
    };
    if (cfg.ocfg.wdDisableClipPaths === false) {
        if (cfg.ocfg.wdClipPathModeCss) {
            const polyCoordsStr = polyCoordsStrForCP.replace(/([^,]*),([^,]*,)?/gm, '$1 $2 ');
            res[1]['clip-path'] = 'polygon( ' + polyCoordsStr + ' )';
        } else {
            const cpIdName = 'D' + index + '_PWTL_CP' ; // piecewise / text label clip path
            // Adopt SVG mode for clip paths
            // At element site, use : 'clip-path':'url(#' + 'D?_PWTL_CP' + ')' ;
            if (cfg.ocfg.wdScratchpad['clipPath2Add2Defs'] === undefined) {
                cfg.ocfg.wdScratchpad['clipPath2Add2Defs'] = [];
            }
            cfg.ocfg.wdScratchpad['clipPath2Add2Defs'].push([
                'clipPath', { id: cpIdName },
                ['polygon', { points: polyCoordsStrForCP }]
            ]);
            res[1]['clip-path'] = 'url(#' + cpIdName + ')';
        }
    } 
    if (cfg.downscale !== 1) {
        res[1]['transform'] = 'scale(' + cfg.downscale + ' 1)' ;
    }
    return res;
}
/* eslint no-console: 0 */

module.exports = renderPieceWise;